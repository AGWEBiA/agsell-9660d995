
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, handleHealthCheck, corsHeaders } from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const healthRes = await handleHealthCheck(req, 'notify-error-alert');
  if (healthRes) return healthRes;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { error_id, message, severity, module, deploy_id, stack_trace } = await req.json();

    console.log(`[ALERT] Error ${error_id} - Severity: ${severity} - Module: ${module}`);

    // Simulation of sending notification (Email/Slack)
    // If there is a Slack or SendGrid connector, they would be called here
    
    // Detailed internal log
    await supabase.from('system_logs').insert({
      event: 'critical_error_alert',
      level: 'error',
      message: `Critical Error Alert: ${message}`,
      payload: { error_id, severity, module, deploy_id, stack_trace },
      deploy_id: deploy_id || Deno.env.get('DENO_DEPLOYMENT_ID'),
      organization_id: '00000000-0000-0000-0000-000000000000' // Global admin org if exists
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

