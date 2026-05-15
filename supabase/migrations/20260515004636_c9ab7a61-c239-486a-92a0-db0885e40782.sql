CREATE TABLE IF NOT EXISTS public.automation_test_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL UNIQUE,
  criteria_text TEXT NOT NULL,
  validation_steps TEXT[] NOT NULL,
  expected_outcome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.automation_test_checklist (trigger_type, criteria_text, validation_steps, expected_outcome)
VALUES 
('instagram_dm', 'Recebimento de DM no Instagram', ARRAY['Enviar DM de conta teste', 'Verificar entrada no SAC Inbox', 'Verificar ativação da automação'], 'Resposta automática enviada ou fluxo iniciado'),
('instagram_comment', 'Comentário em Post', ARRAY['Comentar em post vinculado', 'Verificar log no instagram_automation_logs'], 'Resposta ao comentário ou DM de volta enviada'),
('whatsapp_received', 'Mensagem de WhatsApp', ARRAY['Enviar mensagem para número conectado', 'Verificar WA Sync Queue'], 'Mensagem processada e fluxos de resposta ativados'),
('form_submitted', 'Submissão de Formulário', ARRAY['Preencher formulário público', 'Verificar criação de contato'], 'Contato criado/atualizado e automação disparada')
ON CONFLICT (trigger_type) DO UPDATE SET 
criteria_text = EXCLUDED.criteria_text,
validation_steps = EXCLUDED.validation_steps,
expected_outcome = EXCLUDED.expected_outcome;

ALTER TABLE public.automation_test_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for checklist" ON public.automation_test_checklist FOR SELECT USING (true);
