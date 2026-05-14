
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL");
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: contacts } = await supabase.from("contacts").select("id, first_name, source").eq("email", "test-lovable2@example.com");
console.log("Target Contacts found:", contacts);

if (contacts && contacts.length > 0) {
  const { data: deals } = await supabase.from("deals").select("id, title, notes").eq("contact_id", contacts[0].id);
  console.log("Target Deals found:", deals);
}
