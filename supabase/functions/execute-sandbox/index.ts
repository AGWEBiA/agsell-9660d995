// Sandbox engine - v4 (Ambiente Lovable Central - Bridge para Produção)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface FlowNode {
  id: string;
  type: string;
  subtype: string;
  label: string;
  config: Record<string, any>;
}
interface FlowConnection {
  id: string;
  from: string;
  to: string;
  fromPort: "default" | "yes" | "no";
}

type ProjectRuntime = {
  url: string;
  serviceRole: string;
  label: "runtime" | "target";
};

type AuthenticatedProject = {
  project: ProjectRuntime;
  user: { id: string };
  isServiceRole: boolean;
};

function getProjectRuntimes(): ProjectRuntime[] {
  const runtimeUrl = Deno.env.get("SUPABASE_URL");
  const runtimeKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const targetUrl = Deno.env.get("TARGET_SUPABASE_URL");
  const targetKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  const projects: ProjectRuntime[] = [];
  if (runtimeUrl && runtimeKey) projects.push({ url: runtimeUrl, serviceRole: runtimeKey, label: "runtime" });
  if (targetUrl && targetKey && targetUrl !== runtimeUrl) {
    projects.push({ url: targetUrl, serviceRole: targetKey, label: "target" });
  }
  return projects;
}

// Cap for delay nodes in sandbox (so user doesn't wait hours)
const MAX_DELAY_MS = 10_000;

