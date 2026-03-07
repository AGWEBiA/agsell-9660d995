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

    const { message, message_id, conversation_id, contact_id, organization_id } = await req.json();

    if (!message || !organization_id) {
      return new Response(JSON.stringify({ error: "message and organization_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI to analyze sentiment
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis engine. Analyze the message and respond ONLY with a JSON object:
{"sentiment": "positive"|"negative"|"neutral", "confidence": 0.0-1.0, "keywords": ["key1","key2"], "summary": "brief summary in Portuguese"}
No other text, just JSON.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '{"sentiment":"neutral","confidence":0.5,"keywords":[],"summary":"Não foi possível analisar"}';
    
    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      parsed = { sentiment: "neutral", confidence: 0.5, keywords: [], summary: rawContent.substring(0, 200) };
    }

    // Store result
    const { data, error } = await supabase.from("sentiment_analysis").insert({
      organization_id,
      message_id: message_id || null,
      conversation_id: conversation_id || null,
      contact_id: contact_id || null,
      sentiment: parsed.sentiment || "neutral",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      keywords: parsed.keywords || [],
      summary: parsed.summary || null,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, analysis: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
