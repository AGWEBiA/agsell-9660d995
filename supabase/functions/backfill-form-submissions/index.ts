import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

const ADMIN_TOKEN = "bf_fs_2026_05_14_yT7vK9pQ3mN7vR2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.headers.get("x-admin-token") !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sourceUrl = Deno.env.get("SUPABASE_URL")!;
    const sourceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const targetUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
    const targetKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

    const source = createClient(sourceUrl, sourceKey);
    const target = createClient(targetUrl, targetKey);

    const FORM_IDS = [
      "1cc7a18d-1310-4a4b-b2ca-32141edb2cf9",
      "d6cc9b67-fc6c-4bd9-854d-e24e5697b49c",
      "18d01129-a244-4f98-8e77-a2aef73564db",
    ];

    const { data: srcSubs, error: srcErr } = await source
      .from("form_submissions")
      .select("id, form_id, data, created_at")
      .in("form_id", FORM_IDS);
    if (srcErr) throw srcErr;

    const { data: tgtExisting } = await target
      .from("form_submissions")
      .select("id")
      .in("form_id", FORM_IDS);
    const existingIds = new Set((tgtExisting || []).map((r: any) => r.id));

    const missing = (srcSubs || []).filter((s: any) => !existingIds.has(s.id));

    let inserted = 0;
    const errors: any[] = [];

    for (const s of missing) {
      const { error } = await target.from("form_submissions").insert({
        id: s.id,
        form_id: s.form_id,
        data: s.data,
        created_at: s.created_at,
        was_sent_to_crm: false,
      });
      if (error) errors.push({ id: s.id, error: error.message });
      else inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        source_total: srcSubs?.length || 0,
        already_in_target: existingIds.size,
        missing_count: missing.length,
        inserted,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
