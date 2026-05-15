import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-cron",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Backoff: 1m, 5m, 15m, 60m, 4h
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];
const BATCH_SIZE = 50;
const PER_REQUEST_TIMEOUT_MS = 10_000;

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Fetch pending or retrying deliveries due now (no FK embed — webhook_id is not a constrained FK)
  const { data: deliveries, error } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Manually fetch related webhook secrets in one query
  const webhookIds = Array.from(new Set((deliveries || []).map((d: any) => d.webhook_id).filter(Boolean)));
  const secretsMap = new Map<string, string>();
  if (webhookIds.length > 0) {
    const { data: subs } = await supabase
      .from("api_webhook_subscriptions")
      .select("id, secret")
      .in("id", webhookIds);
    for (const s of subs || []) {
      if (s.secret) secretsMap.set(s.id, s.secret);
    }
  }

  let success = 0;
  let failed = 0;

  for (const d of deliveries || []) {
    const attempts = (d.attempts ?? 0) + 1;
    const maxAttempts = d.max_attempts ?? 5;
    const body = JSON.stringify(d.payload);
    const secret = (d as any).api_webhook_subscriptions?.secret as string | null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(d.headers || {}),
      "X-Webhook-Attempt": String(attempts),
      "X-Webhook-Delivery": d.id,
    };
    if (secret) {
      headers["X-Webhook-Signature"] = await hmacSha256Hex(secret, body);
    }

    let statusCode = 0;
    let errorText: string | null = null;

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), PER_REQUEST_TIMEOUT_MS);
      const resp = await fetch(d.url, {
        method: d.method || "POST",
        headers,
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      statusCode = resp.status;
      if (!resp.ok) {
        errorText = (await resp.text().catch(() => "")).slice(0, 500);
      }
    } catch (e: any) {
      errorText = `network: ${e?.message || String(e)}`.slice(0, 500);
    }

    const ok = statusCode >= 200 && statusCode < 300;
    const update: Record<string, unknown> = {
      attempts,
      last_attempt_at: new Date().toISOString(),
      last_status_code: statusCode || null,
      last_error: errorText,
    };

    if (ok) {
      update.status = "delivered";
      update.completed_at = new Date().toISOString();
      update.next_retry_at = null;
      success++;
      // Reset failure_count on the subscription
      if (d.webhook_id) {
        await supabase.from("api_webhook_subscriptions").update({
          failure_count: 0,
          last_triggered_at: new Date().toISOString(),
        }).eq("id", d.webhook_id);
      }
    } else if (attempts >= maxAttempts) {
      update.status = "failed";
      update.completed_at = new Date().toISOString();
      update.next_retry_at = null;
      failed++;
      if (d.webhook_id) {
        try { await supabase.rpc("increment_automation_executions", { automation_id: d.webhook_id }); } catch (e) { console.error("Error incrementing automation executions:", e); }
        await supabase.from("api_webhook_subscriptions")
          .update({ failure_count: ((d as any).failure_count ?? 0) + 1 })
          .eq("id", d.webhook_id);
      }
    } else {
      const minutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
      update.status = "retrying";
      update.next_retry_at = new Date(Date.now() + minutes * 60_000).toISOString();
      failed++;
    }

    await supabase.from("webhook_deliveries").update(update).eq("id", d.id);
  }

  return new Response(
    JSON.stringify({ processed: deliveries?.length ?? 0, success, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
