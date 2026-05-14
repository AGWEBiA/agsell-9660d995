// Edge function temporária para reprocessar CRM sync de submissões pendentes.
// Roda em produção (Lovable Cloud) com acesso ao banco fonte e ao servidor externo via TARGET_*.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Função temporária — sem auth, será deletada após uso.

  const source = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const target = createClient(Deno.env.get("TARGET_SUPABASE_URL")!, Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!);

  const body = await req.json().catch(() => ({}));
  const sinceDate: string = body.since || "2026-05-13";
  const onlyOrgId: string | undefined = body.org_id;

  // Carrega organizações (origem + destino)
  const { data: srcOrgs } = await source.from("organizations").select("id, name");
  const { data: tgtOrgs } = await target.from("organizations").select("id, name");
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const srcNameById: Record<string, string> = Object.fromEntries((srcOrgs || []).map((o: any) => [o.id, o.name]));

  function resolveTargetOrg(srcId: string): string | null {
    const byId = (tgtOrgs || []).find((o: any) => o.id === srcId);
    if (byId) return byId.id;
    const sn = norm(srcNameById[srcId] || "");
    return (tgtOrgs || []).find((o: any) => norm(o.name) === sn)?.id || null;
  }

  // Pendências
  let q = source
    .from("form_submissions")
    .select("id, form_id, data, created_at, forms!inner(name, organization_id, send_to_crm)")
    .eq("was_sent_to_crm", false)
    .gte("created_at", sinceDate)
    .order("created_at", { ascending: true });

  const { data: pending, error: pErr } = await q;
  console.log("Backfill query result:", { count: pending?.length, error: pErr?.message });
  if (pErr) return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const ok: string[] = [];
  const fail: any[] = [];

  for (const s of (pending || []) as any[]) {
    const f = s.forms;
    if (f?.send_to_crm === false) continue;
    if (onlyOrgId && f?.organization_id !== onlyOrgId) continue;

    try {
      const targetOrgId = resolveTargetOrg(f.organization_id);
      if (!targetOrgId) throw new Error(`No target org for ${f.organization_id} (${srcNameById[f.organization_id]})`);

      const { data: owner } = await target.from("organization_members").select("user_id").eq("organization_id", targetOrgId).eq("role", "owner").limit(1).maybeSingle();
      const ownerId = owner?.user_id;

      const d = s.data || {};
      const email = (d.email || "").toString().trim().toLowerCase() || null;
      const phone = (d.whatsapp || d.phone || d.zap || "").toString().replace(/\s/g, "") || null;
      const fullName = (d.name || email || "Lead").toString().trim();
      const [first, ...rest] = fullName.split(" ");
      const last = rest.join(" ") || "Form";
      const lbl = f.name || "Form";

      let contactId: string | null = null;
      if (email || phone) {
        let cq = target.from("contacts").select("id").eq("organization_id", targetOrgId);
        if (email) cq = cq.eq("email", email); else cq = cq.eq("whatsapp", phone);
        const { data: ex } = await cq.maybeSingle();
        if (ex) {
          contactId = ex.id;
          await target.from("contacts").update({ source: lbl }).eq("id", ex.id);
        } else {
          const { data: nc, error } = await target.from("contacts").insert({
            organization_id: targetOrgId, user_id: ownerId,
            first_name: first || email, last_name: last,
            email, whatsapp: phone, phone, source: lbl,
          }).select("id").single();
          if (error) throw error;
          contactId = nc?.id || null;
        }
      }
      if (contactId) {
        const { data: stage } = await target.from("pipeline_stages").select("id").eq("organization_id", targetOrgId).eq("name", "Novo Lead").limit(1).maybeSingle();
        await target.from("deals").insert({
          organization_id: targetOrgId, user_id: ownerId, contact_id: contactId,
          title: `[${lbl}] ${first} ${last}`, status: "open", stage_id: stage?.id || null,
          notes: `Lead recuperado via backfill (${lbl}). Dados: ${JSON.stringify(d)}`,
        });
      }

      await source.from("form_submissions").update({ was_sent_to_crm: true, synced_at: new Date().toISOString() }).eq("id", s.id);
      ok.push(s.id);
    } catch (e: any) {
      console.error("Backfill fail", s.id, e.message);
      await source.from("form_submissions").update({ crm_sync_error: `Backfill: ${e.message}` }).eq("id", s.id);
      fail.push({ id: s.id, error: e.message });
    }
  }

  return new Response(JSON.stringify({ ok: ok.length, fail: fail.length, details: { ok, fail } }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
