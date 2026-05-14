import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type IntegrationConfig = Record<string, unknown>;

type OrgInstance = {
  id: string;
  name: string;
  instance_name: string;
  config: IntegrationConfig;
};

const REQUEST_TIMEOUT_MS = 25000;
const GROUP_FETCH_TIMEOUT_MS = 90000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeInstanceName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");

const extractInstanceName = (item: any) =>
  item?.instance?.instanceName || item?.instanceName || item?.name || "";

const extractConnectionState = (item: any) => {
  const rawStatus = item?.connectionStatus;
  const state =
    typeof rawStatus === "string"
      ? rawStatus
      : rawStatus?.state || item?.instance?.state || item?.state || "";

  return String(state).toLowerCase();
};

const formatPhone = (rawValue: string): string => {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.substring(2, 4);
    const rest = digits.substring(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
  }

  return `+${digits}`;
};

const extractPhoneNumber = (instance: any): string => {
  const owner =
    instance?.ownerJid ||
    instance?.instance?.owner ||
    instance?.owner ||
    instance?.instance?.ownerJid ||
    "";

  const ownerValue = typeof owner === "string" ? owner.replace(/@.*$/, "") : "";
  return formatPhone(ownerValue);
};

const extractOwnerJid = (instance: any): string => {
  const owner =
    instance?.ownerJid ||
    instance?.instance?.owner ||
    instance?.owner ||
    instance?.instance?.ownerJid ||
    "";
  return typeof owner === "string" ? owner : "";
};

const parseGroups = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.groups)) return record.groups;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.result)) return record.result;
    if (record.response && typeof record.response === "object") {
      const response = record.response as Record<string, unknown>;
      if (Array.isArray(response.groups)) return response.groups;
      if (Array.isArray(response.data)) return response.data;
    }
  }
  return [];
};

const normalizeBaseUrlCandidates = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  const withoutManager = trimmed.replace(/\/manager\/?$/, "");
  return Array.from(new Set([trimmed, withoutManager, `${withoutManager}/manager`].filter(Boolean)));
};

const buildOrgInstanceNameIndex = (instances: OrgInstance[]) => {
  const map = new Map<string, OrgInstance>();

  for (const instance of instances) {
    const config = (instance.config || {}) as Record<string, unknown>;

    const aliases = [
      instance.instance_name,
      instance.name,
      typeof config.instance_name === "string" ? config.instance_name : "",
      typeof config.evolution_instance_name === "string" ? config.evolution_instance_name : "",
      typeof config.instance === "string" ? config.instance : "",
    ];

    for (const alias of aliases) {
      if (!alias || typeof alias !== "string") continue;
      const normalized = normalizeInstanceName(alias);
      if (!normalized) continue;
      if (!map.has(normalized)) {
        map.set(normalized, instance);
      }
    }
  }

  return map;
};

