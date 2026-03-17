import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.pathname.split("/").pop();

    if (!slug) {
      return new Response("Slug não informado", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign
    const { data: campaign, error: campErr } = await supabase
      .from("group_rotator_campaigns")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada ou inativa" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get available entries (not paused, not over capacity/clicks)
    const { data: entries, error: entErr } = await supabase
      .from("group_rotator_entries")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("is_paused", false)
      .order("sort_order", { ascending: true });

    if (entErr || !entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum grupo disponível" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter entries that still have capacity
    const available = entries.filter((e) => {
      if (e.max_capacity > 0 && e.member_count >= e.max_capacity) return false;
      if (e.max_clicks > 0 && e.click_count >= e.max_clicks) return false;
      return true;
    });

    if (available.length === 0) {
      return new Response(JSON.stringify({ error: "Todos os grupos estão lotados" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Round-robin: pick entry at current_index % available.length
    const idx = campaign.current_index % available.length;
    const chosen = available[idx];

    // Update campaign index and total clicks
    await supabase
      .from("group_rotator_campaigns")
      .update({
        current_index: campaign.current_index + 1,
        total_clicks: campaign.total_clicks + 1,
      })
      .eq("id", campaign.id);

    // Update entry click count
    await supabase
      .from("group_rotator_entries")
      .update({ click_count: chosen.click_count + 1 })
      .eq("id", chosen.id);

    // Log click
    const userAgent = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for") || "unknown";
    // Hash IP for privacy
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(forwarded + slug));
    const ipHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

    await supabase.from("group_rotator_clicks").insert({
      campaign_id: campaign.id,
      entry_id: chosen.id,
      ip_hash: ipHash,
      user_agent: userAgent.slice(0, 255),
    });

    // Return redirect info
    return new Response(JSON.stringify({
      redirect_url: chosen.invite_link,
      group_name: chosen.name,
      campaign_name: campaign.name,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
