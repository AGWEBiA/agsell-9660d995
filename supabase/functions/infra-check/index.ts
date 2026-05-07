import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FUNCTION_VERSION = "2026-05-07-v6-http-only";
const CHECK_TIMEOUT_MS = 2_500;
const HARD_DEADLINE_MS = 8_500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CheckStatus = "ok" | "degraded" | "missing" | "error" | "timeout";

interface CheckResult {
  status: CheckStatus;
  latency_ms: number;
  error: string | null;
  status_code?: number;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requestWithTimeout(url: string, init: RequestInit, timeoutMs = CHECK_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Connection": "close",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function safeCheck(label: string, task: () => Promise<CheckResult>): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    return await Promise.race([
      task(),
      new Promise<CheckResult>((resolve) =>
        setTimeout(
          () => resolve({ status: "timeout", latency_ms: Date.now() - startedAt, error: `${label} timeout` }),
          CHECK_TIMEOUT_MS + 250,
        ),
      ),
    ]);
  } catch (error) {
    return {
      status: "error",
      latency_ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkRest(baseUrl: string, key: string): Promise<CheckResult> {
  const startedAt = Date.now();
  const url = `${baseUrl}/rest/v1/automations?select=id&limit=1`;
  const res = await requestWithTimeout(url, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=none",
    },
  });
  const body = await res.text().catch(() => "");
  return {
    status: res.ok || res.status === 401 || res.status === 403 ? "ok" : "degraded",
    latency_ms: Date.now() - startedAt,
    status_code: res.status,
    error: res.ok ? null : body.slice(0, 240) || res.statusText,
  };
}

async function checkRpc(baseUrl: string, key: string): Promise<CheckResult & { exists: boolean }> {
  const startedAt = Date.now();
  const res = await requestWithTimeout(`${baseUrl}/rest/v1/rpc/reprocess_scheduled_step`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_step_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const text = await res.text().catch(() => "");
  let parsed: { code?: string; message?: string } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text };
  }

  const missing = res.status === 404 || parsed.code === "42883" || /function .* does not exist/i.test(parsed.message ?? text);
  return {
    exists: !missing,
    status: missing ? "missing" : "ok",
    latency_ms: Date.now() - startedAt,
    status_code: res.status,
    error: missing ? "RPC reprocess_scheduled_step ainda não existe no Live" : parsed.message ?? null,
  };
}

async function checkFunction(baseUrl: string, key: string, name: string): Promise<CheckResult> {
  const startedAt = Date.now();
  const res = await requestWithTimeout(`${baseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "ping", source: "infra-check", version: FUNCTION_VERSION }),
  });
  const body = await res.text().catch(() => "");
  return {
    status: res.ok || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404 ? "ok" : "degraded",
    latency_ms: Date.now() - startedAt,
    status_code: res.status,
    error: res.ok ? null : body.slice(0, 240) || res.statusText,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({
      version: FUNCTION_VERSION,
      ok: false,
      database: { status: "error", error: "Configuração do backend ausente", latency_ms: 0 },
      rpc_check: { exists: false, status: "error", error: "Configuração do backend ausente", latency_ms: 0 },
      edge_functions: {},
    }, 200);
  }

  const diagnostics: Record<string, unknown> = {
    version: FUNCTION_VERSION,
    timestamp: new Date().toISOString(),
    ok: true,
    total_latency_ms: 0,
    database: { status: "unknown", error: null, latency_ms: 0 },
    rpc_check: { exists: false, status: "unknown", error: null, latency_ms: 0 },
    edge_functions: {},
  };

  const checks = await Promise.race([
    Promise.all([
      safeCheck("database", () => checkRest(supabaseUrl, serviceKey)),
      safeCheck("rpc", () => checkRpc(supabaseUrl, serviceKey)),
      Promise.all(["process-scheduled-steps", "process-automation", "send-whatsapp"].map(async (name) => [
        name,
        await safeCheck(name, () => checkFunction(supabaseUrl, serviceKey, name)),
      ] as const)),
    ]),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), HARD_DEADLINE_MS)),
  ]);

  if (checks === null) {
    diagnostics.ok = false;
    diagnostics.database = { status: "timeout", error: "Pré-check interrompido antes do limite da plataforma", latency_ms: Date.now() - startedAt };
  } else {
    const [database, rpcCheck, edgeEntries] = checks;
    diagnostics.database = database;
    diagnostics.rpc_check = rpcCheck;
    diagnostics.edge_functions = Object.fromEntries(edgeEntries);
    diagnostics.ok = database.status === "ok";
  }

  diagnostics.total_latency_ms = Date.now() - startedAt;
  return jsonResponse(diagnostics);
});