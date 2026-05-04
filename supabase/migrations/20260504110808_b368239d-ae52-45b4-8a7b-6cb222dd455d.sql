ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS instance_name TEXT;

COMMENT ON COLUMN public.messages.instance_name IS 'Nome da instância que enviou a mensagem, usado para filtrar atualizações de status via webhook.';