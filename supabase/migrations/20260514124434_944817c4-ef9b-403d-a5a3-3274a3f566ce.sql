-- Create table for WhatsApp connection history
CREATE TABLE IF NOT EXISTS public.whatsapp_connection_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.organization_integrations(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    event_source TEXT NOT NULL, -- 'webhook', 'manual_sync', 'qrcode_check', etc.
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_connection_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view connection history of their organizations"
ON public.whatsapp_connection_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = whatsapp_connection_history.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_wa_conn_hist_integration ON public.whatsapp_connection_history(integration_id);
CREATE INDEX IF NOT EXISTS idx_wa_conn_hist_org ON public.whatsapp_connection_history(organization_id);

-- Create a function to log status changes that can be called from other DB functions or triggers if needed
CREATE OR REPLACE FUNCTION public.log_whatsapp_connection_change(
    _org_id UUID,
    _integration_id UUID,
    _old_status TEXT,
    _new_status TEXT,
    _source TEXT,
    _payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _history_id UUID;
BEGIN
    INSERT INTO public.whatsapp_connection_history (
        organization_id,
        integration_id,
        old_status,
        new_status,
        event_source,
        payload
    ) VALUES (
        _org_id,
        _integration_id,
        _old_status,
        _new_status,
        _source,
        _payload
    ) RETURNING id INTO _history_id;
    
    RETURN _history_id;
END;
$$;