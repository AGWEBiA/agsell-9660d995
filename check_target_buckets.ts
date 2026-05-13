import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: buckets, error } = await supabase.storage.listBuckets();

if (error) {
  console.error("Error listing buckets:", error);
  Deno.exit(1);
}

console.log("Buckets on target server:", buckets.map(b => b.name));
