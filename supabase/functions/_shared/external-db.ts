import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getSupabaseClient() {
  const targetUrl = Deno.env.get("TARGET_SUPABASE_URL");
  const targetKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  if (targetUrl && targetKey) {
    console.log("Using external database:", targetUrl);
    return createClient(targetUrl, targetKey);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}
