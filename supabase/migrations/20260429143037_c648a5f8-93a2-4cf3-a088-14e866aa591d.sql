-- =========================================
-- 1. CUSTOM FIELDS
-- =========================================
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','company','deal')),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text','number','date','boolean','select','multiselect','url','email')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  show_in_list BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, entity_type, field_key)
);

CREATE INDEX idx_cfd_org_entity ON public.custom_field_definitions(organization_id, entity_type);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view custom field defs" ON public.custom_field_definitions
  FOR SELECT USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage custom field defs" ON public.custom_field_definitions
  FOR ALL USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER cfd_updated_at BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','company','deal')),
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (field_id, entity_id)
);

CREATE INDEX idx_cfv_entity ON public.custom_field_values(entity_type, entity_id);
CREATE INDEX idx_cfv_org ON public.custom_field_values(organization_id);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view custom field values" ON public.custom_field_values
  FOR SELECT USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Members manage custom field values" ON public.custom_field_values
  FOR ALL USING (is_org_member(organization_id, auth.uid()))
  WITH CHECK (is_org_member(organization_id, auth.uid()));

CREATE TRIGGER cfv_updated_at BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. DEAL STAGE HISTORY (rotting + tempo por etapa)
-- =========================================
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage_id UUID,
  to_stage_id UUID,
  changed_by UUID,
  duration_seconds BIGINT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dsh_deal ON public.deal_stage_history(deal_id, changed_at DESC);
CREATE INDEX idx_dsh_org ON public.deal_stage_history(organization_id, changed_at DESC);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view deal history" ON public.deal_stage_history
  FOR SELECT USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- Add helper columns to deals (additive)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS last_stage_change_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Trigger: record stage change history
CREATE OR REPLACE FUNCTION public.track_deal_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_duration BIGINT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    v_duration := EXTRACT(EPOCH FROM (now() - COALESCE(OLD.last_stage_change_at, OLD.created_at)))::BIGINT;
    INSERT INTO public.deal_stage_history(organization_id, deal_id, from_stage_id, to_stage_id, changed_by, duration_seconds)
      VALUES (NEW.organization_id, NEW.id, OLD.stage_id, NEW.stage_id, auth.uid(), v_duration);
    NEW.last_stage_change_at := now();
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_stage_history(organization_id, deal_id, from_stage_id, to_stage_id, changed_by)
      VALUES (NEW.organization_id, NEW.id, NULL, NEW.stage_id, auth.uid());
    NEW.last_stage_change_at := now();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'track_deal_stage_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_deal_stage ON public.deals;
CREATE TRIGGER trg_track_deal_stage BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.track_deal_stage_change();

-- =========================================
-- 3. SMART LISTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.smart_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','company','deal')),
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  icon TEXT,
  color TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_smartlists_org_entity ON public.smart_lists(organization_id, entity_type);
CREATE INDEX idx_smartlists_user ON public.smart_lists(user_id);

ALTER TABLE public.smart_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or shared smart lists" ON public.smart_lists
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) AND (user_id = auth.uid() OR is_shared = true)
    OR has_role(auth.uid(),'admin'::app_role)
  );
CREATE POLICY "Manage own smart lists" ON public.smart_lists
  FOR ALL USING (is_org_member(organization_id, auth.uid()) AND user_id = auth.uid())
  WITH CHECK (is_org_member(organization_id, auth.uid()) AND user_id = auth.uid());

CREATE TRIGGER smart_lists_updated_at BEFORE UPDATE ON public.smart_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. REVENUE GOALS
-- =========================================
CREATE TABLE IF NOT EXISTS public.revenue_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_org_period ON public.revenue_goals(organization_id, period_start, period_end);

ALTER TABLE public.revenue_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view goals" ON public.revenue_goals
  FOR SELECT USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage goals" ON public.revenue_goals
  FOR ALL USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER revenue_goals_updated_at BEFORE UPDATE ON public.revenue_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. NEXT BEST ACTION (IA)
