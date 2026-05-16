CREATE TABLE public.stripe_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT
);

-- Enable RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No public access needed, only service role will use it
CREATE POLICY "Service role can do everything on stripe_events"
ON public.stripe_events
FOR ALL
USING (true)
WITH CHECK (true);
