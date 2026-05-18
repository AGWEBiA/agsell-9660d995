import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .schema('supabase_migrations');

  if (error) {
    console.error("Error fetching migrations:", error.message);
  } else {
    console.log("Migrations on target:", data.map(m => m.version).join(', '));
  }
}

checkMigrations();
