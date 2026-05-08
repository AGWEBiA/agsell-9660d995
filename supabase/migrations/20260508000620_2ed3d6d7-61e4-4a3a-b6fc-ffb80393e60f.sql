
ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS whatsapp_instance_id uuid REFERENCES public.organization_integrations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_chatbots_whatsapp_instance ON public.chatbots(whatsapp_instance_id);

CREATE OR REPLACE FUNCTION public.validate_chatbot_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.whatsapp_instance_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_integrations oi
      WHERE oi.id = NEW.whatsapp_instance_id
        AND oi.organization_id = NEW.organization_id
        AND oi.integration_type IN ('evolution_api','whatsapp_business')
    ) THEN
      RAISE EXCEPTION 'Instância WhatsApp inválida ou não pertence à organização';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_chatbot_instance ON public.chatbots;
CREATE TRIGGER trg_validate_chatbot_instance
BEFORE INSERT OR UPDATE OF whatsapp_instance_id, organization_id ON public.chatbots
FOR EACH ROW EXECUTE FUNCTION public.validate_chatbot_instance();
