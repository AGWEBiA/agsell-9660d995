import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  organization_id?: string;
  user_id?: string;
  source: string;
  event: string;
  message?: string;
  payload?: any;
  metadata?: any;
  level?: LogLevel;
  deploy_id?: string;
}

/**
 * Standardized logger for Edge Functions to write to system_logs table
 */
export async function logToSystem(supabase: SupabaseClient, entry: LogEntry) {
  const deployId = entry.deploy_id || Deno.env.get('DENO_DEPLOYMENT_ID') || 'local-dev';
  
  try {
    const { error } = await supabase
      .from("system_logs")
      .insert({
        organization_id: entry.organization_id,
        user_id: entry.user_id,
        level: entry.level || 'info',
        source: entry.source,
        event: entry.event,
        message: entry.message,
        payload: entry.payload,
        metadata: {
          ...(entry.metadata || {}),
          deploy_id: deployId
        },
        deploy_id: deployId, // Added column
      });

    if (error) {
      console.error(`[LOGGER-ERROR] Failed to write to system_logs:`, error.message);
    }
  } catch (err) {
    console.error(`[LOGGER-FATAL]`, err);
  }
  
  // Also log to console for Supabase logs
  const levelPrefix = `[${(entry.level || 'info').toUpperCase()}]`;
  console.log(`${levelPrefix} [${entry.source}] [${deployId}] ${entry.event}: ${entry.message || ''}`, entry.payload || '');
}

/**
 * Updates a webhook event with status and optional error info
 */
export async function updateWebhookEvent(
  supabase: SupabaseClient, 
  id: string, 
  updates: { 
    processed: boolean; 
    organization_id?: string; 
    user_id?: string; 
    error_message?: string;
    error_stack?: string;
  }
) {
  const { error } = await supabase
    .from("webhook_events")
    .update({
      ...updates,
      processed_at: updates.processed ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    console.error(`[LOGGER-ERROR] Failed to update webhook_event ${id}:`, error.message);
  }
}

