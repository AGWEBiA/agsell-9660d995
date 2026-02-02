-- Corrigir policy de notificações para ser mais restritiva
-- Apenas usuários autenticados podem receber notificações inseridas pelo sistema
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);