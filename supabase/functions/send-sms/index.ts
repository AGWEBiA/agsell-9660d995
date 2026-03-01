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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { to, message, organization_id } = await req.json();

    if (!to || !message || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message, organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMS config for org
    const { data: smsConfig } = await supabase
      .from("sms_configs")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!smsConfig) {
      return new Response(
        JSON.stringify({ error: "SMS not configured for this organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get org settings for API credentials
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", organization_id)
      .single();

    const settings = org?.settings || {};
    let result;

    if (smsConfig.provider === "twilio") {
      const accountSid = settings.twilio_account_sid;
      const authToken = settings.twilio_auth_token;

      if (!accountSid || !authToken) {
        return new Response(
          JSON.stringify({ error: "Twilio credentials not configured. Go to Organization settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = btoa(`${accountSid}:${authToken}`);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: smsConfig.from_number || "",
          Body: message,
        }),
      });

      result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Twilio API error");
      }
    } else if (smsConfig.provider === "vonage") {
      const apiKey = settings.vonage_api_key;
      const apiSecret = settings.vonage_api_secret;

      if (!apiKey || !apiSecret) {
        return new Response(
          JSON.stringify({ error: "Vonage credentials not configured. Go to Organization settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          to: to.replace(/\D/g, ""),
          from: smsConfig.from_number || "AG Sell",
          text: message,
        }),
      });

      result = await response.json();

      if (result.messages?.[0]?.status !== "0") {
        throw new Error(result.messages?.[0]?.["error-text"] || "Vonage API error");
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported SMS provider: ${smsConfig.provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update messages_sent counter
    await supabase
      .from("sms_configs")
      .update({ messages_sent: (smsConfig.messages_sent || 0) + 1 })
      .eq("id", smsConfig.id);

    return new Response(
      JSON.stringify({ success: true, provider: smsConfig.provider, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send SMS error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
