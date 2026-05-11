
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { error_id, message, severity, module, deploy_id, stack_trace } = await req.json();

    console.log(`[ALERT] Error ${error_id} - Severity: ${severity} - Module: ${module}`);

    // Simulação de envio de notificação (Email/Slack)
    // Se houver conector Slack ou SendGrid, aqui seriam chamados
    
    // Log interno detalhado
    await supabase.from('system_logs').insert({
      event: 'critical_error_alert',
      level: 'error',
      message: `Critical Error Alert: ${message}`,
      payload: { error_id, severity, module, deploy_id, stack_trace },
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
