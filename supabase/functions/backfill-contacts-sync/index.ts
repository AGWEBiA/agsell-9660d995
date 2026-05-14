// Backfill temporário: replica contatos da origem (Lovable Cloud) para o CRM externo
// quando ainda não existem lá. Útil para whatsapp_inbound e outras origens fora de form_submissions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const TOKEN = "bf_ct_2026_05_14_yT7vK9pQ3mN7vR2";
  if (req.headers.get("X-Admin-Token") !== TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const source = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const target = createClient(Deno.env.get("TARGET_SUPABASE_URL")!, Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!);

  const body = await req.json().catch(() => ({}));
  const onlyOrgId: string | undefined = body.org_id;

  const { data: srcOrgs } = await source.from("organizations").select("id, name");
  const { data: tgtOrgs } = await target.from("organizations").select("id, name");
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const srcNameById: Record<string, string> = Object.fromEntries((srcOrgs || []).map((o: any) => [o.id, o.name]));
  const resolveTarget = (srcId: string): string | null => {
    const byId = (tgtOrgs || []).find((o: any) => o.id === srcId);
    if (byId) return byId.id;
    const sn = norm(srcNameById[srcId] || "");
    return (tgtOrgs || []).find((o: any) => norm(o.name) === sn)?.id || null;
  };

  let q = source.from("contacts").select("id, organization_id, first_name, last_name, email, whatsapp, phone, source, created_at").order("created_at", { ascending: true });
  if (onlyOrgId) q = q.eq("organization_id", onlyOrgId);
  const { data: contacts, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const created: string[] = [];
  const skipped: string[] = [];
  const fail: any[] = [];

  for (const c of (contacts || []) as any[]) {
    try {
      const targetOrgId = resolveTarget(c.organization_id);
      if (!targetOrgId) { skipped.push(c.id); continue; }

      const email = c.email ? c.email.toString().trim().toLowerCase() : null;
      const phone = c.whatsapp || c.phone || null;
      if (!email && !phone) { skipped.push(c.id); continue; }

      let cq = target.from("contacts").select("id").eq("organization_id", targetOrgId);
      if (email) cq = cq.eq("email", email); else cq = cq.eq("whatsapp", phone);
      const { data: ex } = await cq.maybeSingle();
      if (ex) { skipped.push(c.id); continue; }

      const { data: owner } = await target.from("organization_members").select("user_id").eq("organization_id", targetOrgId).eq("role", "owner").limit(1).maybeSingle();
      const ownerId = owner?.user_id;

      const { data: nc, error: insErr } = await target.from("contacts").insert({
        organization_id: targetOrgId,
        user_id: ownerId,
        first_name: c.first_name || email || "Contato",
        last_name: c.last_name || "",
        email,
        whatsapp: phone,
        phone,
        source: c.source || "backfill",
      }).select("id").single();
      if (insErr) throw insErr;

      // cria deal em "Novo Lead" se houver
      if (nc?.id) {
        const { data: stage } = await target.from("pipeline_stages").select("id").eq("organization_id", targetOrgId).eq("name", "Novo Lead").limit(1).maybeSingle();
        await target.from("deals").insert({
          organization_id: targetOrgId, user_id: ownerId, contact_id: nc.id,
          title: `[${c.source || "backfill"}] ${c.first_name || email}`, status: "open", stage_id: stage?.id || null,
          notes: `Contato recuperado via backfill (origem: ${c.source}).`,
        });
      }
      created.push(c.id);
    } catch (e: any) {
      fail.push({ id: c.id, error: e.message });
    }
  }

  return new Response(JSON.stringify({ created: created.length, skipped: skipped.length, fail: fail.length, details: { fail } }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
