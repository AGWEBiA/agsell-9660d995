import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-router.ts";

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { deal_id, organization_id } = await req.json();

    if (!deal_id || !organization_id) {
      return new Response(JSON.stringify({ error: "deal_id and organization_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch deal data
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("*, contacts(*), companies(*)")
      .eq("id", deal_id)
      .single();
    if (dealErr) throw dealErr;

    // Fetch activities count
    const { count: activityCount } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("deal_id", deal_id);

    // Fetch pipeline stage info
    let stageName = "unknown";
    if (deal.stage_id) {
      const { data: stage } = await supabase
        .from("pipeline_stages")
        .select("name, position")
        .eq("id", deal.stage_id)
        .single();
      if (stage) stageName = stage.name;
    }

    // Build context for AI
    const dealContext = {
      title: deal.title,
      value: deal.value,
      stage: stageName,
      probability: deal.probability,
      expected_close: deal.expected_close_date,
      days_since_creation: Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      activities_count: activityCount || 0,
      has_contact: !!deal.contact_id,
      has_company: !!deal.company_id,
      contact_lead_score: deal.contacts?.lead_score || 0,
      notes: deal.notes?.substring(0, 200) || "",
    };

    const aiResult = await callAI({
      task: "nano",
      messages: [
        {
          role: "system",
          content: `You are a sales prediction AI. Analyze the deal data and predict win probability. Respond ONLY with a JSON:
{"win_probability": 0-100, "factors": {"positive": ["factor1"], "negative": ["factor1"], "suggestions": ["suggestion1"]}}
Consider: deal value, stage progression, activity count, days open, lead score, contact/company presence.`,
        },
        { role: "user", content: JSON.stringify(dealContext) },
      ],
      temperature: 0.2,
      maxTokens: 300,
      jsonMode: true,
    });
    const rawContent = aiResult.content || "{}";

    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      parsed = { win_probability: 50, factors: { positive: [], negative: [], suggestions: [] } };
    }

    // Store result
    const { data, error } = await supabase
      .from("deal_win_scores")
      .upsert({
        deal_id,
        organization_id,
        win_probability: Math.min(100, Math.max(0, parsed.win_probability || 50)),
        factors: parsed.factors || {},
        last_calculated_at: new Date().toISOString(),
      }, { onConflict: "deal_id" })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, score: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Win probability error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
