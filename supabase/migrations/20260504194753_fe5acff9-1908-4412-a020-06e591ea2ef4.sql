-- Create product_commissions table
CREATE TABLE IF NOT EXISTS public.product_commissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    commission_rate NUMERIC NOT NULL DEFAULT 0,
    monthly_target NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, product_name)
);

-- Enable RLS
ALTER TABLE public.product_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view product commissions of their organization"
ON public.product_commissions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = product_commissions.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage product commissions"
ON public.product_commissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = product_commissions.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('admin', 'owner')
    )
);

-- Add updated_at trigger
CREATE TRIGGER update_product_commissions_updated_at
BEFORE UPDATE ON public.product_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();