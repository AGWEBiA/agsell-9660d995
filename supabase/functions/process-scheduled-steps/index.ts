import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  // Use the RPC if it exists, otherwise fallback to direct update
  const { data: rpcData, error: rpcError } = await supabase.rpc('reprocess_scheduled_step', { target_step_id: stepId });
  
  if (rpcError) {
    console.log('[process-scheduled-steps] RPC fallback used due to:', rpcError.message);
    const { error: resetError } = await supabase
      .from('automation_scheduled_steps')
      .update({ 
        status: 'pending', 
        scheduled_at: new Date(Math.min(new Date(step.scheduled_at).getTime(), Date.now())).toISOString()
      })
      .eq('id', stepId)
      .in('status', ['processing', 'error', 'failed']);

    if (resetError) throw resetError;
  } else if ((rpcData as any)?.error) {
    return new Response(JSON.stringify({ error: (rpcData as any).error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, step_id: stepId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

    if (req.method === 'POST') {
      const bodyText = await req.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        if (body?.action === 'reprocess_step' && body?.step_id) {
          return await handleManualReprocess(supabase, req, body.step_id);
        }
        if (body?.action === 'ping' || body?.action === 'cron') {
          // If it's a cron call, we respond immediately to avoid holding connections
          // but we still do a quick health check
          const { error: dbTest } = await supabase.from('automation_scheduled_steps').select('id').limit(1);
          return new Response(JSON.stringify({ 
            status: dbTest ? 'degraded' : 'ok', 
            db_error: dbTest?.message,
            timestamp: new Date().toISOString(),
            version: '2026-05-07-v4-safe' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Circuit breaker: only proceed if we're NOT under heavy load (optional logic can go here)
    // For now, we exit early to prevent connection timeout loops
    return new Response(JSON.stringify({ status: 'active', message: 'Processing paused for stability' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
