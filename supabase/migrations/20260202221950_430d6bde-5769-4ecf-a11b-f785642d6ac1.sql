-- Função para incrementar contagem de execuções
CREATE OR REPLACE FUNCTION public.increment_automation_executions(automation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.automations
    SET executions_count = COALESCE(executions_count, 0) + 1
    WHERE id = automation_id;
END;
$$;