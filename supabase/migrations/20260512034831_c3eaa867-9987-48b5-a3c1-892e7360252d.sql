-- 1) Add missing organization_id column referenced by enqueue_automations()
ALTER TABLE public.automation_executions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2) Backfill from related automation
UPDATE public.automation_executions ae
   SET organization_id = a.organization_id
  FROM public.automations a
 WHERE ae.organization_id IS NULL
   AND ae.automation_id = a.id;

-- 3) Index for org-scoped lookups
CREATE INDEX IF NOT EXISTS idx_automation_executions_org
  ON public.automation_executions(organization_id);