-- =========================================
CREATE TABLE IF NOT EXISTS public.contact_next_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  reasoning TEXT,
  channel TEXT,
  ai_model TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','dismissed','snoozed')),
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nba_contact ON public.contact_next_actions(contact_id, status);
CREATE INDEX idx_nba_org ON public.contact_next_actions(organization_id, status, priority);

ALTER TABLE public.contact_next_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view next actions" ON public.contact_next_actions
  FOR SELECT USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Members manage next actions" ON public.contact_next_actions
  FOR ALL USING (is_org_member(organization_id, auth.uid()))
  WITH CHECK (is_org_member(organization_id, auth.uid()));

CREATE TRIGGER nba_updated_at BEFORE UPDATE ON public.contact_next_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 6. COMPANY HIERARCHY
-- =========================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_parent ON public.companies(parent_company_id) WHERE parent_company_id IS NOT NULL;

-- =========================================
-- 7. FORECAST FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.calculate_forecast(_org_id UUID, _start DATE, _end DATE, _user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  result JSONB;
  v_target NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(target_amount),0) INTO v_target
  FROM public.revenue_goals
  WHERE organization_id = _org_id
    AND period_start <= _end AND period_end >= _start
    AND (_user_id IS NULL OR user_id = _user_id OR user_id IS NULL);

  SELECT jsonb_build_object(
    'open_count', COUNT(*) FILTER (WHERE status = 'open'),
    'won_count', COUNT(*) FILTER (WHERE status = 'won'),
    'lost_count', COUNT(*) FILTER (WHERE status = 'lost'),
    'total_open_value', COALESCE(SUM(value) FILTER (WHERE status = 'open'),0),
    'won_value', COALESCE(SUM(value) FILTER (WHERE status = 'won'),0),
    'weighted_forecast', COALESCE(SUM(value * COALESCE(probability,50)/100.0) FILTER (WHERE status = 'open'),0),
    'target', v_target,
    'period_start', _start,
    'period_end', _end
  ) INTO result
  FROM public.deals
  WHERE organization_id = _org_id
    AND (
      (status = 'open') OR
      (status IN ('won','lost') AND COALESCE(expected_close_date, updated_at::date) BETWEEN _start AND _end)
    )
    AND (_user_id IS NULL OR owner_id = _user_id OR user_id = _user_id);

  RETURN result;
END;
$$;

