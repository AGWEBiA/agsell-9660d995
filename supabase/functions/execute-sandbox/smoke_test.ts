import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.test("execute-sandbox health check", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/execute-sandbox?health=true`, {
    method: "GET",
    headers: {
      "apikey": SERVICE_ROLE
    }
  });
  const data = await res.json();
  assertEquals(res.status, 200);
  assertEquals(data.status, "ok");
});

Deno.test("execute-sandbox validation check", async () => {
  const client = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await client.functions.invoke("execute-sandbox", {
    body: {}, // Empty body to trigger validation error
  });
  
  if (data) {
    assertEquals(data.success, undefined);
    assertEquals(typeof data.error, "string");
  } else {
    assertEquals(error !== null, true);
  }
});
