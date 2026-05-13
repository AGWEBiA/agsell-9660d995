import { createClient } from '@supabase/supabase-js'

const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function testConnection() {
  const target = createClient(targetUrl, targetKey)
  const { data, error } = await target.from('profiles').select('id').limit(1)
  if (error) {
    console.error('Connection failed:', error)
  } else {
    console.log('Connection successful, found profiles:', data.length)
  }
}

testConnection().catch(console.error)
