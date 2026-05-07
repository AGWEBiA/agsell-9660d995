ALTER TABLE public.automation_scheduled_steps
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_scheduled_steps_status_scheduled
  ON public.automation_scheduled_steps (status, scheduled_at);