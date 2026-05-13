import { createClient } from '@supabase/supabase-js'

const lovableUrl = process.env.SUPABASE_URL
const lovableKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function syncUserMetadata() {
  const lovable = createClient(lovableUrl, lovableKey)
  const target = createClient(targetUrl, targetKey)

  const { data: { users: lovableUsers } } = await lovable.auth.admin.listUsers()
  
  for (const user of lovableUsers) {
    console.log(`Syncing metadata for: ${user.email}`)
    const { error } = await target.auth.admin.updateUserById(user.id, {
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    })
    if (error) console.error(`Error syncing ${user.email}:`, error.message)
    else console.log(`Synced: ${user.email}`)
  }
}

syncUserMetadata().catch(console.error)
