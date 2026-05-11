import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  source: string;
  payload: any;
  headers?: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Unified Webhook] Missing environment variables");
    return new Response(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(JSON.stringify({ error: "Empty body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e: any) {
      console.error("[Unified Webhook] JSON Parse Error:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const source = url.searchParams.get("source") || "unknown";

    // 1. Store the raw event for audit/replay
    const { data: event, error: eventError } = await supabase
      .from("webhook_events")
      .insert({
        source,
        event_type: "received",
        payload,
        processed: false,
      })
      .select()
      .single();

    if (eventError) {
      console.error("[Unified Webhook] DB Insert Error:", eventError);
      throw eventError;
    }

    console.log(`[Unified Webhook] Received event from ${source}, event_id: ${event.id}`);

    // 2. Delegate processing based on source
    let processorUrl = "";
    if (source === "kiwify") {
      processorUrl = `${supabaseUrl}/functions/v1/webhook-kiwify`;
    } else if (source === "paid-groups") {
      processorUrl = `${supabaseUrl}/functions/v1/paid-groups-webhook`;
    }

    if (processorUrl) {
      // Background call to the actual processor
      fetch(processorUrl, {
        method: "POST",
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          "X-Webhook-Event-Id": event.id,
        },
        body: rawBody,
      }).catch(err => {
        console.error(`[Unified Webhook] Async fetch error for ${source}:`, err);
        // We still return 200 to the source, but we've logged the failure internally
      });
    }

    return new Response(JSON.stringify({ success: true, event_id: event.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Unified Webhook] Critical Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal Server Error",
      reference: crypto.randomUUID() 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
