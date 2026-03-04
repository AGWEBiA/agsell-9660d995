
-- System errors table for monitoring
CREATE TABLE public.system_errors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    module TEXT NOT NULL DEFAULT 'unknown',
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    error_message TEXT NOT NULL,
    error_details TEXT,
    stack_trace TEXT,
    endpoint TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Only admins can access
CREATE POLICY "Admins can view all system errors"
ON public.system_errors FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system errors"
ON public.system_errors FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system errors"
ON public.system_errors FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow inserts from service role and authenticated users (for logging)
CREATE POLICY "Anyone can insert system errors"
ON public.system_errors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_system_errors_severity ON public.system_errors(severity);
CREATE INDEX idx_system_errors_status ON public.system_errors(status);
CREATE INDEX idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX idx_system_errors_org ON public.system_errors(organization_id);
CREATE INDEX idx_system_errors_module ON public.system_errors(module);

-- Trigger for updated_at
CREATE TRIGGER update_system_errors_updated_at
BEFORE UPDATE ON public.system_errors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
