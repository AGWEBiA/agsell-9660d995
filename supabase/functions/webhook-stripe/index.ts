// Webhook Handler for Stripe Events
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    // Find organization with active Stripe integration
    const { data: integration } = await supabase
      .from("organization_integrations")
      .select("organization_id, config")
      .eq("integration_type", "stripe")
      .eq("is_active", true)
      .single();

    const organizationId = integration?.organization_id;
    const stripeWebhookSecret = integration?.config?.webhook_secret as string | undefined;

    let event: Stripe.Event;

    // Verify signature if webhook secret is configured
    if (stripeWebhookSecret && signature) {
      const stripeSecretKey = integration?.config?.secret_key as string;
      if (!stripeSecretKey) {
        throw new Error("Stripe secret key not configured");
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });

      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
      } catch (err) {
        console.error("Stripe signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    console.log("Stripe webhook received:", event.type);

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        organization_id: organizationId,
        source: "stripe",
        event_type: event.type,
        payload: event,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error storing webhook:", webhookError);
      throw webhookError;
    }

    // Process specific events
    if (organizationId) {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.customer_details?.email) {
            const { data: existingContact } = await supabase
              .from("contacts")
              .select("id")
              .eq("email", session.customer_details.email)
              .eq("organization_id", organizationId)
              .maybeSingle();

            if (!existingContact) {
              const nameParts = (session.customer_details.name || "").split(" ");
              await supabase.from("contacts").insert({
                organization_id: organizationId,
                user_id: organizationId,
                first_name: nameParts[0] || "Cliente",
                last_name: nameParts.slice(1).join(" ") || null,
                email: session.customer_details.email,
                phone: session.customer_details.phone,
                source: "stripe",
                status: "customer",
                notes: `Stripe Session: ${session.id}`,
              });
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription event:", subscription.id, subscription.status);
          break;
        }

        case "invoice.paid":
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("Invoice event:", invoice.id, invoice.status);
          break;
        }
      }

      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ received: true, event_id: webhookEvent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing Stripe webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
