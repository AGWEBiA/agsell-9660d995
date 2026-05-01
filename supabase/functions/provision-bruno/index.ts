// One-off provisioning function for Bruno Oliveira (Order 5XV75MJ - Starter Kiwify)
// Invoke once in PRODUCTION, then this file can be deleted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_EMAIL = "bruno.oliveira@gembagroup.com.br";
const TARGET_NAME = "Bruno Oliveira";
const PLAN_ID = "36a9725e-5a67-411a-8c89-5a09b8bd92ed"; // Starter prod
const PLAN_NAME = "Starter";
const KIWIFY_ORDER_ID = "5XV75MJ";

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Check if user already exists
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existing = usersList?.users?.find(
      (u: any) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase()
    );
    if (existing) {
      return new Response(
        JSON.stringify({ error: "User already exists", userId: existing.id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const password = generatePassword();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { name: TARGET_NAME, full_name: TARGET_NAME },
    });
    if (authError) throw authError;
    const userId = authData!.user!.id;

    const orgName = `Org de ${TARGET_NAME}`;
    const slug = `org-de-bruno-oliveira-${Date.now()}`;

    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug, plan_id: PLAN_ID })
      .select("id")
      .single();
    if (orgError) throw orgError;
    const orgId = newOrg.id;

    await supabase.from("organization_members").insert({
      organization_id: orgId, user_id: userId, role: "owner",
    });

    // Activate subscription (monthly)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").insert({
      organization_id: orgId,
      plan_id: PLAN_ID,
      status: "active",
      payment_provider: "kiwify",
      provider_subscription_id: KIWIFY_ORDER_ID,
      billing_cycle: "monthly",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    // Send welcome email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const loginUrl = "https://site.agsell.com.br/auth";
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc2626;">Bem-vindo ao AG Sell, ${TARGET_NAME}!</h2>
          <p>Sua conta no plano <strong>${PLAN_NAME}</strong> foi ativada com sucesso.</p>
          <p><strong>Organização:</strong> ${orgName}</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;"><strong>Email:</strong> ${TARGET_EMAIL}</p>
            <p style="margin:8px 0 0;"><strong>Senha temporária:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;">${password}</code></p>
          </div>
          <p>Recomendamos alterar sua senha no primeiro acesso.</p>
          <p style="text-align:center;margin:30px 0;">
            <a href="${loginUrl}" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Acessar minha conta</a>
          </p>
          <p style="color:#6b7280;font-size:12px;">Se você não reconhece este email, ignore-o.</p>
        </div>`;
      const { error: emailError } = await resend.emails.send({
        from: "AG Sell <noreply@agsell.com.br>",
        to: [TARGET_EMAIL],
        subject: "Bem-vindo ao AG Sell — Suas credenciais de acesso",
        html,
      });
      emailSent = !emailError;
    }

    return new Response(
      JSON.stringify({
        success: true, userId, orgId, planName: PLAN_NAME,
        emailSent, password: emailSent ? undefined : password,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
