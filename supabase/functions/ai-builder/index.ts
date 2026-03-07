import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, prompt, organization_id } = await req.json();
    // type: 'email_campaign' | 'automation_flow' | 'subject_line' | 'whatsapp_message'

    if (!type || !prompt || !organization_id) {
      return new Response(JSON.stringify({ error: "type, prompt and organization_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompts: Record<string, string> = {
      email_campaign: `Você é um especialista em e-mail marketing. Crie uma campanha de e-mail completa em HTML responsivo com base na descrição do usuário. Retorne APENAS um JSON:
{"subject": "assunto", "preview_text": "preview", "html_content": "<html>...</html>"}`,
      
      automation_flow: `Você é um especialista em automação de marketing. Crie um fluxo de automação com base na descrição. Retorne APENAS um JSON:
{"name": "nome do fluxo", "description": "descrição", "steps": [{"type": "trigger|action|condition|delay", "config": {}}]}`,
      
      subject_line: `Você é um copywriter. Gere 5 variações de assunto de e-mail baseadas na descrição. Retorne APENAS um JSON:
{"suggestions": [{"subject": "assunto", "tone": "profissional|casual|urgente|curioso"}, ...]}`,
      
      whatsapp_message: `Você é um especialista em comunicação via WhatsApp para negócios. Crie uma mensagem de WhatsApp eficaz. Retorne APENAS um JSON:
{"message": "texto da mensagem", "cta": "call to action sugerido"}`,
    };

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[type] || systemPrompts.email_campaign },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      parsed = { raw: rawContent };
    }

    return new Response(JSON.stringify({ success: true, result: parsed, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Builder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
