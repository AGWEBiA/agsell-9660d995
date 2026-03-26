
-- Table to store products received from payment gateway webhooks
CREATE TABLE public.gateway_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL, -- hotmart, kiwify, eduzz, shopify
  external_product_id TEXT,
  product_name TEXT NOT NULL,
  price NUMERIC,
  currency TEXT DEFAULT 'BRL',
  metadata JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, gateway, external_product_id)
);

-- Enable RLS
ALTER TABLE public.gateway_products ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read
CREATE POLICY "Org members can view gateway products"
  ON public.gateway_products FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_gateway_products_org_gateway ON public.gateway_products(organization_id, gateway);
