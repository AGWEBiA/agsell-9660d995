import { createClient } from '@supabase/supabase-js'

const lovableUrl = process.env.SUPABASE_URL
const lovableKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetUrl = process.env.TARGET_SUPABASE_URL
const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

async function compareUsers() {
  const lovable = createClient(lovableUrl, lovableKey)
  const target = createClient(targetUrl, targetKey)

  const { data: { users: lovableUsers } } = await lovable.auth.admin.listUsers()
  const { data: { users: targetUsers } } = await target.auth.admin.listUsers()

  const lMap = new Map(lovableUsers.map(u => [u.email, u]))
  const tMap = new Map(targetUsers.map(u => [u.email, u]))

  console.log('--- Email Comparison ---')
  for (const [email, u] of lMap) {
    const tU = tMap.get(email)
    if (!tU) {
      console.log(`[MISSING ON TARGET] ${email}`)
    } else if (u.id !== tU.id) {
      console.log(`[ID MISMATCH] ${email}: Lovable=${u.id}, Target=${tU.id}`)
    } else {
      console.log(`[MATCH] ${email}`)
    }
  }

  for (const [email, u] of tMap) {
    if (!lMap.has(email)) {
      console.log(`[MISSING ON LOVABLE] ${email}`)
    }
  }
}

compareUsers().catch(console.error)
