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
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Request ${req.method} to upload-media`);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.warn(`[${requestId}] No Authorization header`);
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return jsonResponse({ error: "Token inválido" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { bucket, path, contentType, base64 } = body;

    console.log(`[${requestId}] Processing upload to ${bucket}/${path} (type: ${contentType}, user: ${user.id})`);

    if (!allowedBuckets.has(bucket) || typeof path !== "string" || typeof base64 !== "string") {
      console.warn(`[${requestId}] Invalid upload data: bucket=${bucket}, path=${typeof path}, base64=${typeof base64}`);
      return jsonResponse({ error: "Dados de upload inválidos" }, 400);
    }

    const normalizedPath = path.replace(/^\/+/, "");
    const folders = normalizedPath.split("/").filter(Boolean);
    if (folders.length < 2 || normalizedPath.includes("..")) {
      console.warn(`[${requestId}] Invalid path structure: ${normalizedPath}`);
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

    if (!allowed) {
      console.warn(`[${requestId}] Permission denied for user ${user.id} on scope ${rootScope}`);
      return jsonResponse({ error: "Você não tem permissão para enviar neste destino" }, 403);
    }

    const fileBytes = decodeBase64(base64);
    const maxBytes = bucket === "voip-audio" ? 20 * 1024 * 1024 : 25 * 1024 * 1024;
    
    console.log(`[${requestId}] File size: ${fileBytes.byteLength} bytes`);

    if (fileBytes.byteLength > maxBytes) {
      console.warn(`[${requestId}] File too large: ${fileBytes.byteLength} > ${maxBytes}`);
      return jsonResponse({ error: "Arquivo muito grande" }, 413);
    }

    const { error: uploadError } = await supabase.storage.from(bucket).upload(normalizedPath, fileBytes, {
      cacheControl: "3600",
      upsert: true, // Use upsert to avoid error if file exists (often happens in retries)
      contentType: typeof contentType === "string" ? contentType : undefined,
    });

    if (uploadError) {
      console.error(`[${requestId}] Storage upload error:`, uploadError);
      return jsonResponse({ error: uploadError.message }, 400);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
    console.log(`[${requestId}] Upload successful: ${data.publicUrl}`);
    
    return jsonResponse({ publicUrl: data.publicUrl, path: normalizedPath });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});