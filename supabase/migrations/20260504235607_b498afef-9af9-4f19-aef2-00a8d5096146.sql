-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'debug')),
    source TEXT NOT NULL, -- e.g., 'webhook-kiwify', 'automation-engine'
    event TEXT NOT NULL,
    message TEXT,
    payload JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view logs for their organization"
ON public.system_logs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- Add tracking columns to webhook_events if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'organization_id') THEN
        ALTER TABLE public.webhook_events ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'user_id') THEN
        ALTER TABLE public.webhook_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'error_stack') THEN
        ALTER TABLE public.webhook_events ADD COLUMN error_stack TEXT;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_org_id ON public.system_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON public.webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed) WHERE processed = false;
