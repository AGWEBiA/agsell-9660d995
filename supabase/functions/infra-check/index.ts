import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)),
  ]);
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    database: { status: 'unknown', error: null },
    rpc_check: { exists: false, error: null },
    edge_functions: {} as Record<string, any>,
  };

  // 1. DB connectivity (3s timeout)
  try {
    const res = await withTimeout(
      supabase.from('automations').select('count', { count: 'exact', head: true }),
      3000,
      'db'
    );
    diagnostics.database.status = (res as any).error ? 'degraded' : 'ok';
    diagnostics.database.error = (res as any).error?.message ?? null;
  } catch (e: any) {
    diagnostics.database.status = 'error';
    diagnostics.database.error = e.message;
  }

  // 2. RPC existence check (3s timeout) - dummy uuid won't mutate anything
  try {
    const res: any = await withTimeout(
      supabase.rpc('reprocess_scheduled_step', { target_step_id: '00000000-0000-0000-0000-000000000000' }),
      3000,
      'rpc'
    );
    if (res.error && res.error.code === '42883') {
      diagnostics.rpc_check.exists = false;
    } else {
      diagnostics.rpc_check.exists = true;
    }
    diagnostics.rpc_check.error = res.error?.message ?? null;
  } catch (e: any) {
    diagnostics.rpc_check.error = e.message;
  }

  // 3. Edge functions ping in parallel with 4s timeout each
  const functions = ['process-scheduled-steps', 'process-automation', 'send-whatsapp'];
  await Promise.all(functions.map(async (name) => {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${supabaseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      }, 4000);
      diagnostics.edge_functions[name] = {
        status: res.ok ? 'online' : 'error',
        latency: Date.now() - start,
        status_code: res.status,
      };
      try { await res.text(); } catch { /* noop */ }
    } catch (e: any) {
      diagnostics.edge_functions[name] = {
        status: 'offline',
        latency: Date.now() - start,
        error: e.message,
      };
    }
  }));

  return new Response(JSON.stringify(diagnostics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
