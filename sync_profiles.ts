import { createClient } from '@supabase/supabase-js'

const lovableUrl = process.env.SUPABASE_URL
const lovableKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function syncProfiles() {
  const lovable = createClient(lovableUrl, lovableKey)
  const target = createClient(targetUrl, targetKey)

  console.log('Fetching profiles from Lovable...')
  const { data: profiles, error: pError } = await lovable.from('profiles').select('*')
  if (pError) throw pError

  console.log(`Syncing ${profiles.length} profiles to target...`)
  
  for (const profile of profiles) {
    const { error: sError } = await target.from('profiles').upsert(profile)
    if (sError) {
      console.error(`Error syncing profile ${profile.id}:`, sError.message)
    } else {
      console.log(`Synced profile: ${profile.user_id}`)
    }
  }
}

syncProfiles().catch(console.error)
