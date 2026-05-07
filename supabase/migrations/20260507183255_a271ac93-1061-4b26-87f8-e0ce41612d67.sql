
-- Remove crons antigos apontando para projeto errado
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobname FROM cron.job WHERE jobname IN ('verify-email-domains-periodic','process-sequences-every-minute','process-automation-scheduled-steps','process-automations-every-minute') LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END $$;

-- Cron: processa etapas agendadas de automações a cada minuto
SELECT cron.schedule(
  'process-automations-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/process-scheduled-steps',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeHJrdnd4bHp3enJsbHdkd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY1NTUsImV4cCI6MjA4OTY3MjU1NX0.aat2diT5-nOUUxszbpO9k9iuwpemhK_CgqfX6ZEqT4s", "X-Internal-Cron": "true"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Cron: processa sequências de marketing a cada minuto
SELECT cron.schedule(
  'process-sequences-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/process-sequence',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeHJrdnd4bHp3enJsbHdkd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY1NTUsImV4cCI6MjA4OTY3MjU1NX0.aat2diT5-nOUUxszbpO9k9iuwpemhK_CgqfX6ZEqT4s"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Cron: verificação periódica de domínios de email a cada 6h
SELECT cron.schedule(
  'verify-email-domains-periodic',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/verify-email-domains-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeHJrdnd4bHp3enJsbHdkd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY1NTUsImV4cCI6MjA4OTY3MjU1NX0.aat2diT5-nOUUxszbpO9k9iuwpemhK_CgqfX6ZEqT4s"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Cron: processa entregas de webhooks pendentes a cada minuto
SELECT cron.schedule(
  'process-webhook-deliveries-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/process-webhook-deliveries',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeHJrdnd4bHp3enJsbHdkd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY1NTUsImV4cCI6MjA4OTY3MjU1NX0.aat2diT5-nOUUxszbpO9k9iuwpemhK_CgqfX6ZEqT4s"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
