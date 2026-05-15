
DO $$
DECLARE
  cfg jsonb := public.resolve_edge_function_cron_config();
  base text := cfg->>'base_url';
  hdr  text;
BEGIN
  hdr := jsonb_build_object(
    'Content-Type','application/json',
    'x-admin-token','bf_fs_2026_05_14_yT7vK9pQ3mN7vR2'
  )::text;

  -- Remove versões anteriores (idempotente)
  PERFORM cron.unschedule(j) FROM (VALUES
    ('backfill-form-submissions-every-5-minutes')
  ) AS t(j) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = j);

  PERFORM cron.schedule(
    'backfill-form-submissions-every-5-minutes',
    '*/5 * * * *',
    format(
      $f$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:='{}'::jsonb);$f$,
      base || '/functions/v1/backfill-form-submissions',
      hdr
    )
  );
END $$;
