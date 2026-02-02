// AI Chat Edge Function for AG Sell Assistant

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
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
    const { messages, context } = (await req.json()) as RequestBody;

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const systemPrompt = `Você é o Assistente IA do AG Sell, uma plataforma completa de CRM e automação de marketing omnichannel.

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
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
