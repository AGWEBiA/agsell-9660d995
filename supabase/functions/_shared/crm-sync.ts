import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const targetSupabase = createClient(targetUrl, targetKey);
    
    // 1. Get target org and owner
    const { data: orgs } = await targetSupabase.from("organizations").select("id").limit(1);
    const targetOrgId = orgs?.[0]?.id;
    
    if (!targetOrgId) return { success: false, error: "Target organization not found" };

    const { data: owner } = await targetSupabase.from("organization_members")
      .select("user_id")
      .eq("organization_id", targetOrgId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    const targetOwnerId = owner?.user_id;

    // 2. Sync contact to target
    let targetContactId = null;
    const { email, phone, firstName, lastName, source, notes } = leadData;

    if (email || phone) {
      let tQuery = targetSupabase.from("contacts").select("id").eq("organization_id", targetOrgId);
      if (email) tQuery = tQuery.eq("email", email);
      else tQuery = tQuery.eq("whatsapp", phone);
      
      const { data: tExisting } = await tQuery.maybeSingle();
      
      if (tExisting) {
        targetContactId = tExisting.id;
        await targetSupabase.from("contacts").update({ source }).eq("id", targetContactId);
      } else {
        const { data: tNew } = await targetSupabase.from("contacts").insert({
          organization_id: targetOrgId,
          user_id: targetOwnerId,
          first_name: firstName,
          last_name: lastName,
          email,
          whatsapp: phone,
          phone,
          source,
        }).select("id").single();
        if (tNew) targetContactId = tNew.id;
      }
    }

    // 3. Sync deal to target
    if (targetContactId) {
      const { data: tStage } = await targetSupabase.from("pipeline_stages")
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
        stage_id: tStage?.id || "8592093e-20c5-46d7-8481-55eadf48336a",
        notes: notes || `Lead sincronizado via automação Lovable.`,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("CRM Sync Error:", err);
    return { success: false, error: err.message };
  }
}
