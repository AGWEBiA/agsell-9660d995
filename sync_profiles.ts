import { createClient } from '@supabase/supabase-js'

const lovableUrl = process.env.SUPABASE_URL
const lovableKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function syncProfiles() {
  const lovable = createClient(lovableUrl, lovableKey)
  const target = createClient(targetUrl, targetKey)

  const { data: profiles } = await lovable.from('profiles').select('*')
  
  for (const profile of profiles) {
    // We use user_id as the unique identifier for syncing profiles
    const { error } = await target.from('profiles').upsert(profile, { onConflict: 'user_id' })
    if (error) console.error(`Error syncing ${profile.user_id}:`, error.message)
    else console.log(`Synced: ${profile.user_id}`)
  }
}

syncProfiles().catch(console.error)
