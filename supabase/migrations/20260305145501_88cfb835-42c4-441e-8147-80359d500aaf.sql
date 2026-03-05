
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS kiwify_product_id text,
ADD COLUMN IF NOT EXISTS kiwify_checkout_url text;

COMMENT ON COLUMN public.plans.kiwify_product_id IS 'Kiwify product ID for this plan';
COMMENT ON COLUMN public.plans.kiwify_checkout_url IS 'Kiwify checkout URL for this plan';
