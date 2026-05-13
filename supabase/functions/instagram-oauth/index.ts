import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_APP_ID_FALLBACK = "123456789012345";

function safeJsonParse(str: string) {
  try { return JSON.parse(str); } catch { return null; }
}

function sanitizeAccessToken(token: unknown): string | undefined {
  if (typeof token !== "string" || token.length < 10) return undefined;
  return token;
}

function normalizeTokenPayload(data: any) {
  return {
    access_token: data.access_token || data.accessToken,
    user_id: data.user_id || data.userId || data.id,
  };
}

function extractErrorMessage(data: any, fallback: string) {
  if (data?.error_message) return data.error_message;
  if (data?.error?.message) return data.error.message;
  if (data?.error) return String(data.error);
  return fallback;
}

async function exchangeCodeForFacebookUserToken(code: string, redirect_uri: string, appSecret: string) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${Deno.env.get("INSTAGRAM_APP_ID") || INSTAGRAM_APP_ID_FALLBACK}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`);
    return await res.json();
  } catch { return { error: "Facebook exchange failed" }; }
}

async function exchangeLongLivedToken(shortLivedToken: string, appSecret: string) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get("INSTAGRAM_APP_ID") || INSTAGRAM_APP_ID_FALLBACK}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    return await res.json();
  } catch { return { error: "Long-lived exchange failed" }; }
}

async function resolveInstagramProfile(finalToken: string, shortLivedToken?: string, igUserId?: string, fbUserToken?: string) {
  try {
    // Try fetching via Instagram Graph API
    const igRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalToken}`);
    const igData = await igRes.json();
    if (igRes.ok && igData.id) {
      return { profile: { instagram_user_id: igData.id, username: igData.username, full_name: igData.username } };
    }

    // Fallback: Fetch via Facebook Graph API (Business Login)
    const fbRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalToken || fbUserToken}`);
    const fbData = await fbRes.json();
    if (fbRes.ok && fbData.data?.length > 0) {
      const page = fbData.data[0];
      const igRes2 = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${finalToken || fbUserToken}`);
      const igData2 = await igRes2.json();
      if (igData2.instagram_business_account) {
        const igId = igData2.instagram_business_account.id;
        const profileRes = await fetch(`https://graph.facebook.com/v18.0/${igId}?fields=username,name,profile_picture_url&access_token=${finalToken || fbUserToken}`);
        const profileData = await profileRes.json();
        return {
          profile: {
            instagram_user_id: igId,
            username: profileData.username,
            full_name: profileData.name,
            profile_picture_url: profileData.profile_picture_url,
            page_id: page.id,
            page_access_token: page.access_token
          }
        };
      }
    }
    return { error: "Could not resolve profile" };
  } catch (e: any) { return { error: e.message }; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET");
    if (!INSTAGRAM_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: "Instagram App Secret não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "").trim();
    const isServiceRoleToken = token === supabaseServiceKey;
    const hasInternalCronHeader = req.headers.get("X-Internal-Cron") === "true" || req.headers.get("x-internal-cron") === "true";
    const isTrustedCronToken = hasInternalCronHeader && token === Deno.env.get("SUPABASE_ANON_KEY");
    const isInternalCron = isServiceRoleToken || isTrustedCronToken;

    let user = null;
    if (!isInternalCron) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authData.user) {
        console.error("Auth error:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Token inválido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = authData.user;
    } else {
      console.log("[INSTAGRAM-OAUTH] Running with internal/service-role bypass");
    }

    const userId = user?.id;
    let INSTAGRAM_APP_ID = INSTAGRAM_APP_ID_FALLBACK;
    try {
      const { data: metaSettings } = await supabaseAdmin
        .from("platform_settings")
        .select("value")
        .eq("key", "meta_app")
        .maybeSingle();
      if (metaSettings?.value && (metaSettings.value as any).app_id) {
        INSTAGRAM_APP_ID = (metaSettings.value as any).app_id;
        console.log("[INSTAGRAM-OAUTH] Using App ID from platform_settings:", INSTAGRAM_APP_ID);
      }
    } catch (e: any) {
      console.warn("[INSTAGRAM-OAUTH] Could not load meta_app settings, using fallback");
    }

    const body = await req.json();
    const { code, redirect_uri, organization_id } = body;
    console.log("[INSTAGRAM-OAUTH] Request received", { redirect_uri, organization_id, hasCode: !!code, userId });

    if (!code || !redirect_uri || !organization_id) {
      return new Response(
        JSON.stringify({ error: "code, redirect_uri e organization_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (organization_id && !isInternalCron && userId) {
      const { data: isMember } = await supabaseAdmin.rpc("is_org_member", {
        _org_id: organization_id,
        _user_id: userId,
      });
      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Você não é membro desta organização" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", INSTAGRAM_APP_ID);
    tokenForm.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", redirect_uri);
    tokenForm.append("code", code);

    console.log("[INSTAGRAM-OAUTH] Step 1: Exchanging code for short-lived token", { redirect_uri });

    let shortLivedToken = "";
    let igUserId: string | undefined;
    let step1ErrorMessage: string | null = null;

    try {
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: tokenForm,
      });
      const tokenRaw = await tokenRes.text();
      const tokenData = safeJsonParse(tokenRaw) || {};
      const normalizedTokenData = normalizeTokenPayload(tokenData);

      shortLivedToken = sanitizeAccessToken(normalizedTokenData.access_token) || "";
      igUserId = normalizedTokenData.user_id ? String(normalizedTokenData.user_id) : undefined;

      if (tokenRes.ok && shortLivedToken && !tokenData.error_type && !tokenData.error_message) {
        console.log("[INSTAGRAM-OAUTH] Step 1 OK: Got short-lived token", {
          igUserId,
          tokenPrefix: shortLivedToken.slice(0, 4),
          tokenLength: shortLivedToken.length,
        });
      } else {
        step1ErrorMessage = extractErrorMessage(
          tokenData,
          `Erro ao trocar código por token do Instagram (HTTP ${tokenRes.status})`,
        );
        console.warn("[INSTAGRAM-OAUTH] Step 1 unavailable, continuing with Facebook fallback", {
          status: tokenRes.status,
          error: step1ErrorMessage,
        });
      }
    } catch (step1Error) {
      step1ErrorMessage =
        step1Error instanceof Error
          ? step1Error.message
          : "Erro ao trocar código por token do Instagram";
      console.warn("[INSTAGRAM-OAUTH] Step 1 request failed, continuing with Facebook fallback", {
        error: step1ErrorMessage,
      });
    }

    console.log("[INSTAGRAM-OAUTH] Step 1B: Exchanging code for Facebook user token fallback");
    const facebookTokenData = await exchangeCodeForFacebookUserToken(code, redirect_uri, INSTAGRAM_APP_SECRET);
    const facebookUserToken = sanitizeAccessToken(facebookTokenData.access_token);
    if (facebookUserToken) {
      console.log("[INSTAGRAM-OAUTH] Step 1B OK: Got Facebook user token fallback", {
        tokenPrefix: facebookUserToken.slice(0, 4),
      });
    } else if (facebookTokenData.error) {
      console.warn("[INSTAGRAM-OAUTH] Facebook user token fallback unavailable", facebookTokenData.error);
    }

    if (!shortLivedToken && !facebookUserToken) {
      const normalizedError = (step1ErrorMessage || "").toLowerCase();
      const userSafeError = normalizedError.includes("error validating application") || normalizedError.includes("application info")
        ? "A Meta rejeitou a validação desta aplicação para este login. Verifique no app da Meta se ele está em modo Live, com permissões de produção aprovadas e contrato de Business Login aceito, depois tente novamente."
        : step1ErrorMessage || "Não foi possível obter um token válido retornado pela Meta.";

      return new Response(
        JSON.stringify({ error: userSafeError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[INSTAGRAM-OAUTH] Step 2: Exchanging for long-lived token");
    let finalToken = shortLivedToken;
    let expiresIn = 3600;

    if (shortLivedToken) {
      const longLivedData = await exchangeLongLivedToken(shortLivedToken, INSTAGRAM_APP_SECRET);
      finalToken = sanitizeAccessToken(longLivedData.access_token || shortLivedToken) || "";
      expiresIn = longLivedData.expires_in || 3600;

      if (!longLivedData.access_token && longLivedData.error) {
        console.error("[INSTAGRAM-OAUTH] Long-lived token exchange failed, using short-lived fallback", longLivedData.error);
      }
    }

    if (!finalToken && facebookUserToken) {
      finalToken = facebookUserToken;
      console.log("[INSTAGRAM-OAUTH] Using Facebook user token as primary token fallback", {
        tokenPrefix: facebookUserToken.slice(0, 4),
      });
    }

    if (!finalToken) {
      return new Response(
        JSON.stringify({ error: "Não foi possível validar token de acesso retornado pelo Instagram" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[INSTAGRAM-OAUTH] Step 3: Fetching profile");
    const resolvedProfile = await resolveInstagramProfile(finalToken, shortLivedToken, igUserId, facebookUserToken);

    if (!resolvedProfile.profile) {
      const normalizedError = (resolvedProfile.error || "").toLowerCase();
      const userSafeError = normalizedError.includes("cannot parse access token")
        ? "A Meta rejeitou o token retornado nesta conexão. Tente novamente e, se persistir, reconecte a conta no Instagram Business Login para gerar um novo token válido."
        : normalizedError.includes("error validating application") || normalizedError.includes("application info")
        ? "A Meta rejeitou a validação desta aplicação para este login. Verifique no app da Meta se ele está em modo Live, com permissões de produção aprovadas e contrato de Business Login aceito, depois tente novamente."
        : normalizedError.includes("unsupported request - method type")
        ? "Não foi possível concluir a conexão com os dados retornados pela Meta para essa conta. Confirme se a conta é Business/Creator e se está vinculada a uma Página do Facebook, então tente novamente."
        : (resolvedProfile.error || "Erro ao buscar perfil do Instagram");

      return new Response(
        JSON.stringify({ error: userSafeError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instagramAccount = {
      instagram_user_id: String(resolvedProfile.profile.instagram_user_id || igUserId),
      username: resolvedProfile.profile.username,
      full_name: resolvedProfile.profile.full_name || null,
      profile_picture_url: resolvedProfile.profile.profile_picture_url || null,
      page_id: resolvedProfile.profile.page_id,
      page_access_token: resolvedProfile.profile.page_access_token,
    };

    const { data: existing } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("instagram_user_id", instagramAccount.instagram_user_id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("instagram_accounts")
        .update({
          access_token: finalToken,
          page_access_token: instagramAccount.page_access_token,
          page_id: instagramAccount.page_id,
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
        JSON.stringify({ success: true, updated: true, account: instagramAccount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("instagram_accounts")
      .insert({
        organization_id,
        access_token: finalToken,
        page_access_token: instagramAccount.page_access_token,
        page_id: instagramAccount.page_id,
        instagram_user_id: instagramAccount.instagram_user_id,
        username: instagramAccount.username,
        full_name: instagramAccount.full_name,
        profile_picture_url: instagramAccount.profile_picture_url,
        connected_by: userId || (isInternalCron ? '00000000-0000-0000-0000-000000000000' : null),
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
      JSON.stringify({ success: true, updated: false, account: instagramAccount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Instagram OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar autenticação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
