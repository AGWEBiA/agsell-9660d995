CREATE TABLE IF NOT EXISTS public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'status_change', 'note', 'value_change'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their organization deals"
ON public.deal_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_activities.deal_id
    AND d.organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  )
);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.stage_id IS DISTINCT FROM NEW.stage_id) THEN
    INSERT INTO public.deal_activities (deal_id, user_id, type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      'Status alterado de ' || COALESCE(OLD.status, 'aberto') || ' para ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'old_stage', OLD.stage_id, 'new_stage', NEW.stage_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_deal_status_change
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deal_status_change();
