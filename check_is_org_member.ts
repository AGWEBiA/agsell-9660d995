import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase.rpc('is_org_member', { _org_id: '00000000-0000-0000-0000-000000000000', _user_id: '00000000-0000-0000-0000-000000000000' });

if (error && error.message.includes("does not exist")) {
  console.log("RPC is_org_member does NOT exist on target server.");
} else {
  console.log("RPC is_org_member exists (or gave different error).");
}
