import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-cron',
};

const VERSION = '2026-05-07-v7-tuned';
const HARD_DEADLINE_MS = 20_000; // stop pulling new steps after 20s
const MAX_STEPS_PER_RUN = 10;     // smaller batch to reduce DB pressure
const STEP_INVOKE_TIMEOUT_MS = 8_000;

async function getAuthenticatedUserId(supabase: any, req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function userCanAccessOrganization(supabase: any, userId: string, organizationId: string) {
  const [{ data: membership }, { data: role }] = await Promise.all([
    supabase.from('organization_members').select('id').eq('user_id', userId).eq('organization_id', organizationId).maybeSingle(),
    supabase.from('user_roles').select('id').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
  ]);
  return Boolean(membership || role);
}

async function handleManualReprocess(supabase: any, req: Request, stepId: string) {
  const userId = await getAuthenticatedUserId(supabase, req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: step } = await supabase
    .from('automation_scheduled_steps')
    .select('id, organization_id, status, scheduled_at')
    .eq('id', stepId).maybeSingle();

  if (!step) {
    return new Response(JSON.stringify({ error: 'Step não encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!(await userCanAccessOrganization(supabase, userId, step.organization_id))) {
    return new Response(JSON.stringify({ error: 'Sem permissão' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: rpcError } = await supabase.rpc('reprocess_scheduled_step', { target_step_id: stepId });
  if (rpcError) {
    await supabase.from('automation_scheduled_steps')
      .update({ status: 'pending', scheduled_at: new Date().toISOString() })
      .eq('id', stepId);
  }
  return new Response(JSON.stringify({ success: true, step_id: stepId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function processOneStep(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  step: any,
): Promise<{ ok: boolean; error?: string }> {
  // Mark as processing (optimistic claim)
  const { data: claimed, error: claimErr } = await supabase
    .from('automation_scheduled_steps')
    .update({ status: 'processing' })
    .eq('id', step.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (claimErr || !claimed) {
    return { ok: false, error: 'already_claimed' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STEP_INVOKE_TIMEOUT_MS);

    const resp = await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'X-Internal-Cron': 'true',
      },
      body: JSON.stringify({
        automation_id: step.automation_id,
        execution_id: step.execution_id,
        contact_id: step.contact_id,
        trigger_event: 'scheduled_resume',
        resume_from_step: step.current_step || 0,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`process-automation HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }

    await supabase.from('automation_scheduled_steps')
      .update({ status: 'completed' })
      .eq('id', step.id);

    return { ok: true };
  } catch (err) {
    const msg = (err as Error).message || 'unknown';
    await supabase.from('automation_scheduled_steps')
      .update({
        status: 'error',
        last_error: msg,
        retry_count: (step.retry_count || 0) + 1,
      })
      .eq('id', step.id);
    return { ok: false, error: msg };
  }
}

async function processPendingSteps(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
) {
  const startedAt = Date.now();
  const summary = { picked: 0, ok: 0, failed: 0, errors: [] as string[] };

  // Recover stuck "processing" steps older than 5 min
  await supabase
    .from('automation_scheduled_steps')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .lt('scheduled_at', new Date(Date.now() - 5 * 60_000).toISOString());

  // Auto-retry failed steps with backoff (max 5 retries)
  // Only retry transient errors like timeouts or connection issues
  const { data: retriableSteps } = await supabase
    .from('automation_scheduled_steps')
    .select('id, retry_count, last_error')
    .eq('status', 'error')
    .lt('retry_count', 5)
    .or('last_error.ilike.%timeout%,last_error.ilike.%connection%,last_error.ilike.%544%,last_error.ilike.%failed to fetch%')
    .limit(10);

  if (retriableSteps && retriableSteps.length > 0) {
    for (const step of retriableSteps) {
      const backoffMinutes = Math.pow(2, step.retry_count || 0);
      const nextRun = new Date(Date.now() + backoffMinutes * 60000).toISOString();
      
      await supabase
        .from('automation_scheduled_steps')
        .update({ 
          status: 'pending', 
          scheduled_at: nextRun,
          last_error: `Auto-retry scheduled (Attempt ${step.retry_count + 1})`
        })
        .eq('id', step.id);
      
      console.log(`[ScheduledSteps] Scheduled auto-retry for step ${step.id} in ${backoffMinutes}m`);
    }
  }

  while (Date.now() - startedAt < HARD_DEADLINE_MS && summary.picked < MAX_STEPS_PER_RUN) {
    const { data: steps, error } = await supabase
      .from('automation_scheduled_steps')
      .select('id, automation_id, execution_id, contact_id, organization_id, current_step, retry_count, scheduled_at')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (error) {
      summary.errors.push(`fetch: ${error.message}`);
      break;
    }
    if (!steps || steps.length === 0) break;

    for (const step of steps) {
      if (Date.now() - startedAt >= HARD_DEADLINE_MS) break;
      summary.picked += 1;
      const result = await processOneStep(supabase, supabaseUrl, serviceKey, step);
      if (result.ok) summary.ok += 1;
      else {
        summary.failed += 1;
        if (result.error) summary.errors.push(result.error);
      }
    }
  }

  return summary;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse body
    let body: any = {};
    if (req.method === 'POST') {
      const text = await req.text();
      if (text) {
        try { body = JSON.parse(text); } catch { body = {}; }
      }
    }

    if (body?.action === 'ping') {
      return new Response(JSON.stringify({ status: 'ok', version: VERSION }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body?.action === 'reprocess_step' && body?.step_id) {
      return await handleManualReprocess(supabase, req, body.step_id);
    }

    // Default: process pending scheduled steps (cron entrypoint)
    const summary = await processPendingSteps(supabase, supabaseUrl, serviceKey);

    return new Response(JSON.stringify({ status: 'ok', version: VERSION, ...summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
