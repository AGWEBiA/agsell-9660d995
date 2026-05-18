// Sandbox engine - executes automation in test mode
// Redirects messages to test_phone, skips real CRM writes/webhooks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

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
      return new Response(JSON.stringify({ error: execErr?.message ?? "Failed to create execution" }), {
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
                await sendWhatsAppTest(admin, organization_id, instance_id, test_phone, msg);
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

        // ===== Flow / Automation engine =====
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

    // @ts-ignore Deno background task
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runFlow());
    } else {
      runFlow();
    }

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

async function executeNode(
  node: FlowNode,
  ctx: {
    admin: any;
    organizationId: string;
    testPhone: string;
    instanceId?: string;
    variables: Record<string, any>;
  },
): Promise<{ nextPort?: "default" | "yes" | "no"; output: any }> {
  const { admin, organizationId, testPhone, instanceId, variables } = ctx;
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
    const result = await sendWhatsAppTest(admin, organizationId, instanceId, testPhone, msg, cfg);
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

async function sendWhatsAppTest(
  admin: any,
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
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
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
