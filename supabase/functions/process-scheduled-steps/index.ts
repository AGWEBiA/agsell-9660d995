import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROCESS_AUTOMATION_TIMEOUT_MS = 25_000;

async function getAuthenticatedUserId(supabase: ReturnType<typeof createClient>, req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function userCanAccessOrganization(supabase: ReturnType<typeof createClient>, userId: string, organizationId: string) {
  const [{ data: membership }, { data: role }] = await Promise.all([
    supabase.from('organization_members').select('id').eq('user_id', userId).eq('organization_id', organizationId).maybeSingle(),
    supabase.from('user_roles').select('id').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
  ]);

  return Boolean(membership || role);
}

async function handleManualReprocess(supabase: ReturnType<typeof createClient>, req: Request, stepId: string) {
  const userId = await getAuthenticatedUserId(supabase, req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: step, error: stepError } = await supabase
    .from('automation_scheduled_steps')
    .select('id, organization_id, status, scheduled_at')
    .eq('id', stepId)
    .maybeSingle();

  if (stepError) throw stepError;
  if (!step) {
    return new Response(JSON.stringify({ error: 'Step não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const hasAccess = await userCanAccessOrganization(supabase, userId, step.organization_id);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Sem permissão' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!['processing', 'error', 'failed'].includes(step.status)) {
    return new Response(JSON.stringify({ error: `Step não está travado (status atual: ${step.status})` }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: resetError } = await supabase
    .from('automation_scheduled_steps')
    .update({ status: 'pending', scheduled_at: new Date(Math.min(new Date(step.scheduled_at).getTime(), Date.now())).toISOString() })
    .eq('id', stepId)
    .in('status', ['processing', 'error', 'failed']);

  if (resetError) throw resetError;

  return new Response(JSON.stringify({ success: true, step_id: stepId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('process-automation timeout'), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// This function is called by pg_cron every minute to process scheduled automation steps
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('[process-scheduled-steps] Missing environment variables', {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(serviceKey),
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (req.method === 'POST') {
      const bodyText = await req.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        if (body?.action === 'reprocess_step' && body?.step_id) {
          return await handleManualReprocess(supabase, req, body.step_id);
        }
      }
    }

    // Find pending scheduled steps that are due
    const { data: pendingSteps, error: fetchError } = await supabase
      .from('automation_scheduled_steps')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[process-scheduled-steps] fetch error:', fetchError);
      throw fetchError;
    }
    console.log(`[process-scheduled-steps] Found ${pendingSteps?.length ?? 0} pending steps`);
    if (!pendingSteps || pendingSteps.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const step of pendingSteps) {
      try {
        // Mark as processing
        await supabase
          .from('automation_scheduled_steps')
          .update({ status: 'processing' })
          .eq('id', step.id);

        // Always use service role key for internal cron calls
        // User JWT tokens expire and cannot be used for delayed resumption
        const resp = await fetchWithTimeout(`${supabaseUrl}/functions/v1/process-automation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'X-Internal-Cron': 'true',
          },
          body: JSON.stringify({
            automation_id: step.automation_id,
            contact_id: step.contact_id,
            trigger_event: 'scheduled_resume',
            resume_from_step: step.current_step,
            execution_id: step.execution_id,
          }),
        }, PROCESS_AUTOMATION_TIMEOUT_MS);

        if (resp.ok) {
          await supabase
            .from('automation_scheduled_steps')
            .update({ status: 'completed' })
            .eq('id', step.id);
          processed++;
        } else {
          const errBody = await resp.text();
          const severity = resp.status >= 500 ? 'critical' : (resp.status === 401 || resp.status === 403 ? 'high' : 'medium');
          console.error(`[process-scheduled-steps] Step ${step.id} failed (${resp.status}):`, errBody);
          await supabase
            .from('automation_scheduled_steps')
            .update({ status: 'error' })
            .eq('id', step.id);
          await supabase.from('security_alerts').insert({
            organization_id: step.organization_id,
            alert_type: 'automation_step_failed',
            severity,
            title: `Falha ao processar automação (HTTP ${resp.status})`,
            description: `Step ${step.id} retornou ${resp.status}. Detalhes: ${String(errBody).slice(0, 500)}`,
            metadata: {
              step_id: step.id,
              automation_id: step.automation_id,
              contact_id: step.contact_id,
              execution_id: step.execution_id,
              http_status: resp.status,
              error_body: String(errBody).slice(0, 1000),
            },
          });
          errors++;
        }
      } catch (stepErr) {
        const msg = (stepErr as Error)?.message ?? String(stepErr);
        console.error(`[process-scheduled-steps] Exception on step ${step.id}:`, msg);
        await supabase
          .from('automation_scheduled_steps')
          .update({ status: 'error' })
          .eq('id', step.id);
        await supabase.from('security_alerts').insert({
          organization_id: step.organization_id,
          alert_type: 'automation_step_exception',
          severity: 'high',
          title: 'Exceção ao processar automação agendada',
          description: msg.slice(0, 500),
          metadata: {
            step_id: step.id,
            automation_id: step.automation_id,
            contact_id: step.contact_id,
            execution_id: step.execution_id,
          },
        });
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingSteps.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process scheduled steps error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
