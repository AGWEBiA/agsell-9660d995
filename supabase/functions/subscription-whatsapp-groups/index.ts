import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  action: "add_member" | "remove_member" | "sync_user";
  group_id?: string;
  user_id?: string;
  phone_number?: string;
  should_be_active?: boolean;
}

function formatBrazilianNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const { action } = body;

    // Get Evolution API config from platform_settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const evolutionConfig = settings?.value as { api_url?: string; api_key?: string } | null;
    if (!evolutionConfig?.api_url || !evolutionConfig?.api_key) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = evolutionConfig.api_url.replace(/\/+$/, "");
    const apiKey = evolutionConfig.api_key;

    if (action === "add_member") {
      const { group_id, user_id, phone_number } = body;
      if (!group_id || !phone_number) {
        return new Response(
          JSON.stringify({ error: "group_id e phone_number são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get group info
      const { data: group } = await supabase
        .from("plan_whatsapp_groups")
        .select("*")
        .eq("id", group_id)
        .single();

      if (!group) {
        return new Response(
          JSON.stringify({ error: "Grupo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedNumber = formatBrazilianNumber(phone_number);
      const instanceName = group.instance_name || "";

      // Call Evolution API to add participant
      try {
        const response = await fetch(
          `${apiUrl}/group/updateParticipant/${instanceName}`,
          {
            method: "PUT",
            headers: { apikey: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              groupJid: group.group_jid,
              action: "add",
              participants: [`${formattedNumber}@s.whatsapp.net`],
            }),
          }
        );
        const result = await response.text();
        console.log("[WA-GROUPS] Add member response:", response.status, result);
      } catch (err) {
        console.error("[WA-GROUPS] Evolution API error:", err);
      }

      // Record membership
      if (user_id) {
        const { data: existing } = await supabase
          .from("plan_whatsapp_members")
          .select("id")
          .eq("user_id", user_id)
          .eq("group_id", group_id)
          .eq("status", "active")
          .maybeSingle();

        if (!existing) {
          await supabase.from("plan_whatsapp_members").insert({
            user_id,
            group_id,
            status: "active",
            added_at: new Date().toISOString(),
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, action: "add_member" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_member") {
      const { group_id, user_id, phone_number } = body;
      if (!group_id || !phone_number) {
        return new Response(
          JSON.stringify({ error: "group_id e phone_number são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: group } = await supabase
        .from("plan_whatsapp_groups")
        .select("*")
        .eq("id", group_id)
        .single();

      if (!group) {
        return new Response(
          JSON.stringify({ error: "Grupo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedNumber = formatBrazilianNumber(phone_number);
      const instanceName = group.instance_name || "";

      try {
        const response = await fetch(
          `${apiUrl}/group/updateParticipant/${instanceName}`,
          {
            method: "PUT",
            headers: { apikey: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              groupJid: group.group_jid,
              action: "remove",
              participants: [`${formattedNumber}@s.whatsapp.net`],
            }),
          }
        );
        const result = await response.text();
        console.log("[WA-GROUPS] Remove member response:", response.status, result);
      } catch (err) {
        console.error("[WA-GROUPS] Evolution API error:", err);
      }

      // Update membership
      if (user_id) {
        await supabase
          .from("plan_whatsapp_members")
          .update({ status: "removed", removed_at: new Date().toISOString() })
          .eq("user_id", user_id)
          .eq("group_id", group_id)
          .eq("status", "active");
      }

      return new Response(
        JSON.stringify({ success: true, action: "remove_member" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync_user") {
      const { user_id, should_be_active } = body;
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's WhatsApp number from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp_number")
        .eq("user_id", user_id)
        .single();

      if (!profile?.whatsapp_number) {
        console.log("[WA-GROUPS] User has no WhatsApp number:", user_id);
        return new Response(
          JSON.stringify({ success: true, message: "Usuário sem número de WhatsApp" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's active subscription plan
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user_id)
        .limit(1)
        .single();

      let userPlanId: string | null = null;
      if (membership) {
        const { data: org } = await supabase
          .from("organizations")
          .select("plan_id")
          .eq("id", membership.organization_id)
          .single();

        if (org?.plan_id) {
          // Check if subscription is active
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("organization_id", membership.organization_id)
            .maybeSingle();

          if (should_be_active || (sub && ["active", "trialing"].includes(sub.status))) {
            userPlanId = org.plan_id;
          }
        }
      }

      // Get all active groups and their plan links
      const { data: allGroups } = await supabase
        .from("plan_whatsapp_groups")
        .select("*, plan_whatsapp_group_links(plan_id)")
        .eq("is_active", true);

      if (!allGroups || allGroups.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "Nenhum grupo ativo" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: { group: string; action: string }[] = [];

      for (const group of allGroups) {
        const linkedPlanIds = (group.plan_whatsapp_group_links || []).map(
          (l: { plan_id: string }) => l.plan_id
        );

        const shouldBeInGroup =
          should_be_active !== false && userPlanId && linkedPlanIds.includes(userPlanId);

        // Check current membership
        const { data: currentMembership } = await supabase
          .from("plan_whatsapp_members")
          .select("id, status")
          .eq("user_id", user_id)
          .eq("group_id", group.id)
          .eq("status", "active")
          .maybeSingle();

        if (shouldBeInGroup && !currentMembership) {
          // Add to group
          const formattedNumber = formatBrazilianNumber(profile.whatsapp_number);
          const instanceName = group.instance_name || "";

          try {
            await fetch(`${apiUrl}/group/updateParticipant/${instanceName}`, {
              method: "PUT",
              headers: { apikey: apiKey, "Content-Type": "application/json" },
              body: JSON.stringify({
                groupJid: group.group_jid,
                action: "add",
                participants: [`${formattedNumber}@s.whatsapp.net`],
              }),
            });
          } catch (err) {
            console.error("[WA-GROUPS] Error adding to group:", err);
          }

          await supabase.from("plan_whatsapp_members").insert({
            user_id,
            group_id: group.id,
            status: "active",
            added_at: new Date().toISOString(),
          });

          results.push({ group: group.name, action: "added" });
        } else if (!shouldBeInGroup && currentMembership) {
          // Remove from group
          const formattedNumber = formatBrazilianNumber(profile.whatsapp_number);
          const instanceName = group.instance_name || "";

          try {
            await fetch(`${apiUrl}/group/updateParticipant/${instanceName}`, {
              method: "PUT",
              headers: { apikey: apiKey, "Content-Type": "application/json" },
              body: JSON.stringify({
                groupJid: group.group_jid,
                action: "remove",
                participants: [`${formattedNumber}@s.whatsapp.net`],
              }),
            });
          } catch (err) {
            console.error("[WA-GROUPS] Error removing from group:", err);
          }

          await supabase
            .from("plan_whatsapp_members")
            .update({ status: "removed", removed_at: new Date().toISOString() })
            .eq("id", currentMembership.id);

          results.push({ group: group.name, action: "removed" });
        } else {
          results.push({ group: group.name, action: "no_change" });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("[WA-GROUPS] Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
