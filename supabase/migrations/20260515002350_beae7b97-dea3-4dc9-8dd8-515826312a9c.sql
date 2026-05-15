DO $$
DECLARE
  v_cfg jsonb;
  v_base_url text;
  v_token text;
BEGIN
  v_cfg := public.resolve_edge_function_cron_config();
  v_base_url := v_cfg->>'base_url';
  v_token := v_cfg->>'bearer_token';

  IF v_base_url IS NULL OR v_token IS NULL THEN
    RAISE EXCEPTION 'Não foi possível resolver URL/token para reagendar crons';
  END IF;

  -- Unschedule existing (ignore errors if not present)
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN (
    'process-scheduled-steps-every-minute',
    'process-automations-every-minute',
    'process-webhook-deliveries-every-minute'
  );

  -- Reschedule with correct env URL
  PERFORM cron.schedule(
    'process-scheduled-steps-every-minute',
    '* * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := '{}'::jsonb
      );
    $cron$,
      v_base_url || '/functions/v1/process-scheduled-steps',
      jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || v_token,
        'x-internal-cron','true'
      )::text
    )
  );

  PERFORM cron.schedule(
    'process-automations-every-minute',
    '* * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := '{}'::jsonb
      );
    $cron$,
      v_base_url || '/functions/v1/process-automation',
      jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || v_token,
        'x-internal-cron','true'
      )::text
    )
  );

  PERFORM cron.schedule(
    'process-webhook-deliveries-every-minute',
    '* * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := '{}'::jsonb
      );
    $cron$,
      v_base_url || '/functions/v1/process-webhook-deliveries',
      jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || v_token,
        'x-internal-cron','true'
      )::text
    )
  );
END $$;