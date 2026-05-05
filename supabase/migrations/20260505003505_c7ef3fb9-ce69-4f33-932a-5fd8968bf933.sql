-- Fix search_path for common functions (Hardening)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_sync_queue_status ON public.wa_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_wa_sync_queue_created_at ON public.wa_sync_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);

-- Function to get funnel stats for BI
CREATE OR REPLACE FUNCTION public.get_funnel_stats(p_user_id UUID)
RETURNS TABLE (
    out_stage_name TEXT,
    out_deal_count BIGINT,
    out_total_value NUMERIC,
    out_position INT,
    out_color TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.name,
        COUNT(d.id)::BIGINT,
        COALESCE(SUM(d.value), 0)::NUMERIC,
        ps.position,
        ps.color
    FROM public.pipeline_stages ps
    LEFT JOIN public.deals d ON d.stage_id = ps.id
    WHERE ps.user_id = p_user_id
    GROUP BY ps.id, ps.name, ps.position, ps.color
    ORDER BY ps.position ASC;
END;
$$;

-- Function to get automation metrics
CREATE OR REPLACE FUNCTION public.get_automation_metrics()
RETURNS TABLE (
    out_status TEXT,
    out_event_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN processed = true AND error_message IS NULL THEN 'Success'
            WHEN processed = true AND error_message IS NOT NULL THEN 'Failed'
            ELSE 'Pending'
        END as status,
        COUNT(*)::BIGINT
    FROM public.webhook_events we
    GROUP BY status;
END;
$$;
