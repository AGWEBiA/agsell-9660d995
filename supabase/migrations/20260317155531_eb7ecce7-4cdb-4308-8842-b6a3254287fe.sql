
-- Add columns to store raw import data and pre-assigned tags for background processing
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS import_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS import_tags text[] DEFAULT '{}';

-- Add index for querying pending jobs
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status) WHERE status IN ('pending', 'processing');
