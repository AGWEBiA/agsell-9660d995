CREATE OR REPLACE FUNCTION public.resolve_edge_function_cron_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, cron
AS $$
DECLARE
  v_command text;
  v_base_url text;
  v_token text;
BEGIN
  SELECT command INTO v_command
  FROM cron.job
  WHERE jobname IN ('process-sequences-every-minute', 'verify-email-domains-periodic')
    AND command ~ 'https://[^[:space:]''"]+\.supabase\.co/functions/v1/'
  ORDER BY CASE jobname WHEN 'process-sequences-every-minute' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_command IS NOT NULL THEN
    v_base_url := substring(v_command from '(https://[^[:space:]''"]+\.supabase\.co)/functions/v1/');
    v_token := substring(v_command from 'Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)');
  END IF;

  IF v_base_url IS NULL THEN
    SELECT trim(both '"' from value::text) INTO v_base_url
    FROM public.platform_settings
    WHERE key = 'supabase_url'
    LIMIT 1;
  END IF;

  IF v_base_url IS NULL OR v_base_url !~ '^https://[^/]+\.supabase\.co$' THEN
    RAISE EXCEPTION 'Não foi possível resolver a URL das funções para o cron de automações';
  END IF;

  RETURN jsonb_build_object('base_url', v_base_url, 'bearer_token', v_token);
END;
$$;

DO $$
DECLARE
  j record;
  cfg jsonb;
  headers jsonb;
BEGIN
  FOR j IN
    SELECT jobname
    FROM cron.job
    WHERE jobname IN (
      'process-automation-scheduled-steps',
      'process-automations-every-minute',
      'process-scheduled-steps-every-minute'
    )
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;

  cfg := public.resolve_edge_function_cron_config();
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-Internal-Cron', 'true'
  );

  IF COALESCE(cfg->>'bearer_token', '') <> '' THEN
    headers := headers || jsonb_build_object('Authorization', 'Bearer ' || (cfg->>'bearer_token'));
  END IF;

  PERFORM cron.schedule(
    'process-scheduled-steps-every-minute',
    '* * * * *',
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := jsonb_build_object(''time'', now()::text)) AS request_id;',
      (cfg->>'base_url') || '/functions/v1/process-scheduled-steps',
      headers::text
    )
  );
END $$;