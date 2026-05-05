import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_EMAIL = "vemviverdeviajar@gmail.com";
const TARGET_NAME = "RUBENS CAMPOS FILHO";
const PLAN_ID = "f0fe2eaa-7b25-4be6-9981-36c08b23db27";
const PLAN_SLUG = "professional";
const SALE_ID = "h97YdRc";
const TEMP_PASSWORD = "4qeQrvgmCy";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: existingAuth } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = existingAuth?.users?.find((u) => u.email?.toLowerCase() === TARGET_EMAIL);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: TARGET_NAME,
          full_name: TARGET_NAME,
          credentials_emailed_at: new Date().toISOString(),
        },
      });
      if (error) throw error;
      user = data.user;
    }

    const { data: existingMembership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let orgId = existingMembership?.organization_id;
    if (!orgId) {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: `Org de ${TARGET_NAME}`,
          slug: `rubens-campos-filho-${Date.now()}`,
          plan_id: PLAN_ID,
          plan: PLAN_SLUG,
        })
        .select("id")
        .single();
      if (orgError) throw orgError;
      orgId = org.id;

      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: orgId,
        user_id: user.id,
        role: "owner",
      });
      if (memberError) throw memberError;
    } else {
      await supabase.from("organizations").update({ plan_id: PLAN_ID, plan: PLAN_SLUG }).eq("id", orgId);
    }

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    const subscription = {
      organization_id: orgId,
      plan_id: PLAN_ID,
      status: "active",
      billing_cycle: "monthly",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      payment_provider: "kiwify",
      provider_subscription_id: SALE_ID,
    };

    if (existingSub?.id) {
      const { error } = await supabase.from("subscriptions").update(subscription).eq("id", existingSub.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("subscriptions").insert(subscription);
      if (error) throw error;
    }

    await supabase.from("webhook_events").insert({
      organization_id: orgId,
      user_id: user.id,
      source: "kiwify",
      event_type: "manual_provisioning",
      payload: { order_id: SALE_ID, customer: { email: TARGET_EMAIL, name: TARGET_NAME }, plan: "Professional" },
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, userId: user.id, orgId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
