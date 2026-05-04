ALTER TABLE public.deals 
ADD COLUMN product_id UUID REFERENCES public.product_commissions(id) ON DELETE SET NULL;

CREATE INDEX idx_deals_product_id ON public.deals(product_id);