DO $$
DECLARE
  cfg jsonb;
  base_url text;
  token text;
  jname text;
  cmd text;
  jobs text[] := ARRAY[
    'process-scheduled-steps-every-minute',
    'process-automations-every-minute',
    'process-scheduled-steps',
    'process-automation-scheduled-steps'
  ];
BEGIN
  cfg := public.resolve_edge_function_cron_config();
  base_url := cfg->>'base_url';
  token := cfg->>'bearer_token';

  -- Unschedule all existing variants
  FOREACH jname IN ARRAY jobs LOOP
    BEGIN
      PERFORM cron.unschedule(jname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  -- (Re)schedule single source of truth: process-scheduled-steps every minute
  cmd := format($f$
    SELECT net.http_post(
      url := %L,
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $f$,
    base_url || '/functions/v1/process-scheduled-steps',
    json_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || token,
      'x-internal-cron','true'
    )::text
  );

  PERFORM cron.schedule('process-scheduled-steps-every-minute', '* * * * *', cmd);
END $$;