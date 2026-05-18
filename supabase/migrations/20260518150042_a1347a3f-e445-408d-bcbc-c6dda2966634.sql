
ALTER TABLE public.sandbox_executions DROP CONSTRAINT IF EXISTS sandbox_executions_automation_type_check;
ALTER TABLE public.sandbox_executions ADD CONSTRAINT sandbox_executions_automation_type_check
  CHECK (automation_type IN ('flow','automation','sequence','campaign','chatbot'));

ALTER TABLE public.chatbots ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft','testing','pending_approval','approved','published'));