-- =========================================
-- 8. ROTTING DEALS FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.get_rotting_deals(_org_id UUID, _days INTEGER DEFAULT 14)
RETURNS TABLE (
  deal_id UUID, title TEXT, value NUMERIC, stage_id UUID,
  contact_id UUID, owner_id UUID, days_in_stage INTEGER, last_stage_change_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT 
    d.id, d.title, d.value, d.stage_id, d.contact_id, COALESCE(d.owner_id, d.user_id),
    EXTRACT(DAY FROM (now() - COALESCE(d.last_stage_change_at, d.created_at)))::INTEGER,
    COALESCE(d.last_stage_change_at, d.created_at)
  FROM public.deals d
  WHERE d.organization_id = _org_id
    AND d.status = 'open'
    AND COALESCE(d.last_stage_change_at, d.created_at) < (now() - (_days || ' days')::interval)
    AND (is_org_member(d.organization_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  ORDER BY COALESCE(d.last_stage_change_at, d.created_at) ASC;
$$;

-- =========================================
-- 9. STAGE AVERAGE TIME FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.get_stage_avg_time(_org_id UUID)
RETURNS TABLE (stage_id UUID, avg_seconds NUMERIC, deals_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT from_stage_id, AVG(duration_seconds)::NUMERIC, COUNT(*)
  FROM public.deal_stage_history
  WHERE organization_id = _org_id AND from_stage_id IS NOT NULL AND duration_seconds IS NOT NULL
    AND (is_org_member(_org_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  GROUP BY from_stage_id;
$$;

-- =========================================
-- 10. DUPLICATE DETECTION FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.find_duplicate_contacts(_org_id UUID)
RETURNS TABLE (
  match_type TEXT, key_value TEXT, contact_ids UUID[], names TEXT[], created_dates TIMESTAMPTZ[]
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT 'email'::TEXT, lower(email), array_agg(id ORDER BY created_at), array_agg(first_name||' '||COALESCE(last_name,'')), array_agg(created_at)
  FROM public.contacts
  WHERE organization_id = _org_id AND email IS NOT NULL AND btrim(email) <> ''
    AND (is_org_member(_org_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  GROUP BY lower(email) HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'phone'::TEXT, normalize_br_phone(COALESCE(whatsapp, phone)), array_agg(id ORDER BY created_at), array_agg(first_name||' '||COALESCE(last_name,'')), array_agg(created_at)
  FROM public.contacts
  WHERE organization_id = _org_id AND COALESCE(whatsapp, phone) IS NOT NULL
    AND length(normalize_br_phone(COALESCE(whatsapp, phone))) >= 10
    AND (is_org_member(_org_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
  GROUP BY normalize_br_phone(COALESCE(whatsapp, phone)) HAVING COUNT(*) > 1;
$$;

-- =========================================
-- 11. MERGE CONTACTS FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.merge_contacts(_keep_id UUID, _remove_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_org_id UUID;
  v_keep RECORD;
  v_remove RECORD;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.contacts WHERE id = _keep_id;
  IF v_org_id IS NULL THEN RETURN jsonb_build_object('error','Contato não encontrado'); END IF;
  IF NOT (is_org_member(v_org_id, auth.uid()) OR has_role(auth.uid(),'admin'::app_role)) THEN
    RETURN jsonb_build_object('error','Sem permissão');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = _remove_id AND organization_id = v_org_id) THEN
    RETURN jsonb_build_object('error','Contato duplicado em organização diferente');
  END IF;

  SELECT * INTO v_keep FROM public.contacts WHERE id = _keep_id;
  SELECT * INTO v_remove FROM public.contacts WHERE id = _remove_id;

  -- Merge fields (preferring non-null from keep, fallback to remove)
  UPDATE public.contacts SET
    email = COALESCE(NULLIF(v_keep.email,''), v_remove.email),
    phone = COALESCE(NULLIF(v_keep.phone,''), v_remove.phone),
    whatsapp = COALESCE(NULLIF(v_keep.whatsapp,''), v_remove.whatsapp),
    last_name = COALESCE(NULLIF(v_keep.last_name,''), v_remove.last_name),
    position = COALESCE(NULLIF(v_keep.position,''), v_remove.position),
    company_id = COALESCE(v_keep.company_id, v_remove.company_id),
    notes = CASE WHEN v_keep.notes IS NULL OR v_keep.notes='' THEN v_remove.notes
                 WHEN v_remove.notes IS NULL OR v_remove.notes='' THEN v_keep.notes
                 ELSE v_keep.notes || E'\n---\n' || v_remove.notes END,
    lead_score = GREATEST(COALESCE(v_keep.lead_score,0), COALESCE(v_remove.lead_score,0))
  WHERE id = _keep_id;

  -- Reassign references
  UPDATE public.conversations SET contact_id = _keep_id WHERE contact_id = _remove_id;
  UPDATE public.deals SET contact_id = _keep_id WHERE contact_id = _remove_id;
  UPDATE public.activities SET contact_id = _keep_id WHERE contact_id = _remove_id;
  UPDATE public.tasks SET contact_id = _keep_id WHERE contact_id = _remove_id;
  UPDATE public.form_submissions SET contact_id = _keep_id WHERE contact_id = _remove_id;
  UPDATE public.contact_next_actions SET contact_id = _keep_id WHERE contact_id = _remove_id;
  -- Move tags (avoid conflicts)
  INSERT INTO public.contact_tags (contact_id, tag_id)
    SELECT _keep_id, tag_id FROM public.contact_tags WHERE contact_id = _remove_id
    ON CONFLICT DO NOTHING;
  DELETE FROM public.contact_tags WHERE contact_id = _remove_id;

  DELETE FROM public.contacts WHERE id = _remove_id;
  RETURN jsonb_build_object('success', true, 'kept_id', _keep_id);
END;
$$;