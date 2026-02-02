// SendGrid / Resend Email Sender
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  organization_id: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailReq = (await req.json()) as EmailRequest;

    // Get organization email integration
    const { data: integration, error: intError } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", emailReq.organization_id)
      .eq("integration_type", "sendgrid")
      .eq("is_active", true)
      .maybeSingle();

    if (!integration && !intError) {
      // Try Resend as fallback
      const { data: resendInt } = await supabase
        .from("organization_integrations")
        .select("config")
        .eq("organization_id", emailReq.organization_id)
        .eq("integration_type", "resend")
        .eq("is_active", true)
        .maybeSingle();

      if (resendInt) {
        return await sendWithResend(resendInt.config as Record<string, string>, emailReq);
      }
    }

    if (integration) {
      return await sendWithSendGrid(integration.config as Record<string, string>, emailReq);
    }

    return new Response(
      JSON.stringify({ error: "No email integration configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWithSendGrid(config: Record<string, string>, emailReq: EmailRequest) {
  const apiKey = config.api_key;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "SendGrid API key not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const toAddresses = Array.isArray(emailReq.to)
    ? emailReq.to.map((email) => ({ email }))
    : [{ email: emailReq.to }];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: toAddresses }],
      from: { email: emailReq.from || config.from_email || "noreply@agsell.com" },
      reply_to: emailReq.reply_to ? { email: emailReq.reply_to } : undefined,
      subject: emailReq.subject,
      content: [
        ...(emailReq.text ? [{ type: "text/plain", value: emailReq.text }] : []),
        { type: "text/html", value: emailReq.html },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SendGrid error:", errorText);
    return new Response(
      JSON.stringify({ error: `SendGrid error: ${response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "sendgrid" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendWithResend(config: Record<string, string>, emailReq: EmailRequest) {
  const apiKey = config.api_key;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Resend API key not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailReq.from || config.from_email || "AG Sell <noreply@agsell.com>",
      to: Array.isArray(emailReq.to) ? emailReq.to : [emailReq.to],
      reply_to: emailReq.reply_to,
      subject: emailReq.subject,
      html: emailReq.html,
      text: emailReq.text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Resend error:", data);
    return new Response(
      JSON.stringify({ error: `Resend error: ${data.message || response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "resend", id: data.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