const fetchGroupsForInstance = async (
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  adminOnly: boolean = false,
): Promise<any[]> => {
  const encodedInstance = encodeURIComponent(instanceName);
  const getParticipants = adminOnly ? "true" : "false";
  const endpoints = normalizeBaseUrlCandidates(baseUrl).flatMap((url) => [
    `${url}/group/fetchAllGroups/${encodedInstance}?getParticipants=${getParticipants}`,
    `${url}/group/fetchAll/${encodedInstance}?getParticipants=${getParticipants}`,
    `${url}/group/findGroups/${encodedInstance}?getParticipants=${getParticipants}`,
  ]);

  let lastErrorMessage = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`Retry ${attempt}/${MAX_RETRIES} for ${instanceName} after ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      for (const endpoint of endpoints) {
        console.log(`Fetching groups from: ${endpoint} (attempt ${attempt + 1})`);

        const groupsResp = await fetch(endpoint, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(GROUP_FETCH_TIMEOUT_MS),
        });

        const rawText = await groupsResp.text();
        if (!groupsResp.ok) {
          console.error(`Failed ${instanceName} (${groupsResp.status}) at ${endpoint}:`, rawText?.substring(0, 500));
          lastErrorMessage = `${groupsResp.status} ${rawText || "request_failed"}`;
          if ([400, 404, 405].includes(groupsResp.status)) continue;
          break;
        }

        console.log(`Groups response for ${instanceName}: ${rawText.length} bytes, first 500: ${rawText.substring(0, 500)}`);

        let groupsData: unknown;
        try {
          groupsData = JSON.parse(rawText);
        } catch {
          console.error(`Invalid JSON for ${instanceName} (${rawText.length} bytes)`);
          lastErrorMessage = "invalid_json_response";
          continue;
        }

        const groups = parseGroups(groupsData);
        console.log(`Parsed ${groups.length} groups for ${instanceName}`);
        return groups;
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.includes("timeout") || message.includes("abort") || message.includes("signal");
      console.error(`Error fetching groups for ${instanceName} (attempt ${attempt + 1}, timeout=${isTimeout}):`, message);
      lastErrorMessage = isTimeout
        ? `Timeout ao buscar grupos (${GROUP_FETCH_TIMEOUT_MS / 1000}s). A instância pode ter muitos grupos.`
        : message;
      if (!isTimeout) break; // Only retry on timeouts
    }
  }

  throw new Error(lastErrorMessage || "Falha ao buscar grupos na Evolution API");
};

const toOrgInstance = (row: any): OrgInstance => {
  const config = (row?.config || {}) as IntegrationConfig;
  const instance_name =
    typeof config.instance_name === "string" && config.instance_name.trim()
      ? config.instance_name.trim()
      : row.name;

  return {
    id: row.id,
    name: row.name,
    instance_name,
    config,
  };
};

Deno.serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Request ${req.method} to fetch-evolution-groups`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn(`[${requestId}] No Bearer token found in Authorization header`);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error(`[${requestId}] Auth error:`, userError);
      return jsonResponse({ error: "Sessão inválida ou expirada" }, 401);
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    const body = await req.json().catch(() => ({}));
    const { organization_id, instance_name: filterInstance, admin_only: adminOnly } = body;

    if (!organization_id) {
      console.warn(`[${requestId}] Missing organization_id`);
      return jsonResponse({ error: "organization_id required" }, 400);
    }

    const adminClient = supabase;

    const { data: isMember, error: memberError } = await adminClient.rpc("is_org_member", {
      _org_id: organization_id,
      _user_id: user.id,
    });

    if (memberError || !isMember) {
      console.warn(`[${requestId}] Permission denied: User ${user.id} is not member of org ${organization_id}`);
      return jsonResponse({ error: "Sem permissão para esta organização" }, 403);
    }


    const { data: orgIntegrationRows, error: integrationError } = await adminClient
      .from("organization_integrations")
      .select("id, name, config")
      .eq("organization_id", organization_id)
      .eq("integration_type", "evolution_api");

    if (integrationError) throw integrationError;

    const orgInstances = (orgIntegrationRows || []).map(toOrgInstance);
    if (orgInstances.length === 0) {
      return jsonResponse({
        instances: [],
        error: "Nenhuma instância Evolution configurada para esta conta.",
      });
    }

    const orgInstancesByNormalizedName = buildOrgInstanceNameIndex(orgInstances);

    let normalizedFilter: string | null = null;
    if (filterInstance) {
      normalizedFilter = normalizeInstanceName(String(filterInstance));
      if (!orgInstancesByNormalizedName.has(normalizedFilter)) {
        return jsonResponse({
          instances: [],
          error: "A instância solicitada não pertence à conta atual.",
        });
      }
    }

    const preferredOrgInstance = normalizedFilter
      ? orgInstancesByNormalizedName.get(normalizedFilter) || null
      : orgInstances[0];

    const preferredConfig = (preferredOrgInstance?.config || {}) as Record<string, string>;

    let baseUrl = (preferredConfig.own_api_url || preferredConfig.api_url || "").replace(/\/$/, "");
    let apiKey = preferredConfig.own_api_key || preferredConfig.api_key || "";

    if (!baseUrl || !apiKey) {
      const { data: globalConfig } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

      if (globalConfig?.value) {
        const val = globalConfig.value as Record<string, string>;
        baseUrl = (val.base_url || val.url || val.api_url || "").replace(/\/$/, "");
        apiKey = val.api_key || val.apikey || "";
      }
    }

    if (!baseUrl || !apiKey) {
      const { data: orgConfig } = await adminClient
        .from("paid_groups_config")
        .select("evolution_api_url, evolution_api_key")
        .eq("organization_id", organization_id)
        .single();

      if (orgConfig) {
        baseUrl = (orgConfig.evolution_api_url || "").replace(/\/$/, "");
        apiKey = orgConfig.evolution_api_key || "";
      }
    }

    if (!baseUrl || !apiKey) {
      return jsonResponse({
        error: "Evolution API não configurada. Configure no painel administrativo.",
        instances: [],
      });
    }

    let instances: any[] = [];
    try {
      const fetchUrl = `${baseUrl}/instance/fetchInstances`;
      console.log("Fetching instances from:", fetchUrl);
      const instancesResp = await fetch(fetchUrl, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(GROUP_FETCH_TIMEOUT_MS),
      });

      if (!instancesResp.ok) {
        const errText = await instancesResp.text();
        console.error("Failed to fetch instances:", errText);
        return jsonResponse({
          error: "Erro ao conectar com Evolution API",
          detail: errText,
          instances: [],
        });
      }

      instances = await instancesResp.json();
      console.log("Raw instances response:", JSON.stringify(instances).substring(0, 2000));
      console.log("Total instances returned:", Array.isArray(instances) ? instances.length : "not-array");
    } catch (fetchErr) {
      console.error("Evolution API connection error:", fetchErr);
      return jsonResponse({
        error: "Não foi possível conectar à Evolution API. Verifique se a URL está acessível via HTTPS.",
        instances: [],
      });
    }

    const connectedInstances = Array.isArray(instances)
      ? instances.filter((i: any) => {
          const state = extractConnectionState(i);
          const instanceName = extractInstanceName(i);
          const normalizedName = normalizeInstanceName(instanceName);
          const isConnected = state === "open" || state === "connected";
          const belongsToOrg = orgInstancesByNormalizedName.has(normalizedName);

          console.log(`Instance "${instanceName}" state="${state}" connected=${isConnected} belongsToOrg=${belongsToOrg}`);

          if (!isConnected || !belongsToOrg) return false;
          if (normalizedFilter) return normalizedName === normalizedFilter;
          return true;
        })
      : [];

    console.log("Connected instances count:", connectedInstances.length);

    const result: Array<{
      instance_id: string | null;
      instance_name: string;
      instance_label: string;
      phone_number: string;
      groups: Array<{ id: string; subject: string; size: number; creation: number }>;
      error?: string;
    }> = [];

    for (const inst of connectedInstances) {
      const instanceName = extractInstanceName(inst);
      if (!instanceName) continue;

      const orgInstance = orgInstancesByNormalizedName.get(normalizeInstanceName(instanceName));
      const phoneFormatted = extractPhoneNumber(inst);
      const ownerJid = extractOwnerJid(inst);

      try {
        const groupsList = await fetchGroupsForInstance(baseUrl, apiKey, instanceName, !!adminOnly);

        let filteredGroups = groupsList;

        // Filter to only groups where the instance is admin
        if (adminOnly && ownerJid) {
          filteredGroups = groupsList.filter((g: any) => {
            const participants = g.participants || [];
            return participants.some((p: any) => {
              const pJid = p.id || p.jid || "";
              const isOwnerMatch = pJid === ownerJid || pJid.replace(/@.*$/, "") === ownerJid.replace(/@.*$/, "");
              const isAdmin = p.admin === "admin" || p.admin === "superadmin" || p.role === "admin" || p.role === "superadmin";
              return isOwnerMatch && isAdmin;
            });
          });
          console.log(`Admin filter: ${groupsList.length} -> ${filteredGroups.length} groups for ${instanceName}`);
        }

        const groups = filteredGroups.map((g: any) => ({
          id: g.id || g.jid || g.groupJid,
          subject: g.subject || g.name || g.groupName || "Sem nome",
          size: g.size || g.participants?.length || 0,
          creation: g.creation || 0,
        }));

        result.push({
          instance_id: orgInstance?.id || null,
          instance_name: orgInstance?.instance_name || instanceName,
          instance_label: orgInstance?.name || instanceName,
          phone_number: phoneFormatted,
          groups,
        });
      } catch (e: any) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error(`Error fetching groups for ${instanceName}:`, errMsg);
        result.push({
          instance_id: orgInstance?.id || null,
          instance_name: orgInstance?.instance_name || instanceName,
          instance_label: orgInstance?.name || instanceName,
          phone_number: phoneFormatted,
          groups: [],
          error: errMsg,
        });
      }
    }

    return jsonResponse({ instances: result });
  } catch (err: any) {
    console.error("fetch-evolution-groups error:", err);
    return jsonResponse({ error: "Erro interno", instances: [] });
  }
});
