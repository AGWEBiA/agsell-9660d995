import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase.rpc('reprocess_scheduled_step', { target_step_id: '00000000-0000-0000-0000-000000000000' });

if (error && error.message.includes("does not exist")) {
  console.log("RPC reprocess_scheduled_step does NOT exist on target server.");
} else if (error) {
  console.log("RPC exists but failed with error (expected):", error.message);
} else {
  console.log("RPC exists and executed successfully (unexpected for dummy UUID).");
}
