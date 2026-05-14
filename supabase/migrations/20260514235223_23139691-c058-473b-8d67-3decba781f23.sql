DO $$
DECLARE
  cfg jsonb;
  base_url text;
  token text;
  headers jsonb;
  jobs text[] := ARRAY[
    'process-automations-every-minute',
    'process-scheduled-steps-every-minute',
    'process-webhook-deliveries-every-minute'
  ];
  j text;
BEGIN
  cfg := public.resolve_edge_function_cron_config();
  base_url := cfg->>'base_url';
  token := cfg->>'bearer_token';

  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-Internal-Cron', 'true'
  );
  IF COALESCE(token, '') <> '' THEN
    headers := headers || jsonb_build_object('Authorization', 'Bearer ' || token);
  END IF;

  FOREACH j IN ARRAY jobs LOOP
    BEGIN
      PERFORM cron.unschedule(j);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  PERFORM cron.schedule(
    'process-scheduled-steps-every-minute',
    '* * * * *',
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := jsonb_build_object(''time'', now()::text)) AS request_id;',
      base_url || '/functions/v1/process-scheduled-steps',
      headers::text
    )
  );

  PERFORM cron.schedule(
    'process-automations-every-minute',
    '* * * * *',
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb) AS request_id;',
      base_url || '/functions/v1/process-automation',
      headers::text
    )
  );

  PERFORM cron.schedule(
    'process-webhook-deliveries-every-minute',
    '* * * * *',
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb) AS request_id;',
      base_url || '/functions/v1/process-webhook-deliveries',
      headers::text
    )
  );
END $$;