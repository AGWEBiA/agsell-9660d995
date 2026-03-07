import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), { status: 400, headers: corsHeaders });
    }

    // Use service role to read config (contains API keys)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config, error: configError } = await adminClient
      .from("paid_groups_config")
      .select("*")
      .eq("organization_id", organization_id)
      .single();

    if (configError || !config?.evolution_api_url || !config?.evolution_api_key) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const baseUrl = config.evolution_api_url.replace(/\/$/, "");
    const apiKey = config.evolution_api_key;

    // Step 1: Fetch all instances
    const instancesResp = await fetch(`${baseUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
    });

    if (!instancesResp.ok) {
      const errText = await instancesResp.text();
      console.error("Failed to fetch instances:", errText);
      return new Response(JSON.stringify({ error: "Erro ao buscar instâncias", detail: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const instances = await instancesResp.json();
    const connectedInstances = Array.isArray(instances)
      ? instances.filter((i: any) => {
          const state = i?.instance?.state || i?.state || i?.connectionStatus?.state;
          return state === "open" || state === "connected";
        })
      : [];

    // Step 2: For each connected instance, fetch groups
    const result: Array<{
      instance_name: string;
      groups: Array<{ id: string; subject: string; size: number; creation: number }>;
    }> = [];

    for (const inst of connectedInstances) {
      const instanceName = inst?.instance?.instanceName || inst?.instanceName || inst?.name;
      if (!instanceName) continue;

      try {
        const groupsResp = await fetch(`${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
          headers: { apikey: apiKey },
        });

        if (!groupsResp.ok) {
          console.error(`Failed to fetch groups for ${instanceName}:`, await groupsResp.text());
          continue;
        }

        const groupsData = await groupsResp.json();
        const groups = (Array.isArray(groupsData) ? groupsData : []).map((g: any) => ({
          id: g.id || g.jid || g.groupJid,
          subject: g.subject || g.name || g.groupName || "Sem nome",
          size: g.size || g.participants?.length || 0,
          creation: g.creation || 0,
        }));

        result.push({ instance_name: instanceName, groups });
      } catch (e) {
        console.error(`Error fetching groups for ${instanceName}:`, e);
      }
    }

    return new Response(JSON.stringify({ instances: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-evolution-groups error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
