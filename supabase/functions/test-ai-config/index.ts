// Testa configuração de provedor de IA — usado pelo painel Admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, clearAIConfigCache, type AIProvider } from "../_shared/ai-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as AIProvider | undefined;

    clearAIConfigCache();
    const start = Date.now();
    const result = await callAI({
      task: "nano",
      preferProvider: provider,
      messages: [{ role: "user", content: "Responda apenas 'ok' para confirmar a conexão." }],
      maxTokens: 20,
      temperature: 0,
    });
    const ms = Date.now() - start;

    return new Response(JSON.stringify({
      success: true,
      provider: result.provider,
      model: result.model,
      response: result.content.trim(),
      latency_ms: ms,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
