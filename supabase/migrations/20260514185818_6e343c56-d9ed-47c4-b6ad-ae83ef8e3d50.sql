UPDATE public.webhook_events
SET processed = true,
    processed_at = COALESCE(processed_at, now()),
    error_message = COALESCE(error_message, 'Auto-skipped: legacy unknown.undefined (flat schema not handled)')
WHERE source = 'kiwify'
  AND processed = false
  AND event_type = 'unknown.undefined';