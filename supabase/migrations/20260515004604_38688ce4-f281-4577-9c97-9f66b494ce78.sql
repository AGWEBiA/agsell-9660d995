-- View para relatório de saúde dos triggers (usando action_type como proxy para trigger)
CREATE OR REPLACE VIEW public.automation_trigger_health_report AS
WITH stats AS (
  SELECT 
    action_type as trigger_type,
    COUNT(*) filter (WHERE status IN ('triggered', 'success')) as triggered_count,
    COUNT(*) filter (WHERE status = 'running') as running_count,
    COUNT(*) filter (WHERE status = 'completed') as completed_count,
    COUNT(*) filter (WHERE status = 'error') as error_count,
    MAX(created_at) as last_execution
  FROM public.automation_contact_timeline
  WHERE created_at > now() - interval '7 days'
  GROUP BY action_type
)
SELECT 
  trigger_type,
  triggered_count,
  running_count,
  completed_count,
  error_count,
  last_execution,
  CASE 
    WHEN error_count > 0 AND error_count::float / NULLIF(triggered_count, 0) > 0.1 THEN 'vermelho'
    WHEN last_execution < now() - interval '24 hours' THEN 'amarelo'
    ELSE 'verde'
  END as health_status
FROM stats;

-- Função para validar trigger end-to-end (simulação)
CREATE OR REPLACE FUNCTION public.validate_trigger_e2e(target_trigger_type TEXT, payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_automation_id UUID;
BEGIN
  -- Tenta encontrar uma automação ativa com esse trigger
  SELECT id INTO v_automation_id 
  FROM public.automations 
  WHERE trigger_type = target_trigger_type 
  AND is_active = true 
  LIMIT 1;

  IF v_automation_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma automação ativa encontrada para este trigger');
  END IF;

  -- Registra o início da validação no log de sistema
  INSERT INTO public.system_logs (organization_id, source, event, message, payload)
  SELECT organization_id, 'validation-suite', 'trigger_test_start', 
         'Iniciando teste E2E para trigger: ' || target_trigger_type, payload
  FROM public.automations WHERE id = v_automation_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Simulação de trigger enviada', 
    'automation_id', v_automation_id,
    'instructions', 'Acompanhe o processamento no Monitor de Automações'
  );
END;
$$;

-- Métricas de processamento da fila
CREATE OR REPLACE FUNCTION public.get_automation_queue_performance()
RETURNS TABLE (
  avg_processing_time_ms FLOAT,
  p90_processing_time_ms FLOAT,
  throughput_last_hour BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - scheduled_at)) * 1000), 0) as avg_ms,
    COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - scheduled_at)) * 1000), 0) as p90_ms,
    COUNT(*) as throughput
  FROM public.automation_scheduled_steps
  WHERE status = 'completed' 
  AND updated_at > now() - interval '1 hour';
$$;

-- Alerta de Cron Offline
CREATE OR REPLACE FUNCTION public.check_cron_liveness()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_run TIMESTAMP;
BEGIN
  -- Verifica a última resposta 200 do process-scheduled-steps
  -- Usamos system_logs como proxy de saúde do cron se net._http_response não for acessível
  SELECT MAX(created_at) INTO v_last_run 
  FROM public.system_logs 
  WHERE source = 'process-scheduled-steps' 
  AND event = 'cron_run';

  IF v_last_run IS NULL OR v_last_run < now() - interval '30 minutes' THEN
    INSERT INTO public.security_alerts (organization_id, title, description, severity, alert_type)
    SELECT id, 'CRON DELAY/OFFLINE', 'O processamento automático de automações não registrou atividade nos últimos 30 minutos.', 'critical', 'infra_alert'
    FROM public.organizations
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
