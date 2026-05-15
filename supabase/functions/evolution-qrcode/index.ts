/**
 * Gerenciador de QR Codes e Instâncias (Evolution API)
 * 
 * Responsável por criar instâncias no servidor de WhatsApp, gerar QR Codes para conexão,
 * monitorar o status da bateria/sinal e desconectar sessões.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "1.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

interface QRCodeRequest {
  organization_id?: string;
  instance_name: string;
  action?: "create" | "connect" | "status" | "qrcode" | "logout" | "delete";
  integration_id?: string;
}

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
}

Deno.serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[evolution-qrcode][${requestId}] Request received: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn(`[evolution-qrcode][${requestId}] Unauthorized: No valid auth header`);
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const isServiceRoleToken = token === serviceKey;
    const hasInternalCronHeader = req.headers.get("X-Internal-Cron") === "true" || req.headers.get("x-internal-cron") === "true";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const isTrustedCronToken = hasInternalCronHeader && anonKey && token === anonKey;
    const isInternalCron = isServiceRoleToken || isTrustedCronToken;

    let user = null;
    if (!isInternalCron) {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData.user) {
        console.warn(`[evolution-qrcode][${requestId}] Auth failure:`, authError);
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }
      user = authData.user;
    } else {
      console.log(`[evolution-qrcode][${requestId}] Running with internal/service-role bypass`);
    }

    // Safer body parsing
    let body: QRCodeRequest;
    try {
      const rawBody = await req.text();
      body = rawBody ? JSON.parse(rawBody) : {};
      console.log(`[evolution-qrcode][${requestId}] Body:`, JSON.stringify(body));
    } catch (e) {
      console.error(`[evolution-qrcode][${requestId}] Failed to parse body:`, e);
      return jsonResponse({ success: false, error: "Request body inválido" }, 400);
    }

    if (!body.instance_name?.trim()) {
      return jsonResponse({ success: false, error: "instance_name é obrigatório" });
    }

    if (body.organization_id && user && !isInternalCron) {
      const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
        supabase.rpc("is_org_member", {
          _org_id: body.organization_id,
          _user_id: user.id,
        }),
        supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        }),
      ]);

      if (!isMember && !isAdmin) {
        console.warn(`[evolution-qrcode][${requestId}] Permission denied for user ${user.id} in org ${body.organization_id}`);
        return jsonResponse({ success: false, error: "Sem permissão nesta organização" }, 403);
      }
    }

    const action = body.action || "connect";
    const evoConfig = await resolveEvolutionConfig(supabase, body.organization_id, body.instance_name);

    console.log(`[evolution-qrcode][${requestId}] Resolved config: URL=${evoConfig.api_url}, Instance=${evoConfig.instance_name}`);

    if (!evoConfig.api_url || !evoConfig.api_key) {
      return jsonResponse({
        success: false,
        error: "Evolution API não configurada. Contate o administrador da plataforma.",
      });
    }

    const baseUrl = evoConfig.api_url.replace(/\/+$/, "");
    const apiKey = evoConfig.api_key;
    const instanceName = evoConfig.instance_name;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.warn(`[evolution-qrcode][${requestId}] Action ${action} timed out after 25s`);
      controller.abort();
    }, 25000); // Slightly increased to 25s

    // Save user_id on the integration record when connecting
    const saveUserOnIntegration = async () => {
      if (!user?.id) return; // Skip if no user (internal cron)
      
      if (body.integration_id) {
        await supabase
          .from("organization_integrations")
          .update({ user_id: user.id } as any)
          .eq("id", body.integration_id);
      } else if (body.organization_id) {
        // Find integration by instance name and update
        const { data: integrations } = await supabase
          .from("organization_integrations")
          .select("id, config")
          .eq("organization_id", body.organization_id)
          .in("integration_type", ["evolution_api", "whatsapp_business"])
          .eq("is_active", true);
        const normalize = (v: string) => v.toLowerCase().replace(/[\s_-]+/g, "");
        const target = normalize(body.instance_name.trim());
        const match = (integrations || []).find((r: any) => {
          const name = r.config?.instance_name?.trim();
          return !!name && normalize(name) === target;
        });
        if (match) {
          await supabase
            .from("organization_integrations")
            .update({ user_id: user.id } as any)
            .eq("id", match.id);
        }
      }
    };

    // Sync the real instance name and Evolution instanceId back to DB after connect/create
    const syncInstanceMetadata = async (realInstanceName: string, evolutionInstanceId?: string) => {
      if (!body.organization_id) return;
      const { data: integrations } = await supabase
        .from("organization_integrations")
        .select("id, config, name")
        .eq("organization_id", body.organization_id)
        .in("integration_type", ["evolution_api", "whatsapp_business"])
        .eq("is_active", true);

      const normalize = (v: string) => v.toLowerCase().replace(/[\s_-]+/g, "");
      const target = normalize(body.instance_name.trim());
      const match = (integrations || []).find((r: any) => {
        const name = r.config?.instance_name?.trim() || r.name?.trim() || "";
        return !!name && normalize(name) === target;
      });

      if (match) {
        const existingConfig = (match.config || {}) as Record<string, unknown>;
        const updatedConfig = {
          ...existingConfig,
          instance_name: realInstanceName,
          ...(evolutionInstanceId ? { evolution_instance_id: evolutionInstanceId } : {}),
        };
        await supabase
          .from("organization_integrations")
          .update({ name: realInstanceName, config: updatedConfig })
          .eq("id", match.id);
      }
    };

    try {
      if (action === "create") {
        await saveUserOnIntegration();
        const result = await createInstanceAndFetchQRCode(
          baseUrl,
          apiKey,
          instanceName,
          supabaseUrl,
          controller.signal,
        );
        // Sync the real instance name back to DB
        const resultBody = await result.clone().json().catch(() => ({}));
        if (resultBody.success && resultBody.instance_name) {
          await syncInstanceMetadata(resultBody.instance_name, resultBody.instance?.instanceId);
        }
        return result;
      }

      if (action === "connect" || action === "qrcode") {
        await saveUserOnIntegration();
        const result = await getQRCode(
          baseUrl,
          apiKey,
          instanceName,
          supabaseUrl,
          controller.signal,
          true,
        );
        // Sync the real instance name back to DB
        const resultBody = await result.clone().json().catch(() => ({}));
        if (resultBody.success && resultBody.instance_name) {
          await syncInstanceMetadata(resultBody.instance_name);
          if (resultBody.state) {
            await updateIntegrationConnectionState(supabase, body.organization_id, body.instance_name, resultBody.instance_name, String(resultBody.state), resultBody);
          }
        }
        return result;
      }

      if (action === "status") {
        return await getConnectionStatus(supabase, body.organization_id, baseUrl, apiKey, instanceName, controller.signal, body.action_source || "manual_sync");
      }

      if (action === "logout") {
        return await logoutInstance(baseUrl, apiKey, instanceName, controller.signal);
      }

      if (action === "delete") {
        return await deleteInstance(baseUrl, apiKey, instanceName, controller.signal);
      }

      return jsonResponse({ success: false, error: "Ação inválida" });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error("evolution-qrcode error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    const isTimeout = message.includes("aborted") || message.includes("AbortError");

    return jsonResponse({
      success: false,
      error: isTimeout
        ? "A Evolution API não respondeu a tempo (20s). Verifique se a URL está acessível via HTTPS na porta 443."
        : message,
    }, isTimeout ? 504 : 500);
  }
});

async function resolveEvolutionConfig(
  supabase: any,
  organizationId: string | undefined,
  requestedInstanceName: string,
): Promise<EvolutionConfig> {
  const trimmedInstance = requestedInstanceName.trim();
  let integrationConfig: Record<string, string> | null = null;

  const isUuid = (id?: string) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (organizationId && isUuid(organizationId)) {
    const { data: integrations, error: intError } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", organizationId)
      .eq("integration_type", "evolution_api")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (intError) {
      console.error(`[evolution-qrcode] Error fetching integrations:`, intError);
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_-]+/g, "");

    const target = normalize(trimmedInstance);

    const matched = (integrations || []).find((row: any) => {
      const name = row.config?.instance_name?.trim();
      return !!name && normalize(name) === target;
    });

    integrationConfig = matched?.config || (integrations || [])[0]?.config || null;
  }

  const { data: globalConfig } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "evolution_api")
    .maybeSingle();

  const globalValue = ((globalConfig as Record<string, unknown> | null)?.value || {}) as Record<string, string>;
  const integrationApiUrl =
    integrationConfig?.own_api_url?.trim() ||
    integrationConfig?.api_url?.trim() ||
    "";

  const integrationApiKey =
    integrationConfig?.own_api_key?.trim() ||
    integrationConfig?.api_key?.trim() ||
    "";

  return {
    api_url: integrationApiUrl || globalValue.api_url || "",
    api_key: integrationApiKey || globalValue.api_key || "",
    instance_name: integrationConfig?.instance_name?.trim() || trimmedInstance,
  };
}

async function getConnectionStatus(
  supabase: any,
  organizationId: string | undefined,
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
  eventSource: string = "qrcode_check"
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  let lastError: { status: number; details: unknown; instance: string } | null = null;

  for (const candidate of candidates) {
    const statusRes = await fetch(
      `${baseUrl}/instance/connectionState/${encodeURIComponent(candidate)}`,
      {
        headers: { apikey: apiKey },
        signal,
      },
    );

    const statusRaw = await statusRes.text();
    const statusData = parseUnknown(statusRaw) as any;

    if (statusRes.ok) {
      const state = String(statusData?.instance?.state || statusData?.state || statusData?.status || "").toLowerCase();
      await updateIntegrationConnectionState(supabase, organizationId, requestedInstanceName, candidate, state || "unknown", statusData, eventSource);

      if (state === "open" || state === "connected") {
        await registerInboundWebhook(baseUrl, apiKey, candidate, Deno.env.get("SUPABASE_URL")!);
      }
      return jsonResponse({
        success: true,
        data: statusData,
        instance_name: candidate,
        state: state || null,
      });
    }

    lastError = { status: statusRes.status, details: statusData, instance: candidate };

    if (!isInstanceNotFound(statusRes.status, statusData)) {
      break;
    }
  }

  await updateIntegrationConnectionState(supabase, organizationId, requestedInstanceName, lastError?.instance || requestedInstanceName, "not_found", lastError?.details || null, eventSource);

  return jsonResponse({
    success: false,
    error: lastError ? `Erro ao consultar status: ${lastError.status}` : "Instância não encontrada",
    data: lastError?.details || null,
    instance_name: lastError?.instance || requestedInstanceName,
    instance_candidates: candidates,
  });
}

async function updateIntegrationConnectionState(
  supabase: any,
  organizationId: string | undefined,
  requestedInstanceName: string,
  realInstanceName: string,
  state: string,
  statusData: any,
  eventSource: string = "qrcode_check"
) {
  if (!organizationId) return;

  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "");
  const requested = normalize(requestedInstanceName || "");
  const real = normalize(realInstanceName || "");

  const { data: integrations } = await supabase
    .from("organization_integrations")
    .select("id, name, config")
    .eq("organization_id", organizationId)
    .eq("integration_type", "evolution_api")
    .eq("is_active", true);

  const match = (integrations || []).find((row: any) => {
    const config = (row.config || {}) as Record<string, unknown>;
    const candidates = [config.instance_name, row.name, config.evolution_instance_id, config.instance_id]
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => normalize(String(value)));
    return candidates.includes(requested) || candidates.includes(real);
  });

  if (!match) {
    console.log(`[evolution-qrcode][AUDIT] No matching integration found for ${requestedInstanceName} (${realInstanceName}) in org ${organizationId}`);
    return;
  }

  const config = (match.config || {}) as Record<string, unknown>;
  const instancePayload = statusData?.instance || statusData || {};
  const ownerJid = instancePayload?.ownerJid || instancePayload?.owner || statusData?.ownerJid || "";
  const ownerPhone = typeof ownerJid === "string" ? ownerJid.replace(/@.*$/, "").replace(/\D/g, "") : "";
  
  // Implement fallback/retry logic for unknown states
  let normalizedState = String(state || "unknown").toLowerCase();
  
  if (normalizedState === "unknown" || normalizedState === "undefined") {
    console.log(`[evolution-qrcode][RETRY] State is unknown for ${realInstanceName}, marking for retry.`);
    // We could potentially trigger another check here, but for now we label it clearly
    normalizedState = "unknown_retry_pending";
  }

  const oldStatus = String(config.connection_status || "unknown");

  const nextConfig = {
    ...config,
    instance_name: realInstanceName || requestedInstanceName,
    connection_status: normalizedState,
    connection_state: normalizedState,
    last_status_check_at: new Date().toISOString(),
    ...(instancePayload?.instanceId ? { evolution_instance_id: instancePayload.instanceId } : {}),
    ...(ownerJid ? { owner_jid: ownerJid } : {}),
    ...(ownerPhone && !config.phone_number ? { phone_number: `+${ownerPhone}` } : {}),
    ...(["open", "connected"].includes(normalizedState) ? { connected_at: new Date().toISOString() } : {}),
  };

  await supabase
    .from("organization_integrations")
    .update({ name: realInstanceName || match.name, config: nextConfig, last_sync_at: new Date().toISOString() })
    .eq("id", match.id);

  // Log audit trail if status changed
  if (oldStatus !== normalizedState) {
    console.log(`[evolution-qrcode][AUDIT] Status changed for ${match.id}: ${oldStatus} -> ${normalizedState} via ${eventSource}`);
    await supabase.rpc('log_whatsapp_connection_change', {
      _org_id: organizationId,
      _integration_id: match.id,
      _old_status: oldStatus,
      _new_status: normalizedState,
      _source: eventSource,
      _payload: statusData
    });
  }
}

async function logoutInstance(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  for (const candidate of candidates) {
    try {
      const logoutRes = await fetch(
        `${baseUrl}/instance/logout/${encodeURIComponent(candidate)}`,
        {
          method: "DELETE",
          headers: { apikey: apiKey },
          signal,
        },
      );

      const raw = await logoutRes.text();
      const data = parseUnknown(raw);

      if (logoutRes.ok) {
        return jsonResponse({
          success: true,
          action: "logout",
          message: `Instância ${candidate} desconectada com sucesso`,
          instance_name: candidate,
          details: data,
        });
      }

      if (!isInstanceNotFound(logoutRes.status, data)) {
        return jsonResponse({
          success: false,
          error: `Erro ao desconectar: ${logoutRes.status}`,
          details: data,
          instance_name: candidate,
        });
      }
    } catch (e: any) {
      console.error(`Logout failed for ${candidate}:`, e);
    }
  }

  return jsonResponse({
    success: false,
    error: "Instância não encontrada para desconectar",
    instance_candidates: candidates,
  });
}

async function deleteInstance(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  // Try logout first, then delete
  for (const candidate of candidates) {
    try {
      // Logout first (ignore errors)
      await fetch(
        `${baseUrl}/instance/logout/${encodeURIComponent(candidate)}`,
        { method: "DELETE", headers: { apikey: apiKey }, signal },
      ).catch(() => {});

      const deleteRes = await fetch(
        `${baseUrl}/instance/delete/${encodeURIComponent(candidate)}`,
        {
          method: "DELETE",
          headers: { apikey: apiKey },
          signal,
        },
      );

      const raw = await deleteRes.text();
      const data = parseUnknown(raw);

      if (deleteRes.ok) {
        return jsonResponse({
          success: true,
          action: "deleted",
          message: `Instância ${candidate} removida com sucesso`,
          instance_name: candidate,
          details: data,
        });
      }

      if (!isInstanceNotFound(deleteRes.status, data)) {
        return jsonResponse({
          success: false,
          error: `Erro ao remover instância: ${deleteRes.status}`,
          details: data,
          instance_name: candidate,
        });
      }
    } catch (e: any) {
      console.error(`Delete failed for ${candidate}:`, e);
    }
  }

  return jsonResponse({
    success: false,
    error: "Instância não encontrada para remover",
    instance_candidates: candidates,
  });
}

async function registerInboundWebhook(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  supabaseUrl: string,
) {
  try {
    const inboundWebhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: inboundWebhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: ["MESSAGES_UPSERT", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE"],
        },
      }),
    });
  } catch (e: any) {
    console.error(`Failed to register inbound webhook for ${instanceName}:`, e);
  }
}

async function createInstanceAndFetchQRCode(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  supabaseUrl: string,
  signal: AbortSignal,
): Promise<any> {
  const createRes = await fetch(`${baseUrl}/instance/create`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
    signal,
  });

  const createDataRaw = await createRes.text();
  const createData = parseUnknown(createDataRaw);

  if (!createRes.ok) {
    const message = getErrorMessage(createData);
    const alreadyExists =
      createRes.status === 403 ||
      createRes.status === 409 ||
      /already|já existe|exist/i.test(message);

    if (alreadyExists) {
      await registerInboundWebhook(baseUrl, apiKey, instanceName, supabaseUrl);
      return await getQRCode(
        baseUrl,
        apiKey,
        instanceName,
        supabaseUrl,
        signal,
        false,
      );
    }

    return jsonResponse({
      success: false,
      error: `Erro ao criar instância: ${createRes.status}`,
      details: createData,
    });
  }

  await registerInboundWebhook(baseUrl, apiKey, instanceName, supabaseUrl);

  const qr = (createData as Record<string, unknown>)?.qrcode as Record<string, unknown> | undefined;
  if (qr?.base64 || qr?.pairingCode) {
    return jsonResponse({
      success: true,
      action: "qrcode",
      qrcode: qr.base64 || null,
      pairingCode: qr.pairingCode || null,
      instance: (createData as Record<string, unknown>)?.instance || null,
      instance_name: instanceName,
    });
  }

  return await getQRCode(
    baseUrl,
    apiKey,
    instanceName,
    supabaseUrl,
    signal,
    false,
  );
}

async function getQRCode(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  supabaseUrl: string,
  signal: AbortSignal,
  allowAutoCreate = true,
): Promise<any> {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  for (const candidate of candidates) {
    const statusRes = await fetch(
      `${baseUrl}/instance/connectionState/${encodeURIComponent(candidate)}`,
      { headers: { apikey: apiKey }, signal },
    );

    if (!statusRes.ok) {
      await statusRes.text();
      continue;
    }

    const statusData = await statusRes.json();
    if (statusData?.instance?.state === "open") {
      await registerInboundWebhook(baseUrl, apiKey, candidate, supabaseUrl);
      return jsonResponse({
        success: true,
        action: "connected",
        message: "Instância já está conectada!",
        state: "open",
        instance_name: candidate,
      });
    }
  }

  let lastError: { status: number; details: unknown; instance: string } | null = null;

  for (const candidate of candidates) {
    const qrRes = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(candidate)}`, {
      headers: { apikey: apiKey },
      signal,
    });

    const qrRaw = await qrRes.text();
    const qrData = parseUnknown(qrRaw) as Record<string, unknown>;

    if (qrRes.ok) {
      return jsonResponse({
        success: true,
        action: "qrcode",
        qrcode: qrData.base64 || null,
        pairingCode: qrData.pairingCode || null,
        code: qrData.code || null,
        instance_name: candidate,
      });
    }

    lastError = { status: qrRes.status, details: qrData, instance: candidate };

    if (!isInstanceNotFound(qrRes.status, qrData)) {
      break;
    }
  }

  if (
    allowAutoCreate &&
    lastError &&
    isInstanceNotFound(lastError.status, lastError.details)
  ) {
    return await createInstanceAndFetchQRCode(
      baseUrl,
      apiKey,
      requestedInstanceName,
      supabaseUrl,
      signal,
    );
  }

  return jsonResponse({
    success: false,
    error: lastError
      ? `Erro ao obter QR Code: ${lastError.status}`
      : "Instância não encontrada na Evolution API",
    details: lastError?.details || null,
    instance_name: lastError?.instance || requestedInstanceName,
    instance_candidates: candidates,
  });
}

async function resolveInstanceCandidates(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
): Promise<string[]> {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_-]+/g, "");

  const requested = requestedInstanceName.trim();
  const target = normalize(requested);

  const candidates = new Set<string>([
    requested,
    requested.toLowerCase(),
    requested.replace(/\s+/g, "-"),
    requested.replace(/\s+/g, "_"),
    requested.replace(/\s+/g, ""),
  ]);

  try {
    const instancesResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: { apikey: apiKey },
      signal,
    });

    const rawText = await instancesResponse.text();
    if (!instancesResponse.ok) {
      console.warn(`[evolution-qrcode] Failed to fetch instances from ${baseUrl}: ${instancesResponse.status}`);
      return Array.from(candidates).filter(Boolean);
    }

    const rawInstances = parseUnknown(rawText);
    const instances = Array.isArray(rawInstances) ? rawInstances : [];

    for (const item of instances) {
      const record = item as Record<string, unknown>;
      const nested = record.instance as Record<string, unknown> | undefined;
      const possibleName =
        (typeof record.instanceName === "string" && record.instanceName) ||
        (typeof record.name === "string" && record.name) ||
        (typeof nested?.instanceName === "string" && nested.instanceName) ||
        (typeof nested?.name === "string" && nested.name) ||
        "";

      if (possibleName && normalize(possibleName) === target) {
        candidates.add(possibleName);
      }
    }
  } catch {
    // fallback local
  }

  return Array.from(candidates).filter(Boolean);
}

function parseUnknown(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
}

function getErrorMessage(value: unknown): string {
  if (!value || typeof value !== "object") return String(value || "");
  const data = value as Record<string, unknown>;
  const response = data.response as Record<string, unknown> | undefined;

  const message =
    data.message ||
    data.error ||
    response?.message ||
    response?.error ||
    "";

  if (Array.isArray(message)) {
    return message.map((item) => String(item)).join(" ");
  }

  return String(message || "");
}

function isInstanceNotFound(status: number, data: unknown): boolean {
  if (status !== 404 && status !== 400) return false;

  const message = getErrorMessage(data).toLowerCase();
  return (
    message.includes("instance") &&
    (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("não existe") ||
      message.includes("inexistente")
    )
  );
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
