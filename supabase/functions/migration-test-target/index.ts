import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const targetUrl = Deno.env.get("TARGET_SUPABASE_URL");
  const targetKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    secrets: {
      TARGET_SUPABASE_URL: targetUrl || "MISSING",
      TARGET_SUPABASE_URL_host: targetUrl ? (() => { try { return new URL(targetUrl).host; } catch { return "INVALID_URL"; } })() : "MISSING",
      TARGET_SUPABASE_SERVICE_ROLE_KEY: targetKey ? `***${targetKey.slice(-6)} (len=${targetKey.length})` : "MISSING",
    },
  };

  if (!targetUrl || !targetKey) {
    return new Response(JSON.stringify({ ok: false, error: "Secrets ausentes", ...result }, null, 2), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Test 1: ping REST API
  try {
    const r = await fetch(`${targetUrl}/rest/v1/`, {
      headers: { apikey: targetKey, Authorization: `Bearer ${targetKey}` },
    });
    result.rest_ping = { status: r.status, ok: r.ok };
    await r.text();
  } catch (e: any) {
    result.rest_ping = { error: e.message };
  }

  // Test 2: try to query auth.users via Admin API
  try {
    const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
    const { data, error } = await target.auth.admin.listUsers({ page: 1, perPage: 1 });
    result.auth_admin = error
      ? { ok: false, error: error.message }
      : { ok: true, total_users_first_page: data.users.length };
  } catch (e: any) {
    result.auth_admin = { ok: false, error: e.message };
  }

  // Test 3: list public schema tables via information_schema
  try {
    const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
    const { data, error } = await target.rpc("version" as any).maybeSingle?.() ?? { data: null, error: null };
    result.rpc_version = error ? { ok: false, error: (error as any).message } : { ok: true, sample: data };
  } catch (e: any) {
    result.rpc_version = { ok: false, error: e.message };
  }

  const allOk =
    (result.rest_ping as any)?.ok === true &&
    (result.auth_admin as any)?.ok === true;

  return new Response(JSON.stringify({ ok: allOk, ...result }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
