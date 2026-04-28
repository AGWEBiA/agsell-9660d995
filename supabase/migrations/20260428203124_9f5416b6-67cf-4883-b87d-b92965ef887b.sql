
REVOKE EXECUTE ON FUNCTION public.emit_webhook_event(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_webhook_event(uuid, text, jsonb) TO service_role;
