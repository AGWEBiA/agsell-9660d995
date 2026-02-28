import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FACEBOOK_APP_ID = "912565888176650";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    if (!FACEBOOK_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: "Facebook App Secret não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const { code, redirect_uri, organization_id } = await req.json();

    if (!code || !redirect_uri || !organization_id) {
      return new Response(
        JSON.stringify({ error: "code, redirect_uri e organization_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is member of org
    const { data: isMember } = await supabaseAuth.rpc("is_org_member", {
      _org_id: organization_id,
      _user_id: userId,
    });
    if (!isMember) {
      return new Response(
        JSON.stringify({ error: "Você não é membro desta organização" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${encodeURIComponent(code)}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Facebook token exchange error:", tokenData.error);
      return new Response(
        JSON.stringify({ error: tokenData.error.message || "Erro ao trocar código por token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("Long-lived token error:", longLivedData.error);
      return new Response(
        JSON.stringify({ error: "Erro ao obter token de longa duração" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // ~60 days

    // Step 3: Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(longLivedToken)}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data?.length) {
      return new Response(
        JSON.stringify({ error: "Nenhuma página do Facebook encontrada. Verifique se você tem uma página vinculada à sua conta." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Get Instagram Business Account from first page with IG
    let instagramAccount = null;
    let pageAccessToken = null;
    let pageId = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        // Get IG profile info
        const profileRes = await fetch(
          `https://graph.facebook.com/v21.0/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(page.access_token)}`
        );
        const profileData = await profileRes.json();

        instagramAccount = {
          instagram_user_id: profileData.id,
          username: profileData.username,
          full_name: profileData.name || null,
          profile_picture_url: profileData.profile_picture_url || null,
        };
        pageAccessToken = page.access_token;
        pageId = page.id;
        break;
      }
    }

    if (!instagramAccount) {
      return new Response(
        JSON.stringify({ error: "Nenhuma conta Instagram Business encontrada vinculada às suas páginas do Facebook." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Save to DB using service role (to bypass RLS for token storage)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if account already exists
    const { data: existing } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("instagram_user_id", instagramAccount.instagram_user_id)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabaseAdmin
        .from("instagram_accounts")
        .update({
          access_token: longLivedToken,
          page_access_token: pageAccessToken,
          page_id: pageId,
          username: instagramAccount.username,
          full_name: instagramAccount.full_name,
          profile_picture_url: instagramAccount.profile_picture_url,
          is_active: true,
          token_expires_at: expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({
          success: true,
          updated: true,
          account: instagramAccount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new
    const { error: insertError } = await supabaseAdmin
      .from("instagram_accounts")
      .insert({
        organization_id,
        access_token: longLivedToken,
        page_access_token: pageAccessToken,
        page_id: pageId,
        instagram_user_id: instagramAccount.instagram_user_id,
        username: instagramAccount.username,
        full_name: instagramAccount.full_name,
        profile_picture_url: instagramAccount.profile_picture_url,
        connected_by: userId,
        token_expires_at: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar conta: " + insertError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: false,
        account: instagramAccount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar autenticação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
