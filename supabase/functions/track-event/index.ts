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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { organization_id, event_name, event_data, page_url, referrer, visitor_id, contact_email } = body;

    if (!organization_id || !event_name) {
      return new Response(JSON.stringify({ error: "organization_id and event_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to find contact by email
    let contactId = null;
    if (contact_email) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id")
        .eq("organization_id", organization_id)
        .ilike("email", contact_email)
        .limit(1)
        .single();
      if (contact) contactId = contact.id;
    }

    const { error } = await supabase.from("site_events").insert({
      organization_id,
      contact_id: contactId,
      visitor_id: visitor_id || null,
      event_name,
      event_data: event_data || {},
      page_url: page_url || null,
      referrer: referrer || null,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Track event error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
