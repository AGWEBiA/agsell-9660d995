import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sincroniza um lead capturado no Lovable Cloud para o servidor externo (CRM
 * de produção em site.agsell.com.br).
 *
 * IMPORTANTE: A organização de destino é resolvida na seguinte ordem:
 *   1. Mesmo UUID da organização de origem (caso o cliente tenha sido provisionado
 *      com o mesmo id em ambos os ambientes).
 *   2. Match por nome (normalizado) entre origem e destino — necessário para
 *      contas migradas/recriadas (ex.: "Gemba Group" no Lovable Cloud equivale a
 *      "Org de Bruno Oliveira" no servidor externo apenas quando o nome confere
 *      ou quando configurarmos um alias).
 *   3. Se nada bater, **NÃO** envia para nenhuma organização (retorna erro
 *      explícito) — anteriormente o código caía silenciosamente na primeira
 *      organização do banco, o que misturava leads de clientes diferentes.
 */
export async function syncLeadToCRM(supabase: any, organizationId: string, leadData: {
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  source: string;
  notes?: string;
  data?: any;
}) {
  const targetUrl = Deno.env.get("TARGET_SUPABASE_URL");
  const targetKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  if (!targetUrl || !targetKey) {
    console.warn("CRM Sync: Missing target credentials");
    return { success: false, error: "Missing target credentials" };
  }

  try {
    // 0. Carrega o nome da organização de origem (necessário para fallback por nome)
    const { data: sourceOrg } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();

    const sourceName = (sourceOrg?.name || "").trim().toLowerCase();

    const targetSupabase = createClient(targetUrl, targetKey);

    // 1. Resolve organização de destino — primeiro por UUID, depois por nome.
    let targetOrgId: string | null = null;

    const { data: byId } = await targetSupabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();

    if (byId?.id) {
      targetOrgId = byId.id;
    } else if (sourceName) {
      const { data: allOrgs } = await targetSupabase
        .from("organizations")
        .select("id, name");
      const match = (allOrgs || []).find(
        (o: any) => (o.name || "").trim().toLowerCase() === sourceName
      );
      if (match) targetOrgId = match.id;
    }

    if (!targetOrgId) {
      console.error(
        `CRM Sync: target organization not found for source ${organizationId} (${sourceOrg?.name || "?"})`
      );
      return {
        success: false,
        error: `Target organization not found (source: ${sourceOrg?.name || organizationId}). Configure mesmo UUID ou nome idêntico no servidor externo.`,
      };
    }

    // 2. Resolve owner da organização de destino
    const { data: owner } = await targetSupabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", targetOrgId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    const targetOwnerId = owner?.user_id;

    // 3. Sync de contato
    let targetContactId: string | null = null;
    const { email, phone, firstName, lastName, source, notes } = leadData;

    if (email || phone) {
      let tQuery = targetSupabase
        .from("contacts")
        .select("id")
        .eq("organization_id", targetOrgId);
      if (email) tQuery = tQuery.eq("email", email);
      else tQuery = tQuery.eq("whatsapp", phone);

      const { data: tExisting } = await tQuery.maybeSingle();

      if (tExisting) {
        targetContactId = tExisting.id;
        await targetSupabase.from("contacts").update({ source }).eq("id", targetContactId);
      } else {
        const { data: tNew, error: insertErr } = await targetSupabase
          .from("contacts")
          .insert({
            organization_id: targetOrgId,
            user_id: targetOwnerId,
            first_name: firstName,
            last_name: lastName,
            email,
            whatsapp: phone,
            phone,
            source,
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        if (tNew) targetContactId = tNew.id;
      }
    }

    // 4. Sync de deal (Pipeline → "Novo Lead")
    if (targetContactId) {
      const { data: tStage } = await targetSupabase
        .from("pipeline_stages")
        .select("id")
        .eq("organization_id", targetOrgId)
        .eq("name", "Novo Lead")
        .limit(1)
        .maybeSingle();

      await targetSupabase.from("deals").insert({
        organization_id: targetOrgId,
        user_id: targetOwnerId,
        contact_id: targetContactId,
        title: `[${source}] ${firstName} ${lastName}`,
        status: "open",
        stage_id: tStage?.id || null,
        notes: notes || `Lead sincronizado via automação Lovable.`,
      });
    }

    return { success: true, targetOrgId, targetContactId };
  } catch (err: any) {
    console.error("CRM Sync Error:", err);
    return { success: false, error: err.message };
  }
}
