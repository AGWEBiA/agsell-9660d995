const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runTest() {
  const automationId = "f40c0eab-bf9f-46bd-93e7-97b2819600c0";
  const contactId = "8114d378-4d96-4e67-a37e-76d915c532ae";
  
  console.log(`Triggering automation ${automationId} for contact ${contactId}...`);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'X-Internal-Cron': 'true',
      'x-internal-cron': 'true'
    },
    body: JSON.stringify({
      automation_id: automationId,
      contact_id: contactId,
      trigger_event: "test_manual"
    })
  });
  
  // Try reading raw text if JSON fails
  const text = await response.text();
  console.log('Response Status:', response.status);
  try {
    const result = JSON.parse(text);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('Result (raw text):', text);
  }
}

runTest();
