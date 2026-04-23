ALTER TABLE public.messages ADD COLUMN quoted_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN quoted_content text;
ALTER TABLE public.messages ADD COLUMN quoted_sender_type text;