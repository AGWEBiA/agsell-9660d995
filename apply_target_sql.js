import pkg from 'pg';
const { Client } = pkg;

async function run() {
  const client = new Client({
    connectionString: process.env.TARGET_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to target database.");

    const sql = `
      CREATE OR REPLACE FUNCTION public.reprocess_scheduled_step(target_step_id uuid)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_step record;
        v_allowed boolean := false;
        v_actor_role text := coalesce(auth.role(), '');
      BEGIN
        SELECT id, organization_id, status, scheduled_at
          INTO v_step
        FROM public.automation_scheduled_steps
        WHERE id = target_step_id;

        IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'Step não encontrado');
        END IF;

        IF v_actor_role = 'service_role'
           OR EXISTS (
             SELECT 1
             FROM public.organization_members om
             WHERE om.user_id = auth.uid()
               AND om.organization_id = v_step.organization_id
           ) THEN
          v_allowed := true;
        END IF;

        IF NOT v_allowed THEN
          RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para reprocessar este step');
        END IF;

        UPDATE public.automation_scheduled_steps
        SET status = 'pending',
            scheduled_at = LEAST(v_step.scheduled_at, now()),
            retry_count = coalesce(retry_count, 0) + 1,
            last_error = null,
            updated_at = now()
        WHERE id = target_step_id
          AND status IN ('processing', 'error', 'failed', 'pending');

        RETURN jsonb_build_object('success', true, 'step_id', target_step_id, 'status', 'pending');
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.reprocess_scheduled_step(uuid) TO authenticated, service_role;
    `;

    await client.query(sql);
    console.log("RPC reprocess_scheduled_step created successfully on target.");

  } catch (err) {
    console.error("Error executing SQL on target:", err);
  } finally {
    await client.end();
  }
}

run();
