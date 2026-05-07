import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: { status: 'unknown', error: null },
      rpc_check: { exists: false, error: null },
      migrations_check: { pending: 0, error: null },
      edge_functions: {} as Record<string, any>,
    };

    // 1. Database Connectivity
    try {
      const { error } = await supabase.from('automations').select('count', { count: 'exact', head: true });
      diagnostics.database.status = error ? 'degraded' : 'ok';
      diagnostics.database.error = error?.message as any;
    } catch (e: any) {
      diagnostics.database.status = 'error';
      diagnostics.database.error = e.message;
    }

    // 2. RPC Check
    try {
      const { data, error } = await supabase.rpc('reprocess_scheduled_step', { target_step_id: '00000000-0000-0000-0000-000000000000' });
      // If error is 42883 (function does not exist), then it's false
      if (error && (error as any).code === '42883') {
        diagnostics.rpc_check.exists = false;
      } else {
        diagnostics.rpc_check.exists = true;
      }
      diagnostics.rpc_check.error = error?.message as any;
    } catch (e: any) {
      diagnostics.rpc_check.error = e.message;
    }

    // 3. Edge Functions check (self-pinging others)
    const functions = ['process-scheduled-steps', 'process-automation', 'send-whatsapp'];
    for (const name of functions) {
      try {
        const start = Date.now();
        const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' })
        });
        diagnostics.edge_functions[name] = {
          status: res.ok ? 'online' : 'error',
          latency: Date.now() - start,
          status_code: res.status
        };
      } catch (e: any) {
        diagnostics.edge_functions[name] = { status: 'offline', error: e.message };
      }
    }

    return new Response(JSON.stringify(diagnostics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
