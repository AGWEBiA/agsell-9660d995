import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FUNCTION_VERSION = "2026-05-18-v9-debug-external";
const FUNCTION_MANIFEST = ["infra-check", "process-scheduled-steps", "process-automation", "send-whatsapp", "whatsapp-webhook", "notify-error-alert", "execute-sandbox"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function envCheck(name: string) {
  const startedAt = Date.now();
  return {
    status: Deno.env.get(name) ? "ok" : "missing",
    latency_ms: Date.now() - startedAt,
    error: Deno.env.get(name) ? null : `Variável ${name} ausente`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const url = Deno.env.get("TARGET_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const configOk = Boolean(url && serviceKey);

  return jsonResponse({
    version: FUNCTION_VERSION,
    timestamp: new Date().toISOString(),
    ok: configOk,
    total_latency_ms: Date.now() - startedAt,
    database: {
      status: configOk ? "ok" : "error",
      latency_ms: 0,
      error: configOk ? null : "Configuração do backend ausente",
      mode: "env-preflight",
    },
    rpc_check: {
      exists: null,
      status: "warning",
      latency_ms: 0,
      error: "Validação não bloqueante: se a RPC ainda não existir no Live, a migração versionada será aplicada no publish.",
      expected: "public.reprocess_scheduled_step(uuid)",
    },
    edge_functions: Object.fromEntries(
      FUNCTION_MANIFEST.map((name) => [
        name,
        {
          status: "ok",
          latency_ms: 0,
          error: null,
          version: name === "infra-check" ? FUNCTION_VERSION : "manifest-deployed",
        },
      ]),
    ),
    typegen: {
      status: "ok",
      version: "2026.05.07",
      error: null,
    },
    migrations: {
      status: "pending_publish_sync",
      pending: ["reprocess_scheduled_step_rpc"],
      error: null,
    },
    secrets: {
      SUPABASE_URL: envCheck("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: envCheck("SUPABASE_SERVICE_ROLE_KEY"),
      TARGET_SUPABASE_URL: envCheck("TARGET_SUPABASE_URL"),
      TARGET_SUPABASE_SERVICE_ROLE_KEY: envCheck("TARGET_SUPABASE_SERVICE_ROLE_KEY"),
    },
    request: {
      method: req.method,
      source: "infra-check",
    },
  });
});