import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logToSystem } from "../_shared/logger.ts";
import { handleCors, handleHealthCheck, corsHeaders } from "../_shared/helpers.ts";

interface AutomationAction {
  type: string;
  subtype?: string;
  config: Record<string, unknown>;
}

interface ExecutionPayload {
  automation_id: string;
  contact_id?: string;
  trigger_event: string;
  // For scheduled step resumption
  resume_from_step?: number;
  execution_id?: string;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const healthRes = await handleHealthCheck(req, 'process-automation');
  if (healthRes) return healthRes;

  try {
    const bodyText = await req.text();
    let parsedBody: Partial<ExecutionPayload> & { action?: string; source?: string } = {};
    if (bodyText) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = {};
      }
    }


    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[process-automation] Missing environment variables");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '').trim();
    const isInternalCron = (req.headers.get('X-Internal-Cron') === 'true' || req.headers.get('x-internal-cron') === 'true') && 
                          (token === supabaseServiceKey || token === Deno.env.get('SUPABASE_ANON_KEY'));

    if (!isInternalCron) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        console.error("[process-automation] Auth validation failed:", authError?.message);
        return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    let payload: ExecutionPayload;
    try {
      payload = parsedBody as ExecutionPayload;
    } catch (e: any) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { automation_id, contact_id, trigger_event, resume_from_step, execution_id: resumeExecId } = payload;

    if (!automation_id || !trigger_event) {
      return new Response(JSON.stringify({ error: 'automation_id and trigger_event are required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automation_id)
      .eq('is_active', true)
      .single();

    if (automationError || !automation) {
      console.warn(`[process-automation] Automation ${automation_id} not found or inactive`);
      return new Response(JSON.stringify({ error: 'Automation not found or inactive' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const actions = (automation.actions || []) as AutomationAction[];
    const startStep = resume_from_step || 0;

    // Create or resume execution record + load trigger context (e.g. group_id for group_tag_added)
    let executionId = resumeExecId;
    let triggerContext: Record<string, unknown> = {};
    if (!executionId) {
      const { data: execution, error: execError } = await supabase
        .from('automation_executions')
        .insert({
          automation_id,
          contact_id,
          trigger_event,
          status: 'running',
          total_steps: actions.length,
          current_step: startStep,
        })
        .select()
        .single();
      if (execError) throw execError;
      executionId = execution.id;
    } else {
      const { data: execRow } = await supabase
        .from('automation_executions')
        .update({ status: 'running' })
        .eq('id', executionId)
        .select('trigger_data')
        .maybeSingle();
      if (execRow?.trigger_data && typeof execRow.trigger_data === 'object') {
        triggerContext = execRow.trigger_data as Record<string, unknown>;
      }
    }

    const results: Array<{ step: number; action: string; status: string; result?: unknown; error?: string }> = [];
    let currentStep = startStep;

    // Helper: get contact data
    const getContact = async () => {
      if (!contact_id) return null;
      const { data } = await supabase.from('contacts').select('*').eq('id', contact_id).single();
      return data;
    };

    // Helper: log timeline entry
    const logTimeline = async (actionType: string, nodeLabel: string, status: string, details: Record<string, unknown> = {}) => {
      try {
        await supabase.from('automation_contact_timeline').insert({
          automation_id,
          execution_id: executionId,
          contact_id,
          node_id: `step_${currentStep}`,
          node_label: nodeLabel,
          action_type: actionType,
          status,
          details,
          organization_id: automation.organization_id,
        });

        // Use the shared logger for robustness and better visibility
        await logToSystem(supabase, {
          organization_id: automation.organization_id,
          user_id: automation.user_id,
          source: "process-automation",
          event: "automation_step",
          level: status === 'error' ? 'error' : 'info',
          message: `Step ${currentStep} (${nodeLabel}): ${status}`,
          payload: { 
            automation_id, 
            contact_id, 
            execution_id: executionId,
            action_type: actionType, 
            ...details 
          },
          metadata: {
            step: currentStep,
            status
          }
        });
      } catch (logErr) {
        console.error("Failed to log automation timeline/system_logs:", logErr);
      }
    };

    // Helper: send WhatsApp via send-whatsapp edge function (supports text/buttons/list/presence)
    const sendWhatsAppDirect = async (phone: string, actionConfig: Record<string, unknown>) => {
      const messageKind = (actionConfig.message_kind as string) || 'text';
      const message = (actionConfig.message as string) || '';
      const payload: Record<string, unknown> = {
        organization_id: automation.organization_id,
        to: phone,
        message,
        message_kind: messageKind,
      };
      // Pass through interactive / rich-media fields when relevant
      if (messageKind === 'buttons') {
        payload.buttons = actionConfig.buttons || [];
        payload.buttons_footer = actionConfig.buttons_footer;
      } else if (messageKind === 'list') {
        payload.list_sections = actionConfig.list_sections || [];
        payload.list_button_text = actionConfig.list_button_text;
        payload.list_title = actionConfig.list_title;
        payload.list_footer = actionConfig.list_footer;
      } else if (messageKind === 'presence') {
        payload.presence_state = actionConfig.presence_state || 'composing';
        payload.presence_delay_ms = actionConfig.presence_delay_ms || 2000;
      } else if (messageKind === 'audio_ptt') {
        payload.audio_url = actionConfig.audio_url || actionConfig.media_url;
      } else if (messageKind === 'location') {
        payload.latitude = actionConfig.latitude;
        payload.longitude = actionConfig.longitude;
        payload.location_name = actionConfig.location_name;
        payload.location_address = actionConfig.location_address;
      } else if (messageKind === 'contact') {
        payload.contact_full_name = actionConfig.contact_full_name;
        payload.contact_phone = actionConfig.contact_phone;
        payload.contact_organization = actionConfig.contact_organization;
        payload.contact_email = actionConfig.contact_email;
      } else if (messageKind === 'poll') {
        payload.poll_name = actionConfig.poll_name || actionConfig.message;
        payload.poll_values = actionConfig.poll_values || [];
        payload.poll_selectable_count = actionConfig.poll_selectable_count ?? 1;
      } else if (messageKind === 'reaction') {
        payload.reaction_emoji = actionConfig.reaction_emoji ?? '';
        payload.reaction_external_id = actionConfig.reaction_external_id;
        payload.reaction_from_me = actionConfig.reaction_from_me;
      } else if (messageKind === 'sticker') {
        payload.sticker_url = actionConfig.sticker_url || actionConfig.media_url;
      }
      // Group mentions (only effective when "to" is a group JID)
      if (actionConfig.mentions || actionConfig.mentions_everyone) {
        payload.mentions = actionConfig.mentions || [];
        payload.mentions_everyone = !!actionConfig.mentions_everyone;
      }
      if (actionConfig.media_url) {
        payload.media_url = actionConfig.media_url;
        payload.media_type = actionConfig.media_type || 'image';
        if (actionConfig.media_filename) payload.media_filename = actionConfig.media_filename;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      return { success: resp.ok, provider: 'send-whatsapp', data };
    };

    // Helper: replace template variables
    const replaceVars = (text: string, contact: Record<string, unknown> | null): string => {
      if (!text || !contact) return text || '';
      return text
        .replace(/\{\{nome\}\}/g, `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
        .replace(/\{\{primeiro_nome\}\}/g, String(contact.first_name || ''))
        .replace(/\{\{email\}\}/g, String(contact.email || ''))
        .replace(/\{\{telefone\}\}/g, String(contact.phone || ''))
        .replace(/\{\{whatsapp\}\}/g, String(contact.whatsapp || ''));
    };

    // Execute each action starting from startStep
    for (let i = startStep; i < actions.length; i++) {
      const action = actions[i];
      currentStep = i + 1;

      try {
        let actionResult: unknown;
        const actionType = action.subtype || action.type;

        switch (actionType) {
          // ── MESSAGING ──
          case 'send_email':
          case 'send_email_marketing':
          case 'send_email_performance': {
            const contact = await getContact();
            const to = (action.config.to as string) || contact?.email;
            if (to) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to,
                  subject: replaceVars(action.config.subject as string, contact),
                  html: replaceVars((action.config.content || action.config.body || action.config.html_content) as string, contact),
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No email address' };
            }
            await logTimeline(actionType, 'E-mail', 'success', { to });
            break;
          }

          case 'send_whatsapp':
          case 'send_whatsapp_oficial': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.whatsapp || contact?.phone;
            if (phone) {
              const cfg = { ...action.config, message: replaceVars(action.config.message as string, contact) };
              actionResult = await sendWhatsAppDirect(phone, cfg);
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'WhatsApp', 'success');
            break;
          }

          case 'send_whatsapp_group': {
            // Send message to a WhatsApp group session.
            // Falls back to the group_id captured by the trigger (e.g. group_tag_added → context group)
            // Delegates to send-whatsapp so all media/interactive kinds are supported.
            const contact = await getContact();
            const groupId = (action.config.group_id as string) || (triggerContext.group_id as string | undefined) || '';
            const message = replaceVars((action.config.message as string) || '', contact);
            if (groupId) {
              const { data: group } = await supabase
                .from('whatsapp_groups')
                .select('external_group_id, settings')
                .eq('id', groupId)
                .single();
              if (group?.external_group_id) {
                const instanceName =
                  (action.config.instance_name as string) ||
                  ((group.settings as Record<string, string>)?.instance_name) ||
                  '';
                const cfg = action.config as Record<string, unknown>;
                const payload: Record<string, unknown> = {
                  organization_id: automation.organization_id,
                  to: group.external_group_id,
                  message,
                  message_kind: (cfg.message_kind as string) || 'text',
                  instance_name: instanceName,
                  // forward media + interactive fields when present
                  media_url: cfg.media_url,
                  media_type: cfg.media_type,
                  media_filename: cfg.media_filename,
                  caption: cfg.caption,
                  buttons: cfg.buttons,
                  buttons_footer: cfg.buttons_footer,
                  list_button_text: cfg.list_button_text,
                  list_sections: cfg.list_sections,
                  list_footer: cfg.list_footer,
                  latitude: cfg.latitude,
                  longitude: cfg.longitude,
                  location_name: cfg.location_name,
                  location_address: cfg.location_address,
                  contact_name: cfg.contact_name,
                  contact_phone: cfg.contact_phone,
                  poll_name: cfg.poll_name,
                  poll_options: cfg.poll_options,
                  poll_selectable_count: cfg.poll_selectable_count,
                  reaction_emoji: cfg.reaction_emoji,
                  reaction_message_id: cfg.reaction_message_id,
                  sticker_url: cfg.sticker_url,
                  presence_duration_ms: cfg.presence_duration_ms,
                };
                const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                  body: JSON.stringify(payload),
                });
                actionResult = await resp.json().catch(() => ({ success: resp.ok }));
              } else {
                actionResult = { success: false, reason: 'Group has no external_group_id' };
              }
            } else {
              actionResult = { success: false, reason: 'Missing group_id' };
            }
            await logTimeline(actionType, 'WhatsApp Grupo', actionResult?.success ? 'success' : 'failed', actionResult);
            break;
          }
          case 'send_whatsapp_campaign': {

            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.whatsapp || contact?.phone;
            const message = replaceVars(action.config.message as string, contact);
            if (phone && message) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to: phone,
                  message,
                  message_kind: 'text'
                }),
              });
              actionResult = await resp.json();
            }
            await logTimeline(actionType, 'Campanha WA', 'success');
            break;
          }


          case 'send_sms': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.phone || contact?.whatsapp;
            if (phone) {
              const message = replaceVars(action.config.message as string, contact);
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to: phone,
                  message,
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'SMS', 'success');
            break;
          }

          case 'voice_torpedo':
          case 'send_voip_call': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.phone || contact?.whatsapp;
            if (phone) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/voip-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  phone_number: phone,
                  audio_url: action.config.audio_url,
                  on_answer: action.config.on_answer || 'play_audio',
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'VoIP', 'success');
            break;
          }

          // ── INSTAGRAM ──
          case 'send_instagram_dm': {
            const contact = await getContact();
            const igUserId = (action.config.instagram_user_id as string) || (contact as any)?.instagram_user_id;
            if (igUserId) {
              const message = replaceVars(action.config.message as string, contact);
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-instagram-dm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  recipient_id: igUserId,
                  message,
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No Instagram user ID' };
            }
            await logTimeline(actionType, 'Instagram DM', 'success');
            break;
          }

          case 'send_instagram_comment_reply':
          case 'send_instagram_story_reply':
          case 'instagram_like_comment':
          case 'instagram_follow_back': {
            // These require specific Instagram Graph API calls
            actionResult = { executed: true, action: actionType, note: 'Processed via Instagram webhook handler' };
            await logTimeline(actionType, 'Instagram', 'success');
            break;
          }

          // ── TAGS & SCORING ──
          case 'add_tag': {
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .insert({ contact_id, tag_id: action.config.tag_id as string });
              actionResult = { success: !error };
            }
            await logTimeline('add_tag', 'Add Tag', 'success');
            break;
          }

          case 'remove_tag': {
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .delete()
                .eq('contact_id', contact_id)
                .eq('tag_id', action.config.tag_id as string);
              actionResult = { success: !error };
            }
            await logTimeline('remove_tag', 'Remove Tag', 'success');
            break;
          }

          case 'update_score': {
            if (contact_id && action.config.points) {
              const points = Number(action.config.points) || 0;
              const { data: contact } = await supabase
                .from('contacts').select('lead_score').eq('id', contact_id).single();
              const newScore = Math.max(0, Math.min(100, (contact?.lead_score || 0) + points));
              const { error } = await supabase
                .from('contacts').update({ lead_score: newScore }).eq('id', contact_id);
              actionResult = { success: !error, new_score: newScore };
            }
            await logTimeline('update_score', 'Score', 'success', { points: action.config.points });
            break;
          }

          case 'update_status': {
            if (contact_id && action.config.status) {
              const { error } = await supabase
                .from('contacts').update({ status: action.config.status as string }).eq('id', contact_id);
              actionResult = { success: !error };
            }
            break;
          }

          // ── TASKS & NOTIFICATIONS ──
          case 'create_task': {
            const { error } = await supabase.from('tasks').insert({
              title: action.config.title as string,
              description: action.config.description as string,
              contact_id,
              user_id: automation.user_id,
              due_date: action.config.due_days
                ? new Date(Date.now() + Number(action.config.due_days) * 86400000).toISOString()
                : null,
            });
            actionResult = { success: !error };
            await logTimeline('create_task', 'Tarefa', 'success');
            break;
          }

          // ── DEALS / CRM ──
          case 'create_deal': {
            // Resolve target stage: prefer explicit stage_id, fallback to first stage by position
            let stageId = (action.config.stage_id as string) || null;
            if (!stageId) {
              const { data: firstStage } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('user_id', automation.user_id)
                .order('position', { ascending: true })
                .limit(1)
                .maybeSingle();
              stageId = firstStage?.id || null;
            }

            if (!stageId) {
              actionResult = { success: false, error: 'Nenhum estágio do pipeline encontrado' };
              await logTimeline('create_deal', 'Criar Deal', 'failed', { error: 'No pipeline stage' });
              break;
            }

            const contact = await getContact();
            const titleTemplate = (action.config.title as string) || 'Lead via {{source}}';
            const dealTitle = titleTemplate
              .replace(/\{\{first_name\}\}/g, contact?.first_name || '')
              .replace(/\{\{source\}\}/g, contact?.source || 'SAC')
              || `Lead - ${contact?.first_name || 'Sem nome'}`;

            const expectedDays = Number(action.config.expected_close_days || 0);
            const expectedDate = expectedDays > 0
              ? new Date(Date.now() + expectedDays * 86400000).toISOString().split('T')[0]
              : null;

            const { data: newDeal, error } = await supabase.from('deals').insert({
              title: dealTitle,
              value: Number(action.config.value || 0),
              stage_id: stageId,
              contact_id,
              user_id: automation.user_id,
              organization_id: automation.organization_id,
              status: 'open',
              expected_close_date: expectedDate,
              probability: Number(action.config.probability || 50),
            }).select('id').single();

            actionResult = { success: !error, deal_id: newDeal?.id, error: error?.message };
            await logTimeline('create_deal', 'Criar Deal no Pipeline', error ? 'failed' : 'success', { deal_id: newDeal?.id, title: dealTitle });
            break;
          }

          case 'send_notification': {
            const { error } = await supabase.from('notifications').insert({
              user_id: automation.user_id,
              type: 'automation',
              title: (action.config.title as string) || 'Automação executada',
              message: action.config.message as string,
              link: action.config.link as string,
            });
            actionResult = { success: !error };
            break;
          }

          // ── DELAYS (REAL) ──
          case 'wait':
          case 'timer': {
            const config = action.config as Record<string, any>;
            let delayMs = 0;

            if (config.timer_mode === 'specific_date' && config.specific_date) {
              const targetDate = new Date(config.specific_date as string);
              delayMs = Math.max(0, targetDate.getTime() - Date.now());
            } else {
              const duration = Number(config.duration || config.minutes || 1);
              const unit = (config.unit as string) || 'minutes';
              const multiplier = unit === 'hours' ? 3600000 : unit === 'days' ? 86400000 : 60000;
              delayMs = duration * multiplier;
            }

            // ── Honor configured time-window / weekdays / deadline ──
            // Uses São Paulo timezone (UTC-3, no DST since 2019).
            const SP_OFFSET_MIN = -180;
            const adjustToWindow = (baseMs: number): number => {
              let candidate = new Date(baseMs);
              const intervalStart = (config.has_time_interval && config.interval_start) ? String(config.interval_start) : null;
              const intervalEnd = (config.has_time_interval && config.interval_end) ? String(config.interval_end) : null;
              const allowedDays: string[] | null = (config.has_weekday_filter && Array.isArray(config.selected_days) && config.selected_days.length > 0)
                ? config.selected_days as string[]
                : null;
              const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

              const toSP = (d: Date) => new Date(d.getTime() + (SP_OFFSET_MIN - d.getTimezoneOffset()) * 60000);
              const fromSP = (d: Date) => new Date(d.getTime() - (SP_OFFSET_MIN - d.getTimezoneOffset()) * 60000);

              for (let safety = 0; safety < 8; safety++) {
                const sp = toSP(candidate);
                const dayKey = dayKeys[sp.getUTCDay()];
                const minutes = sp.getUTCHours() * 60 + sp.getUTCMinutes();

                let needsBump = false;

                if (allowedDays && !allowedDays.includes(dayKey)) {
                  // jump to start of next day in SP
                  sp.setUTCHours(0, 0, 0, 0);
                  sp.setUTCDate(sp.getUTCDate() + 1);
                  candidate = fromSP(sp);
                  needsBump = true;
                } else if (intervalStart && intervalEnd) {
                  const [sH, sM] = intervalStart.split(':').map(Number);
                  const [eH, eM] = intervalEnd.split(':').map(Number);
                  const startMin = sH * 60 + (sM || 0);
                  const endMin = eH * 60 + (eM || 0);
                  if (minutes < startMin) {
                    sp.setUTCHours(sH, sM || 0, 0, 0);
                    candidate = fromSP(sp);
                    needsBump = true;
                  } else if (minutes >= endMin) {
                    sp.setUTCHours(sH, sM || 0, 0, 0);
                    sp.setUTCDate(sp.getUTCDate() + 1);
                    candidate = fromSP(sp);
                    needsBump = true;
                  }
                }
                if (!needsBump) break;
              }
              return candidate.getTime();
            };

            let scheduledMs = adjustToWindow(Date.now() + delayMs);

            // Deadline check: skip step entirely if past deadline
            if (config.has_deadline && config.deadline_date) {
              const deadlineMs = new Date(String(config.deadline_date)).getTime();
              if (!Number.isNaN(deadlineMs) && scheduledMs > deadlineMs) {
                actionResult = { skipped: true, reason: 'past_deadline', deadline: config.deadline_date };
                results.push({ step: currentStep, action: actionType, status: 'skipped', result: actionResult });
                await logTimeline('timer', 'Timer', 'skipped', { reason: 'past_deadline' });
                break;
              }
            }

            delayMs = Math.max(0, scheduledMs - Date.now());

            if (delayMs > 0) {
              // Schedule remaining steps for later execution
              const scheduledAt = new Date(Date.now() + delayMs).toISOString();
              const remainingActions = actions.slice(i + 1);

              await supabase.from('automation_scheduled_steps').insert({
                automation_id,
                execution_id: executionId,
                contact_id,
                organization_id: automation.organization_id,
                current_step: i + 1,
                scheduled_at: scheduledAt,
                status: 'pending',
                actions: remainingActions,
              });

              // Update execution to waiting
              await supabase.from('automation_executions').update({
                status: 'waiting',
                current_step: currentStep,
                results,
              }).eq('id', executionId);

              actionResult = { scheduled: true, resume_at: scheduledAt, remaining_steps: remainingActions.length };
              results.push({ step: currentStep, action: actionType, status: 'scheduled', result: actionResult });

              await logTimeline('timer', 'Timer', 'waiting', { scheduled_at: scheduledAt });

              // Return early - remaining steps will be executed by the scheduler
              return new Response(
                JSON.stringify({ success: true, execution_id: executionId, status: 'waiting', results }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            actionResult = { waited: 0, note: 'No delay needed' };
            break;
          }

          case 'warmup': {
            // Rate limiting: pause between batches
            const leadsPerMinute = Number(action.config.leads_per_minute || 1);
            const delayPerLead = Math.ceil(60000 / leadsPerMinute);
            // For single execution, just add a small delay
            await new Promise(resolve => setTimeout(resolve, Math.min(delayPerLead, 5000)));
            actionResult = { warmup_applied: true, rate: leadsPerMinute };
            await logTimeline('warmup', 'Aquecimento', 'success');
            break;
          }

          // ── CONDITIONALS (IF/ELSE BRANCHING) ──
          case 'conditional':
          case 'if_tag':
          case 'if_keyword':
          case 'if_score':
          case 'tag_filter': {
            const contact = await getContact();
            let conditionMet = false;
            const conditions = (action.config.conditions as Array<{ field: string; operator: string; value: string }>) || [];
            const logicOperator = (action.config.logic as string) || 'AND';

            if (conditions.length === 0 && actionType === 'tag_filter') {
              // Tag filter: check entry_tags and block_tags
              const entryTags = (action.config.entry_tags as string[]) || [];
              const blockTags = (action.config.block_tags as string[]) || [];

              if (contact_id) {
                const { data: contactTags } = await supabase
                  .from('contact_tags')
                  .select('tag_id, tags(name)')
                  .eq('contact_id', contact_id);
                const tagNames = (contactTags || []).map((t: any) => t.tags?.name).filter(Boolean);
                const tagIds = (contactTags || []).map((t: any) => t.tag_id);

                const hasAllEntry = entryTags.length === 0 || entryTags.every(t => tagIds.includes(t) || tagNames.includes(t));
                const hasAnyBlock = blockTags.some(t => tagIds.includes(t) || tagNames.includes(t));
                conditionMet = hasAllEntry && !hasAnyBlock;
              }
            } else if (conditions.length > 0 && contact) {
              const evalResults = await Promise.all(conditions.map(async (cond) => {
                switch (cond.field) {
                  case 'has_tag': {
                    const { data: ct } = await supabase
                      .from('contact_tags').select('id').eq('contact_id', contact_id!).eq('tag_id', cond.value).maybeSingle();
                    return !!ct;
                  }
                  case 'score_gte':
                    return (contact.lead_score || 0) >= Number(cond.value);
                  case 'score_lte':
                    return (contact.lead_score || 0) <= Number(cond.value);
                  case 'has_email':
                    return !!contact.email;
                  case 'has_whatsapp':
                    return !!(contact.whatsapp || contact.phone);
                  case 'status_is':
                    return contact.status === cond.value;
                  case 'source_is':
                    return contact.source === cond.value;
                  case 'keyword': {
                    // Check last message for keyword
                    const { data: lastMsg } = await supabase
                      .from('messages')
                      .select('content')
                      .eq('contact_id', contact_id!)
                      .eq('sender_type', 'contact')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    return lastMsg?.content?.toLowerCase().includes(cond.value.toLowerCase()) || false;
                  }
                  default:
                    return false;
                }
              }));

              conditionMet = logicOperator === 'OR' ? evalResults.some(Boolean) : evalResults.every(Boolean);
            }

            // Check deadline for tag_filter
            if (actionType === 'tag_filter' && action.config.has_deadline && action.config.deadline_date) {
              const deadline = new Date(action.config.deadline_date as string);
              if (deadline < new Date()) {
                conditionMet = false; // Past deadline
              }
            }

            actionResult = { condition_met: conditionMet, conditions_evaluated: conditions.length || 'tag_filter' };

            if (!conditionMet) {
              // Skip remaining actions (simple linear skip — future: branch paths)
              await logTimeline(actionType, 'Condição', 'skipped', { reason: 'Condition not met' });
              
              // If the action has a false branch config, we could handle it here
              // For now, we stop execution on condition failure
              results.push({ step: currentStep, action: actionType, status: 'condition_false', result: actionResult });
              
              await supabase.from('automation_executions').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                current_step: currentStep,
                results,
              }).eq('id', executionId);

              await supabase.rpc('increment_automation_executions', { automation_id });

              return new Response(
                JSON.stringify({ success: true, execution_id: executionId, stopped_at_condition: currentStep, results }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            await logTimeline(actionType, 'Condição', 'success', { met: true });
            break;
          }

          // ── WHATSAPP GROUP MANAGEMENT ──
          case 'add_to_whatsapp_group': {
            const contact = await getContact();
            const phoneNumber = contact?.whatsapp || contact?.phone;
            if (phoneNumber && action.config.group_id) {
              // Push to asynchronous queue (Etapa 3)
              const { error: queueError } = await supabase.from('wa_sync_queue').insert({
                organization_id: automation.organization_id,
                action_type: 'add_member',
                group_id: action.config.group_id as string,
                user_id: contact_id, // Contact ID is treated as user_id in this context
                phone_number: phoneNumber,
                status: 'pending'
              });
              
              actionResult = { success: !queueError, queued: true };
              await logTimeline('add_to_group', 'Grupo WA', 'success', { queued: true });
            } else {
              actionResult = { success: false, reason: 'Missing phone or group_id' };
              await logTimeline('add_to_group', 'Grupo WA', 'failed', { reason: 'Missing data' });
            }
            break;
          }

          case 'edit_whatsapp_group': {
            // Falls back to the trigger group_id when not configured (group_tag_added flow)
            const targetGroupId = (action.config.group_id as string) || (triggerContext.group_id as string | undefined) || '';
            if (targetGroupId) {
              const updates: Record<string, unknown> = {};
              if (action.config.new_name) updates.name = action.config.new_name;
              if (action.config.new_description) updates.description = action.config.new_description;
              if (Object.keys(updates).length > 0) {
                await supabase.from('whatsapp_groups').update(updates).eq('id', targetGroupId);
              }
              actionResult = { success: true, updates, group_id: targetGroupId };
            } else {
              actionResult = { success: false, reason: 'Missing group_id' };
            }
            await logTimeline('edit_group', 'Editar Grupo', 'success');
            break;
          }

          // ── PARALLEL CHANNELS (FISHBONE) ──
          case 'parallel_channels': {
            const channels = (action.config.channels as string[]) || ['whatsapp', 'email'];
            const contact = await getContact();
            const parallelResults: Record<string, unknown> = {};

            for (const channel of channels) {
              try {
                if (channel === 'whatsapp' && (contact?.whatsapp || contact?.phone)) {
                  const msg = replaceVars(action.config.whatsapp_message as string || action.config.message as string, contact);
                  parallelResults.whatsapp = await sendWhatsAppDirect(contact.whatsapp || contact.phone, { ...action.config, message: msg });
                } else if (channel === 'email' && contact?.email) {
                  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                    body: JSON.stringify({
                      organization_id: automation.organization_id,
                      to: contact.email,
                      subject: replaceVars(action.config.email_subject as string, contact),
                      html: replaceVars(action.config.email_body as string, contact),
                    }),
                  });
                  parallelResults.email = { success: true };
                } else if (channel === 'sms' && (contact?.phone || contact?.whatsapp)) {
                  await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                    body: JSON.stringify({
                      organization_id: automation.organization_id,
                      to: contact.phone || contact.whatsapp,
                      message: replaceVars(action.config.sms_message as string, contact),
                    }),
                  });
                  parallelResults.sms = { success: true };
                }
              } catch (channelErr) {
                parallelResults[channel] = { error: (channelErr as Error).message };
              }
            }

            actionResult = { parallel: true, channels: parallelResults };
            await logTimeline('parallel', 'Paralelo', 'success', { channels: Object.keys(parallelResults) });
            break;
          }

          // ── SEQUENCES (container nodes) ──
          case 'sequence_lead':
          case 'sequence_transaction':
          case 'sequence_rewarming':
          case 'sequence_optin': {
            const seqMode = String(action.config.mode || 'inline');

            if (seqMode === 'reference' && action.config.target_automation_id) {
              // Mode 1: dispatch another existing automation as sub-routine
              try {
                await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                  body: JSON.stringify({
                    automation_id: action.config.target_automation_id,
                    contact_id,
                    trigger_data: triggerContext,
                  }),
                });
                actionResult = { sequence_dispatched: true, mode: 'reference', target: action.config.target_automation_id };
              } catch (refErr) {
                actionResult = { error: (refErr as Error).message };
              }
              await logTimeline(actionType, `Sequência → automação`, 'success');
              break;
            }

            // Mode 2: inline sub-flow with sub_nodes/sub_connections from canvas editor
            const subNodes = (action.config.sub_nodes as Array<{ id: string; type: string; subtype: string; config: Record<string, unknown> }>) || [];
            const subConnections = (action.config.sub_connections as Array<{ from: string; to: string }>) || [];

            if (contact_id && subNodes.length > 0) {
              // Topological order from sub-flow trigger/first node
              const nodeMap = new Map(subNodes.map(n => [n.id, n]));
              const incoming = new Map<string, number>();
              subNodes.forEach(n => incoming.set(n.id, 0));
              subConnections.forEach(c => incoming.set(c.to, (incoming.get(c.to) || 0) + 1));
              const ordered: typeof subNodes = [];
              const queue = subNodes.filter(n => (incoming.get(n.id) || 0) === 0).map(n => n.id);
              const seen = new Set<string>();
              while (queue.length) {
                const nid = queue.shift()!;
                if (seen.has(nid)) continue;
                seen.add(nid);
                const n = nodeMap.get(nid);
                if (n) ordered.push(n);
                subConnections.filter(c => c.from === nid).forEach(c => queue.push(c.to));
              }
              // Fallback: include any unreached nodes at the end
              subNodes.forEach(n => { if (!seen.has(n.id)) ordered.push(n); });

              // Schedule each sub-node respecting timer nodes as delays
              let cumulativeMs = 0;
              for (const sn of ordered) {
                if (sn.subtype === 'timer' || sn.type === 'timer') {
                  const minutes = Number(sn.config?.delay_minutes || sn.config?.minutes || 5);
                  cumulativeMs += minutes * 60000;
                  continue;
                }
                if (sn.subtype === 'note') continue;
                const scheduledAt = new Date(Date.now() + cumulativeMs).toISOString();
                await supabase.from('automation_scheduled_steps').insert({
                  automation_id,
                  execution_id: executionId,
                  contact_id,
                  organization_id: automation.organization_id,
                  current_step: i,
                  scheduled_at: scheduledAt,
                  status: 'pending',
                  actions: [{ type: sn.subtype, subtype: sn.subtype, config: sn.config || {} }],
                  trigger_data: triggerContext,
                });
              }
              actionResult = { sequence_scheduled: true, mode: 'inline', total_steps: ordered.length, type: actionType };
            } else {
              // Legacy fallback: flat steps array (older saved data)
              const steps = (action.config.steps as Array<{ message: string; delay_minutes: number; channel: string }>) || [];
              if (contact_id && steps.length > 0) {
                for (let si = 0; si < steps.length; si++) {
                  const step = steps[si];
                  const delayMs = (si === 0) ? 0 : (step.delay_minutes || 5) * 60000;
                  await supabase.from('automation_scheduled_steps').insert({
                    automation_id,
                    execution_id: executionId,
                    contact_id,
                    organization_id: automation.organization_id,
                    current_step: i,
                    scheduled_at: new Date(Date.now() + delayMs).toISOString(),
                    status: 'pending',
                    actions: [{ type: step.channel || 'send_whatsapp', config: { message: step.message } }],
                  });
                }
                actionResult = { sequence_scheduled: true, mode: 'legacy', total_steps: steps.length };
              }
            }
            await logTimeline(actionType, `Sequência ${actionType.replace('sequence_', '')}`, 'success');
            break;
          }

          // ── LINK SPLIT ──
          case 'link_split': {
            const links = (action.config.links as Array<{ url: string; weight: number }>) || [];
            if (links.length > 0) {
              // Weighted random selection
              const totalWeight = links.reduce((sum, l) => sum + (l.weight || 1), 0);
              let rand = Math.random() * totalWeight;
              let selectedLink = links[0]?.url;
              for (const link of links) {
                rand -= (link.weight || 1);
                if (rand <= 0) { selectedLink = link.url; break; }
              }
              actionResult = { selected_link: selectedLink, total_variants: links.length };
            }
            await logTimeline('link_split', 'Link Split', 'success');
            break;
          }

          // ── ABANDONMENT RECOVERY ──
          case 'abandonment': {
            // Mark contact for abandonment recovery flow
            if (contact_id) {
              await supabase.from('contact_tags').insert({
                contact_id,
                tag_id: action.config.recovery_tag_id as string,
              }).then(() => {});
              // Schedule recovery message
              const delayMinutes = Number(action.config.delay_minutes || 30);
              await supabase.from('automation_scheduled_steps').insert({
                automation_id,
                execution_id: executionId,
                contact_id,
                organization_id: automation.organization_id,
                current_step: i,
                scheduled_at: new Date(Date.now() + delayMinutes * 60000).toISOString(),
                status: 'pending',
                actions: [{
                  type: 'send_whatsapp',
                  config: { message: action.config.recovery_message || 'Notamos que você não finalizou. Precisa de ajuda?' },
                }],
              });
              actionResult = { recovery_scheduled: true, delay_minutes: delayMinutes };
            }
            await logTimeline('abandonment', 'Abandono', 'success');
            break;
          }

          // ── NOTES (no-op) ──
          case 'note': {
            actionResult = { note: action.config.text, logged: true };
            break;
          }

          // ── FULL PAGE / PIXEL (frontend-only) ──
          case 'full_page':
          case 'pixel': {
            actionResult = { frontend_only: true, action: actionType };
            break;
          }

          // ── LIST TAG ──
          case 'list_tag': {
            if (contact_id) {
              const { data: tags } = await supabase
                .from('contact_tags')
                .select('tag_id, tags(name)')
                .eq('contact_id', contact_id);
              actionResult = { tags: tags?.map((t: any) => t.tags?.name).filter(Boolean) || [] };
            }
            break;
          }

          default:
            actionResult = { skipped: true, reason: `Unhandled action type: ${actionType}` };
            console.log(`[AUTOMATION] Unhandled action: ${actionType}`);
            await logTimeline('unhandled_action', 'Ação Não Suportada', 'warning', { action_type: actionType });
            break;
        }

        results.push({
          step: currentStep,
          action: actionType,
          status: 'success',
          result: actionResult,
        });

        // Update execution progress
        await supabase.from('automation_executions').update({
          current_step: currentStep,
          results,
        }).eq('id', executionId);

      } catch (actionError) {
        const errorMsg = actionError instanceof Error ? actionError.message : 'Unknown error';
        console.error(`[AUTOMATION] Step ${currentStep} error:`, errorMsg);
        
        // Detailed error context
        const errorPayload = { 
          error: errorMsg,
          step_index: i,
          action_type: action.subtype || action.type,
          config_keys: Object.keys(action.config || {})
        };

        results.push({
          step: currentStep,
          action: action.subtype || action.type,
          status: 'error',
          error: errorMsg,
          result: errorPayload
        });
        
        await logTimeline(action.subtype || action.type, 'Erro no Passo', 'error', errorPayload);
        
        // Optionally stop execution on critical errors (like auth/config issues)
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
          console.warn("[AUTOMATION] Critical auth error, stopping execution");
          break;
        }
      }
    }

    // Mark execution as completed
    const finalStatus = results.some(r => r.status === 'error') ? 'completed_with_errors' : 'completed';
    await supabase.from('automation_executions').update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      current_step: actions.length, // Ensure we mark it as finished
      results,
    }).eq('id', executionId);

    // Call shared logger for the final status
    await logToSystem(supabase, {
      organization_id: automation.organization_id,
      user_id: automation.user_id,
      source: "process-automation",
      event: "automation_finished",
      level: finalStatus === 'completed' ? 'info' : 'warning',
      message: `Automation ${automation.name} finished with status: ${finalStatus}`,
      payload: { automation_id, execution_id: executionId, total_steps: actions.length }
    });

    await supabase.rpc('increment_automation_executions', { automation_id });

    return new Response(
      JSON.stringify({ success: true, execution_id: executionId, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing automation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
