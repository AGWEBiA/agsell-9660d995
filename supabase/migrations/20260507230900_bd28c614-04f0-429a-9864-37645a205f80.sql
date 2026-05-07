CREATE OR REPLACE FUNCTION public.get_cron_queue_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'cron'
AS $$
DECLARE
  v_jobs jsonb;
  v_runs jsonb;
  v_queue jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'jobid', jobid, 'jobname', jobname, 'schedule', schedule, 'active', active
  ) ORDER BY jobname), '[]'::jsonb) INTO v_jobs FROM cron.job;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'jobid', r.jobid, 'jobname', j.jobname, 'status', r.status,
    'return_message', LEFT(COALESCE(r.return_message, ''), 200),
    'start_time', r.start_time, 'end_time', r.end_time,
    'duration_ms', EXTRACT(EPOCH FROM (r.end_time - r.start_time)) * 1000
  ) ORDER BY r.start_time DESC), '[]'::jsonb) INTO v_runs
  FROM (SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 30) r
  LEFT JOIN cron.job j ON j.jobid = r.jobid;

  SELECT jsonb_build_object(
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'pending_due', COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_at <= now()),
    'pending_future', COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_at > now()),
    'processing', COUNT(*) FILTER (WHERE status = 'processing'),
    'completed_24h', COUNT(*) FILTER (WHERE status = 'completed' AND COALESCE(updated_at, created_at) > now() - interval '24 hours'),
    'error', COUNT(*) FILTER (WHERE status IN ('error','failed')),
    'oldest_pending', (SELECT MIN(scheduled_at) FROM automation_scheduled_steps WHERE status = 'pending'),
    'next_scheduled', (SELECT MIN(scheduled_at) FROM automation_scheduled_steps WHERE status = 'pending' AND scheduled_at > now()),
    'stuck_processing', COUNT(*) FILTER (WHERE status = 'processing' AND scheduled_at < now() - interval '5 minutes')
  ) INTO v_queue FROM automation_scheduled_steps;

  RETURN jsonb_build_object('jobs', v_jobs, 'runs', v_runs, 'queue', v_queue, 'now', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cron_queue_metrics() TO authenticated;