
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS provider_subscription_id text;

COMMENT ON COLUMN public.subscriptions.payment_provider IS 'Payment provider: stripe or kiwify';
COMMENT ON COLUMN public.subscriptions.provider_subscription_id IS 'External subscription/order ID from payment provider';
