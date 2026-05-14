-- Renew subscription for mkt@real4u.com.br
UPDATE public.subscriptions
SET 
  current_period_start = '2026-04-24 05:35:00+00',
  current_period_end = '2026-05-24 05:35:00+00',
  status = 'active',
  updated_at = now()
WHERE id = '275ce4f0-9b31-422b-8098-38b55ae4b74b';