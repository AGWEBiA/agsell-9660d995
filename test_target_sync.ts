
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL");
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.log("Target secrets not set");
  Deno.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: orgs, error: orgError } = await supabase.from("organizations").select("id, name").limit(1);
if (orgError) {
  console.error("Error fetching target orgs:", orgError);
} else {
  console.log("Target Orgs:", orgs);
}

const { data: stages, error: stageError } = await supabase.from("pipeline_stages").select("id, name").limit(10);
if (stageError) {
  console.error("Error fetching target stages:", stageError);
} else {
  console.log("Target Stages:", stages);
}
