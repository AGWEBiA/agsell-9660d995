ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS monthly_sales_target NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_commission_rule JSONB DEFAULT '{"rate": 0}'::jsonb;