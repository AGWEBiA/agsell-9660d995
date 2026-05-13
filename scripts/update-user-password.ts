
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const userId = "63eec066-bcc8-4c84-9bcf-d24bfc267b1b";
const newPassword = "URtzrXuvCFBy";

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: newPassword
});

if (error) {
  console.error("Error updating password:", error);
  process.exit(1);
}

console.log("Password updated successfully for user:", userId);
