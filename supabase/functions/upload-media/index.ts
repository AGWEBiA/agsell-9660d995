import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedBuckets = new Set(["inbox-attachments", "voip-audio"]);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return jsonResponse({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Token inválido" }, 401);

    const { bucket, path, contentType, base64 } = await req.json();
    if (!allowedBuckets.has(bucket) || typeof path !== "string" || typeof base64 !== "string") {
      return jsonResponse({ error: "Dados de upload inválidos" }, 400);
    }

    const normalizedPath = path.replace(/^\/+/, "");
    const folders = normalizedPath.split("/").filter(Boolean);
    if (folders.length < 2 || normalizedPath.includes("..")) {
      return jsonResponse({ error: "Caminho de upload inválido" }, 400);
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    const rootScope = folders[0];
    let allowed = isAdmin || rootScope === user.id;

    if (!allowed) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", rootScope)
        .maybeSingle();
      allowed = !!membership;
    }

    if (!allowed) return jsonResponse({ error: "Você não tem permissão para enviar neste destino" }, 403);

    const fileBytes = decodeBase64(base64);
    const maxBytes = bucket === "voip-audio" ? 20 * 1024 * 1024 : 25 * 1024 * 1024;
    if (fileBytes.byteLength > maxBytes) return jsonResponse({ error: "Arquivo muito grande" }, 413);

    const { error: uploadError } = await supabase.storage.from(bucket).upload(normalizedPath, fileBytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: typeof contentType === "string" ? contentType : undefined,
    });
    if (uploadError) return jsonResponse({ error: uploadError.message }, 400);

    const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
    return jsonResponse({ publicUrl: data.publicUrl, path: normalizedPath });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});