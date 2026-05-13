import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  "automations",
  "automation_executions",
  "automation_scheduled_steps",
  "contacts",
  "organization_integrations",
  "whatsapp_groups",
  "messages",
  "webhook_events"
];

console.log("Checking tables on target server...");

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  
  if (error) {
    console.error(`Error checking table ${table}:`, error.message);
  } else {
    console.log(`Table ${table}: ${count} rows`);
  }
}
