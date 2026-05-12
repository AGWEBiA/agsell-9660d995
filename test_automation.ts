const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runTest() {
  const automationId = "2c2a543e-d9d0-4f44-b5cc-0703c5ffc278";
  const contactId = "74afe561-2bc1-46b5-a6d0-f7dd47917e03";
  
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
}

runTest();
