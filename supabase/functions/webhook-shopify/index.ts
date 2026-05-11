import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Shopify sends GET for webhook verification
  if (req.method === "GET") {
    return new Response("OK", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get shop domain from header
    const shopDomain = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

    if (!shopDomain || !topic) {
      return new Response(
        JSON.stringify({ error: "Missing Shopify headers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Find the Shopify integration
    const { data: integration } = await supabase
      .from("shopify_integrations")
      .select("*")
      .eq("shop_domain", shopDomain)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!integration) {
      console.error("No active Shopify integration for:", shopDomain);
      return new Response(
        JSON.stringify({ error: "Integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: Verify HMAC if webhook secret is configured
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", integration.organization_id)
      .single();

    const webhookSecret = org?.settings?.shopify_webhook_secret;
    // HMAC verification can be added here if webhookSecret is set

    console.log(`Shopify webhook: ${topic} from ${shopDomain}`);

    // Process different Shopify events
    switch (topic) {
      case "orders/create": {
        await handleOrderCreated(supabase, supabaseUrl, serviceKey, integration, body);
        break;
      }
      case "orders/paid": {
        await handleOrderPaid(supabase, supabaseUrl, serviceKey, integration, body);
        break;
      }
      case "checkouts/create": {
        await handleCheckoutCreated(supabase, integration, body);
        break;
      }
      case "customers/create": {
        await handleCustomerCreated(supabase, integration, body);
        break;
      }
      default:
        console.log("Unhandled Shopify topic:", topic);
    }

    // Update sync counter
    if (topic.startsWith("orders/")) {
      await supabase
        .from("shopify_integrations")
        .update({ orders_synced: (integration.orders_synced || 0) + 1 })
        .eq("id", integration.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Shopify webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleOrderCreated(supabase: any, supabaseUrl: string, serviceKey: string, integration: any, order: any) {
  const customer = order.customer;
  if (!customer) return;

  const contact = await findOrCreateContact(supabase, integration, customer);

  // Trigger automations for order_created
  await triggerAutomation(supabase, supabaseUrl, serviceKey, integration.organization_id, "shopify_order_created", contact?.id, {
    order_id: order.id,
    order_number: order.order_number,
    total_price: order.total_price,
    currency: order.currency,
  });
}

async function handleOrderPaid(supabase: any, supabaseUrl: string, serviceKey: string, integration: any, order: any) {
  const customer = order.customer;
  if (!customer) return;

  const contact = await findOrCreateContact(supabase, integration, customer);

  await triggerAutomation(supabase, supabaseUrl, serviceKey, integration.organization_id, "shopify_order_paid", contact?.id, {
    order_id: order.id,
    total_price: order.total_price,
  });
}

async function handleCheckoutCreated(supabase: any, integration: any, checkout: any) {
  // Track abandoned checkout - can trigger automation later
  const email = checkout.email;
  if (!email) return;

  const customer = {
    email,
    first_name: checkout.billing_address?.first_name || "Cliente",
    last_name: checkout.billing_address?.last_name || "",
    phone: checkout.billing_address?.phone || null,
  };

  await findOrCreateContact(supabase, integration, customer);
}

async function handleCustomerCreated(supabase: any, integration: any, customer: any) {
  await findOrCreateContact(supabase, integration, customer);
}

async function findOrCreateContact(supabase: any, integration: any, customer: any) {
  const email = customer.email;
  if (!email) return null;

  // Try to find existing contact
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", integration.organization_id)
    .eq("email", email)
    .limit(1)
    .single();

  if (existing) return existing;

  // Get org owner
  const { data: owner } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", integration.organization_id)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!owner) return null;

  const { data: newContact } = await supabase
    .from("contacts")
    .insert({
      organization_id: integration.organization_id,
      user_id: owner.user_id,
      first_name: customer.first_name || "Cliente",
      last_name: customer.last_name || null,
      email,
      phone: customer.phone || null,
      source: "shopify",
    })
    .select()
    .single();

  return newContact;
}

async function triggerAutomation(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  organizationId: string,
  triggerType: string,
  contactId: string | null,
  metadata: Record<string, unknown>
) {
  // Find matching automations
  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("trigger_type", triggerType)
    .eq("is_active", true);

  if (!automations || automations.length === 0) return;

  for (const automation of automations) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          automation_id: automation.id,
          contact_id: contactId,
          trigger_event: triggerType,
          metadata,
        }),
      });
    } catch (error: any) {
      console.error("Error triggering automation:", automation.id, error);
    }
  }
}