function interpolate(text: string, vars: Record<string, any>): string {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, k) => String(vars[k] ?? `{{${k}}}`));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Health check endpoint (must be BEFORE auth)
  const url = new URL(req.url);
  const getAction = url.searchParams.get("action");
  if ((req.method === "GET" && !getAction) || url.searchParams.get("health") === "true") {
    console.log(`Health check received (v4-BRIDGE) - URL: ${req.url}`);
    return new Response(JSON.stringify({
      status: "ok",
      version: "v5-auth-project-resolver",
      runtimes: getProjectRuntimes().map((project) => ({ label: project.label, host: new URL(project.url).host })),
      targetAdminReachable: Deno.env.get("TARGET_SUPABASE_URL") && Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")
        ? await canListUsers(Deno.env.get("TARGET_SUPABASE_URL")!, Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!)
        : false,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT against the project that issued it, then run against that same DB.
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const authResult = await resolveAuthenticatedProject(token);
    if ("error" in authResult) {
      console.error("Auth validation failed:", authResult.detail);
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authResult.detail }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { project, user, isServiceRole } = authResult;

    if (req.method === "GET") {
      const admin = createClient(project.url, project.serviceRole);
      const readResponse = await handleReadAction(url, admin, user.id, isServiceRole);
      return new Response(JSON.stringify(readResponse.body), {
        status: readResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Recebendo solicitação de sandbox:", JSON.stringify(body, null, 2));

    const {
      automation_id,
      automation_type,
      test_phone,
      test_variables = {},
      organization_id,
      instance_id,
    } = body;

    if (!automation_id || !automation_type || !test_phone || !organization_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(project.url, project.serviceRole);

    const hasAccess = await canAccessOrganization(admin, organization_id, user.id, isServiceRole);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden", detail: "Usuário sem acesso à organização informada." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create execution record
    const { data: exec, error: execErr } = await admin
      .from("sandbox_executions")
      
      .insert({
        organization_id,
        automation_id,
        automation_type,
        test_phone,
        test_variables,
        triggered_by: user.id,
        status: "running",
      })
      .select()
      .single();

    if (execErr || !exec) {
      const isMissingTable = execErr?.message?.includes("sandbox_executions") || execErr?.code === "PGRST204";
      const errorMessage = isMissingTable 
        ? "Tabela 'sandbox_executions' não encontrada no projeto de destino. Por favor, execute as migrações no banco de dados."
        : execErr?.message ?? "Failed to create execution";
        
      return new Response(JSON.stringify({ 
        error: errorMessage, 
        code: execErr?.code,
        hint: isMissingTable ? "Run: supabase db push" : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const executionId = exec.id;

    // Background execution
    const runFlow = async () => {
      let order = 0;
      const log = async (
        nodeId: string,
        nodeType: string,
        nodeLabel: string,
        status: string,
        extra: Partial<{ input: any; output: any; error_message: string; duration_ms: number }> = {},
      ) => {
        await admin.from("sandbox_step_logs").insert({
          execution_id: executionId,
          organization_id,
          node_id: nodeId,
          node_type: nodeType,
          node_label: nodeLabel,
          status,
          step_order: order++,
          ...extra,
        });
      };

      try {
        // Load flow
        let flowJson: any = null;
        if (automation_type === "flow") {
          const { data } = await admin
            .from("whatsapp_flows")
            .select("flow_json,name")
            .eq("id", automation_id)
            .single();
          flowJson = data?.flow_json;
        } else if (automation_type === "automation") {
          const { data } = await admin
            .from("automations")
            .select("actions,name,trigger_type")
            .eq("id", automation_id)
            .single();
          flowJson = { nodes: data?.actions ?? [], connections: [] };
        } else if (automation_type === "sequence") {
          const { data } = await admin
            .from("sequence_steps")
            .select("*")
            .eq("sequence_id", automation_id)
            .order("step_order");
          flowJson = { steps: data ?? [] };
        } else if (automation_type === "chatbot") {
          const { data } = await admin
            .from("chatbots")
            .select("nodes,name,whatsapp_instance_id")
            .eq("id", automation_id)
            .single();
          flowJson = { chatbotNodes: data?.nodes ?? [], chatbotInstance: data?.whatsapp_instance_id };
        }

        if (!flowJson) {
          throw new Error("Fluxo não encontrado");
        }

        const nodes: FlowNode[] = flowJson.nodes ?? [];
        const connections: FlowConnection[] = flowJson.connections ?? [];

        // ===== Sequence engine (simpler) =====
        if (automation_type === "sequence") {
          for (const step of (flowJson.steps as any[])) {
            const start = Date.now();
            await log(step.id, step.action_type, step.action_type, "running");
            try {
              if (step.action_type === "send_message") {
                const msg = interpolate(String(step.content?.message ?? ""), test_variables);
                await sendWhatsAppTest(admin, project, organization_id, instance_id, test_phone, msg);
                await log(step.id, step.action_type, step.action_type, "success", {
                  output: { message: msg, sent_to: test_phone },
                  duration_ms: Date.now() - start,
                });
              } else if (step.action_type === "wait") {
                const ms = Math.min((step.delay_minutes ?? 1) * 60_000, MAX_DELAY_MS);
                await sleep(ms);
                await log(step.id, step.action_type, "Aguardar", "success", {
                  output: { waited_ms: ms, capped: ms < (step.delay_minutes ?? 1) * 60_000 },
                  duration_ms: ms,
                });
              } else {
                await log(step.id, step.action_type, step.action_type, "skipped", {
                  output: { reason: "Não suportado no sandbox" },
                });
              }
            } catch (err) {
              await log(step.id, step.action_type, step.action_type, "error", {
                error_message: String(err),
                duration_ms: Date.now() - start,
              });
            }
          }
          await admin.from("sandbox_executions").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", executionId);
          return;
        }

        // ===== Chatbot engine (chatbots table) =====
        if (automation_type === "chatbot") {
          const cbNodes: any[] = flowJson.chatbotNodes ?? [];
          if (cbNodes.length === 0) throw new Error("Chatbot sem blocos");
          const effectiveInstance = instance_id ?? flowJson.chatbotInstance ?? undefined;
          let current: any = cbNodes[0];
          const visited = new Set<string>();
          let safety = 0;
          while (current && safety < 50) {
            safety++;
            if (visited.has(current.id)) {
              await log(current.id, current.type, current.label ?? current.type, "skipped", {
                output: { reason: "Loop detectado" },
              });
              break;
            }
            visited.add(current.id);
            const start = Date.now();
            const label = current.label || current.config?.title || current.type;
            await log(current.id, current.type, label, "running", { input: current.config });
            try {
              const result = await executeChatbotNode(current, {
                admin, project, organizationId: organization_id, testPhone: test_phone,
                instanceId: effectiveInstance, variables: test_variables,
              });
              await log(current.id, current.type, label, "success", {
                output: result.output, duration_ms: Date.now() - start,
              });
            } catch (err) {
              await log(current.id, current.type, label, "error", {
                error_message: String(err), duration_ms: Date.now() - start,
              });
            }
            // Next node: first connection's targetId
            const nextId = current.connections?.[0]?.targetId;
            current = nextId ? cbNodes.find((n: any) => n.id === nextId) : null;
          }
          await admin.from("sandbox_executions").update({
            status: "completed", completed_at: new Date().toISOString(),
          }).eq("id", executionId);
          return;
        }

        // Find trigger node
        let current = nodes.find((n) => n.type === "trigger") ?? nodes[0];
        if (!current) throw new Error("Nenhum nó inicial encontrado");

        const visited = new Set<string>();
        let safety = 0;

        while (current && safety < 100) {
          safety++;
          if (visited.has(current.id)) {
            await log(current.id, current.type, current.label, "skipped", {
              output: { reason: "Loop detectado" },
            });
            break;
          }
          visited.add(current.id);

          const start = Date.now();
          await log(current.id, current.type, current.label, "running", {
            input: current.config,
          });

          let nextPort: "default" | "yes" | "no" = "default";
          try {
            const result = await executeNode(current, {
                admin,
                project,
              organizationId: organization_id,
              testPhone: test_phone,
              instanceId: instance_id,
              variables: test_variables,
            });
            nextPort = result.nextPort ?? "default";
            await log(current.id, current.type, current.label, "success", {
              output: result.output,
              duration_ms: Date.now() - start,
            });
          } catch (err) {
            await log(current.id, current.type, current.label, "error", {
              error_message: String(err),
              duration_ms: Date.now() - start,
            });
            // Continue on error in sandbox so user sees full picture
          }

          // Find next node via connection
          const conn = connections.find((c) => c.from === current!.id && c.fromPort === nextPort)
            ?? connections.find((c) => c.from === current!.id);
          if (!conn) break;
          current = nodes.find((n) => n.id === conn.to)!;
        }

        await admin.from("sandbox_executions").update({
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", executionId);
      } catch (err) {
        await admin.from("sandbox_executions").update({
          status: "failed",
          error_message: String(err),
          completed_at: new Date().toISOString(),
        }).eq("id", executionId);
      }
    };

    await runFlow();

    return new Response(
      JSON.stringify({ success: true, execution_id: executionId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function resolveAuthenticatedProject(token: string): Promise<
  | AuthenticatedProject
  | { error: "Unauthorized"; detail: string }
> {
  const serviceProject = await resolveServiceRoleProject(token);
  if (serviceProject) {
    console.log(`Auth authorized via Service Role (${serviceProject.label})`);
    return { project: serviceProject, user: { id: "00000000-0000-0000-0000-000000000000" }, isServiceRole: true };
  }

  let lastAuthError = "Token não reconhecido";

  for (const project of getProjectRuntimes()) {
    const authClient = createClient(project.url, project.serviceRole, { auth: { persistSession: false } });
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) {
      console.log(`Auth authorized via user JWT (${project.label})`);
      return { project, user, isServiceRole: false };
    }
    lastAuthError = error?.message ?? lastAuthError;
  }

  return { error: "Unauthorized", detail: lastAuthError };
}

async function resolveServiceRoleProject(token: string): Promise<ProjectRuntime | null> {
  for (const project of getProjectRuntimes()) {
    if (token === project.serviceRole || await canListUsers(project.url, token)) return project;
  }
  return null;
}

async function canListUsers(projectUrl: string, token: string): Promise<boolean> {
  const result = await fetch(`${projectUrl}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => null);
  return result?.ok === true;
}

async function canAccessOrganization(admin: any, organizationId: string, userId: string, isServiceRole: boolean): Promise<boolean> {
  if (isServiceRole) return true;
  const { data, error } = await admin.rpc("is_org_member", { _org_id: organizationId, _user_id: userId });
  if (error) {
    console.error("Organization access check failed:", error.message);
    return false;
  }
  return data === true;
}

async function handleReadAction(
  url: URL,
  admin: any,
  userId: string,
  isServiceRole: boolean,
): Promise<{ status: number; body: Record<string, any> }> {
  const action = url.searchParams.get("action");
  if (action === "execution") {
    const executionId = url.searchParams.get("execution_id");
    if (!executionId) return { status: 400, body: { error: "Missing execution_id" } };

    const { data: execution, error: execError } = await admin
      .from("sandbox_executions")
      .select("*")
      .eq("id", executionId)
      .single();

    if (execError || !execution) {
      return { status: 404, body: { error: execError?.message ?? "Execução não encontrada" } };
    }

    const hasAccess = await canAccessOrganization(admin, execution.organization_id, userId, isServiceRole);
    if (!hasAccess) return { status: 403, body: { error: "Forbidden" } };

    const { data: steps, error: stepsError } = await admin
      .from("sandbox_step_logs")
      .select("*")
      .eq("execution_id", executionId)
      .order("step_order");

    if (stepsError) return { status: 500, body: { error: stepsError.message } };
    return { status: 200, body: { execution, steps: steps ?? [] } };
  }

  if (action === "history") {
    const automationId = url.searchParams.get("automation_id");
    if (!automationId) return { status: 400, body: { error: "Missing automation_id" } };

    const { data: executions, error } = await admin
      .from("sandbox_executions")
      .select("*")
      .eq("automation_id", automationId)
      .order("started_at", { ascending: false })
      .limit(10);

    if (error) return { status: 500, body: { error: error.message } };
    const visibleExecutions = [];
    for (const execution of executions ?? []) {
      if (await canAccessOrganization(admin, execution.organization_id, userId, isServiceRole)) {
        visibleExecutions.push(execution);
      }
    }
    return { status: 200, body: { executions: visibleExecutions } };
  }

  return { status: 400, body: { error: "Invalid action" } };
}

async function executeNode(
  node: FlowNode,
  ctx: {
    admin: any;
    project: ProjectRuntime;
    organizationId: string;
    testPhone: string;
    instanceId?: string;
    variables: Record<string, any>;
  },
): Promise<{ nextPort?: "default" | "yes" | "no"; output: any }> {
  const { admin, project, organizationId, testPhone, instanceId, variables } = ctx;
  const cfg = node.config ?? {};

  // ── Trigger nodes: just pass through
  if (node.type === "trigger") {
    return { output: { triggered: true, type: node.subtype } };
  }

  // ── WhatsApp / send message actions
  if (
    node.subtype === "send_whatsapp" ||
    node.subtype === "whatsapp_message" ||
    node.type === "action" && (cfg.message || cfg.message_kind)
  ) {
    const msg = interpolate(String(cfg.message ?? ""), variables);
    const result = await sendWhatsAppTest(admin, project, organizationId, instanceId, testPhone, msg, cfg);
    return { output: { sent_to: testPhone, message: msg, ...result } };
  }

  // ── Delay/wait
  if (node.type === "delay" || node.subtype === "wait" || node.subtype === "delay") {
    const duration =
      Number(cfg.delay_ms) ||
      Number(cfg.delay_seconds ?? 0) * 1000 ||
      Number(cfg.delay_minutes ?? 0) * 60_000 ||
      Number(cfg.minutes ?? 0) * 60_000 ||
      1000;
    const capped = Math.min(duration, MAX_DELAY_MS);
    await sleep(capped);
    return {
      output: { waited_ms: capped, original_ms: duration, capped: capped < duration },
    };
  }

  // ── Condition: in sandbox, follow "yes" by default unless variable says otherwise
  if (node.type === "condition") {
    const port: "yes" | "no" = variables.__condition_default === false ? "no" : "yes";
    return { nextPort: port, output: { branch: port } };
  }

  // ── Tags / Transfer / Webhook etc: skip with log
  return {
    output: {
      skipped: true,
      reason: `Ação "${node.subtype || node.type}" não executa em modo teste (apenas registrada)`,
    },
  };
}

// Chatbot node executor (chatbots table uses different node shape)
async function executeChatbotNode(
  node: any,
  ctx: {
    admin: any; project: ProjectRuntime; organizationId: string; testPhone: string;
    instanceId?: string; variables: Record<string, any>;
  },
): Promise<{ output: any }> {
  const { admin, project, organizationId, testPhone, instanceId, variables } = ctx;
  const cfg = node.config ?? {};
  const t = node.type;

  if (t === "text_message" || t === "no_interaction" || t === "transfer_human" || t === "close_conversation") {
    const msg = interpolate(String(cfg.message ?? ""), variables);
    if (!msg.trim()) return { output: { skipped: true, reason: "Mensagem vazia" } };
    const r = await sendWhatsAppTest(admin, project, organizationId, instanceId, testPhone, msg);
    return { output: { sent_to: testPhone, message: msg, ...r } };
  }

  if (t === "menu") {
    const title = interpolate(String(cfg.title ?? cfg.message ?? "Menu"), variables);
    const opts: any[] = Array.isArray(cfg.options) ? cfg.options : [];
    const body = `${title}\n\n` + opts.map((o, i) => `${i + 1}. ${o.label ?? o.text ?? ""}`).join("\n");
    const r = await sendWhatsAppTest(admin, project, organizationId, instanceId, testPhone, body);
    return { output: { sent_to: testPhone, menu_options: opts.length, ...r } };
  }

  if (t === "delay") {
    const ms = Math.min(Number(cfg.seconds ?? 1) * 1000, MAX_DELAY_MS);
    await sleep(ms);
    return { output: { waited_ms: ms } };
  }

  if (t === "ai_response" || t === "ai_mission") {
    return { output: { skipped: true, reason: "Bloco de IA simulado (não executa em teste)", mission: cfg.mission ?? cfg.systemPrompt } };
  }

  // add_tag, remove_tag, transfer_department, webhook → registrar mas não executar de verdade
  return { output: { skipped: true, reason: `Bloco "${t}" registrado mas não executado em modo teste`, config: cfg } };
}


async function sendWhatsAppTest(
  admin: any,
  project: ProjectRuntime,
  organizationId: string,
  instanceId: string | undefined,
  to: string,
  message: string,
  extraCfg: any = {},
): Promise<any> {
  if (!message?.trim()) {
    return { skipped: true, reason: "Mensagem vazia" };
  }

  // Use service-role invocation of send-whatsapp
  try {
    const res = await fetch(`${project.url}/functions/v1/send-whatsapp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${project.serviceRole}`,
        "Content-Type": "application/json",
        apikey: project.serviceRole,
      },
      body: JSON.stringify({
        organization_id: organizationId,
        instance_id: instanceId,
        to,
        message,
        message_kind: extraCfg.message_kind ?? "text",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error ?? `send-whatsapp HTTP ${res.status}`);
    }
    return { delivered: true, response: data };
  } catch (err) {
    throw new Error(`Falha ao enviar WhatsApp: ${err}`);
  }
}
