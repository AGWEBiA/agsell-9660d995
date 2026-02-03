-- Create inbound webhooks table
CREATE TABLE public.inbound_webhooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    endpoint_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    secret_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    is_active BOOLEAN DEFAULT true,
    payload_format TEXT DEFAULT 'json',
    headers_to_capture TEXT[] DEFAULT '{}',
    target_action TEXT DEFAULT 'create_contact',
    field_mapping JSONB DEFAULT '{}'::jsonb,
    requests_count INTEGER DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook logs table
CREATE TABLE public.webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID NOT NULL REFERENCES public.inbound_webhooks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'received',
    status_code INTEGER,
    request_headers JSONB,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbound_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for inbound_webhooks
CREATE POLICY "Admins can manage webhooks"
ON public.inbound_webhooks FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view webhooks"
ON public.inbound_webhooks FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- RLS policies for webhook_logs
CREATE POLICY "Users can view logs of their webhooks"
ON public.webhook_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.inbound_webhooks w
    WHERE w.id = webhook_logs.webhook_id
    AND is_org_member(w.organization_id, auth.uid())
));

-- Indexes for performance
CREATE INDEX idx_inbound_webhooks_endpoint ON public.inbound_webhooks(endpoint_id);
CREATE INDEX idx_inbound_webhooks_org ON public.inbound_webhooks(organization_id);
CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created ON public.webhook_logs(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_inbound_webhooks_updated_at
    BEFORE UPDATE ON public.inbound_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();