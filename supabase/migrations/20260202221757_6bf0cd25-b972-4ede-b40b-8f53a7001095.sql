-- =====================================================
-- FASE 2: Tabela para execuções de automações
-- =====================================================

-- Tabela de execuções de automações
CREATE TABLE public.automation_executions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    results JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_automation_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_automation_executions_created ON public.automation_executions(created_at DESC);

-- RLS
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executions of their automations"
ON public.automation_executions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.automations
        WHERE automations.id = automation_executions.automation_id
        AND automations.user_id = auth.uid()
    )
);

CREATE POLICY "System can insert executions"
ON public.automation_executions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update executions"
ON public.automation_executions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.automations
        WHERE automations.id = automation_executions.automation_id
        AND automations.user_id = auth.uid()
    )
);