import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  const automationId = "f40c0eab-bf9f-46bd-93e7-97b2819600c0";
  const contactId = "8114d378-4d96-4e67-a37e-76d915c532ae";
  
  console.log(`Triggering automation ${automationId} for contact ${contactId}...`);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'X-Internal-Cron': 'true'
    },
    body: JSON.stringify({
      automation_id: automationId,
      contact_id: contactId,
      trigger_event: "test_manual"
    })
  });
  
  const result = await response.json();
  console.log('Response Status:', response.status);
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Check logs
  const { data: timeline } = await supabase
    .from('automation_contact_timeline')
    .select('*')
    .eq('automation_id', automationId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Timeline entries:', timeline?.length || 0);
  if (timeline && timeline.length > 0) {
    console.log('Latest log:', timeline[0].status, timeline[0].details);
  }
}

runTest();
