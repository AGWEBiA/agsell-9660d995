import { createClient } from '@supabase/supabase-js'

const lovableUrl = process.env.SUPABASE_URL
const lovableKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function syncUsers() {
  if (!lovableUrl || !lovableKey || !targetUrl || !targetKey) {
    console.error('Missing credentials')
    return
  }

  const lovable = createClient(lovableUrl, lovableKey)
  const target = createClient(targetUrl, targetKey)

  console.log('Fetching users from Lovable Cloud...')
  const { data: { users: lovableUsers }, error: lError } = await lovable.auth.admin.listUsers()
  if (lError) throw lError

  console.log('Fetching users from Target Server...')
  const { data: { users: targetUsers }, error: tError } = await target.auth.admin.listUsers()
  if (tError) throw tError

  console.log(`Lovable: ${lovableUsers.length} users`)
  console.log(`Target: ${targetUsers.length} users`)

  const targetEmails = new Set(targetUsers.map(u => u.email))

  for (const user of lovableUsers) {
    if (!targetEmails.has(user.email)) {
      console.log(`User ${user.email} missing on target. Note: Password cannot be synced via API.`)
      // We can't sync the password hash via admin API, only via SQL.
    }
  }
}

syncUsers().catch(console.error)
