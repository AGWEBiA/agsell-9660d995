import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'agsell'
const SENDER_DOMAIN = 'notify.www.agwebi.com.br'
const FROM_DOMAIN = 'notify.www.agwebi.com.br'
const REDIRECT_TO = 'https://site.agsell.com.br/reset-password'
const MINUTES_BETWEEN_REQUESTS = 2

const normalizeEmail = (email: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

const genericSuccess = () =>
  new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let email = ''
  try {
    const body = await req.json()
    email = normalizeEmail(body.email)
  } catch {
    return genericSuccess()
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return genericSuccess()
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const since = new Date(Date.now() - MINUTES_BETWEEN_REQUESTS * 60 * 1000).toISOString()
  const { data: recentRequest, error: recentError } = await supabase
    .from('email_send_log')
    .select('id')
    .eq('template_name', 'recovery')
    .eq('recipient_email', email)
    .in('status', ['pending', 'sent', 'rate_limited'])
    .gte('created_at', since)
    .limit(1)
    .maybeSingle()

  if (recentError) {
    console.warn('Failed to check recent recovery requests', { error: recentError.message })
  }

  if (recentRequest) {
    return genericSuccess()
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: REDIRECT_TO },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.warn('Password recovery link not generated', {
      email,
      error: linkError?.message ?? 'missing action link',
    })
    return genericSuccess()
  }

  const confirmationUrl = linkData.properties.action_link
  const html = await renderAsync(
    React.createElement(RecoveryEmail, { siteName: SITE_NAME, confirmationUrl })
  )
  const text = await renderAsync(
    React.createElement(RecoveryEmail, { siteName: SITE_NAME, confirmationUrl }),
    { plainText: true }
  )

  const messageId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Get-or-create unsubscribe token for this recipient (required by Lovable Email API
  // for transactional emails — auth recovery is enqueued under purpose=transactional
  // because there is no Supabase auth webhook run_id available here).
  let unsubscribeToken: string | null = null
  {
    const { data: existing } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', email)
      .maybeSingle()

    if (existing?.token) {
      unsubscribeToken = existing.token as string
    } else {
      const newToken = crypto.randomUUID().replace(/-/g, '')
      const { data: inserted, error: tokenError } = await supabase
        .from('email_unsubscribe_tokens')
        .insert({ email, token: newToken })
        .select('token')
        .single()
      if (tokenError) {
        // Race: another request inserted first — re-read.
        const { data: reread } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token')
          .eq('email', email)
          .maybeSingle()
        unsubscribeToken = (reread?.token as string) ?? newToken
      } else {
        unsubscribeToken = inserted.token as string
      }
    }
  }

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'recovery',
    recipient_email: email,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Redefinir sua senha',
      html,
      text,
      purpose: 'transactional',
      label: 'recovery',
      idempotency_key: `password-recovery-${messageId}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: now,
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue password recovery email', {
      email,
      error: enqueueError.message,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'recovery',
      recipient_email: email,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    return new Response(JSON.stringify({ error: 'Unable to send recovery email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return genericSuccess()
})
