import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = "30d9da56-7363-4890-9ee1-fa74d7465b79";
const newPassword = "agsell" + Math.random().toString(36).slice(-4);

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: newPassword
});

if (error) {
  console.error("Error:", error.message);
  Deno.exit(1);
} else {
  console.log("Success! New password for vemviverdeviajar@gmail.com is:", newPassword);
}
