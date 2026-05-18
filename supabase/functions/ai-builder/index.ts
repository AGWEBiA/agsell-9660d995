import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, organization_id } = await req.json();

    if (!type || !prompt) {
      return new Response(JSON.stringify({ error: "type and prompt required" }), {
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

      brand_kit: `Você é um especialista em branding. Analise a URL fornecida e extraia a identidade visual. Retorne APENAS um JSON:
{"colors": ["#hex1", "#hex2", ...], "fonts": ["Font1", "Font2"], "logo_url": "url ou null", "tone": "descrição do tom de comunicação"}`,

      suggested_segments: `Você é um especialista em CRM e segmentação de clientes. Com base nos dados fornecidos, sugira segmentos de alto impacto. Retorne APENAS um JSON:
{"segments": [{"name": "nome", "description": "desc", "criteria": "critérios", "estimated_contacts": N, "impact": "high|medium|low", "icon": "trending|alert|cart|users"}]}`,
    };

    const aiResult = await callAI({
      task: "fast",
      messages: [
        { role: "system", content: systemPrompts[type] || systemPrompts.email_campaign },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true,
    });
    const rawContent = aiResult.content || "{}";

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
  } catch (error: any) {
    console.error("AI Builder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
