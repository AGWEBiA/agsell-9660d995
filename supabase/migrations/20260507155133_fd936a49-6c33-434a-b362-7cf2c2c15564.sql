CREATE POLICY "Anyone can create checkout leads"
ON public.checkout_leads
FOR INSERT
WITH CHECK (true);