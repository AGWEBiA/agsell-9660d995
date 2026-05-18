// AI Chat Edge Function for AG Sell Assistant — supports custom AI agents
// Uses dynamic AI Router (OpenAI / Gemini configurable via Admin panel)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  agent_id?: string;
  model?: string;
  context?: {
    contactsCount?: number;
    dealsCount?: number;
    tasksCount?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authSupabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, agent_id, context } = (await req.json()) as RequestBody;

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    let systemPrompt: string;
    let temperature = 0.7;
    let maxTokens = 1024;

    // If agent_id is provided, load the agent config and knowledge base
    if (agent_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: agent, error: agentError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", agent_id)
        .single();

      if (agentError || !agent) {
        throw new Error("Agent not found");
      }

      if (!agent.is_active) {
        throw new Error("Agent is not active");
      }

      // Validate user belongs to agent's organization
      const { data: isMember } = await supabase.rpc('is_org_member', {
        _org_id: agent.organization_id,
        _user_id: user.id,
      });
      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Forbidden - not a member of this organization" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Load knowledge base
      const { data: knowledge } = await supabase
        .from("ai_agent_knowledge")
        .select("title, content")
        .eq("agent_id", agent_id);

      const knowledgeContext = knowledge && knowledge.length > 0
        ? `\n\nBase de Conhecimento:\n${knowledge.map((k: any) => `### ${k.title}\n${k.content}`).join("\n\n")}`
        : "";

      systemPrompt = `${agent.system_prompt}${knowledgeContext}`;
      temperature = agent.temperature || temperature;
      maxTokens = agent.max_tokens || maxTokens;
    } else {
      // Default AG Sell assistant
      systemPrompt = `Você é o Assistente IA do AG Sell, uma plataforma completa de CRM e automação de marketing omnichannel.

Seu papel é ajudar os usuários com:
- Estratégias de vendas e marketing
- Gestão de leads e clientes
- Automações e workflows
- Análise de dados e métricas
- Dicas para aumentar conversões
- Melhores práticas de CRM

${context ? `
Contexto atual do usuário:
- Contatos cadastrados: ${context.contactsCount || 0}
- Deals ativos: ${context.dealsCount || 0}
- Tarefas pendentes: ${context.tasksCount || 0}
` : ''}

Seja conciso, profissional e focado em resultados práticos.
Responda sempre em português brasileiro.
Use emojis ocasionalmente para tornar a conversa mais amigável.`;
    }

    const result = await callAI({
      task: "fast",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature,
      maxTokens,
    });

    return new Response(
      JSON.stringify({ message: result.content || "Desculpe, não consegui processar sua mensagem.", provider: result.provider, model: result.model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
