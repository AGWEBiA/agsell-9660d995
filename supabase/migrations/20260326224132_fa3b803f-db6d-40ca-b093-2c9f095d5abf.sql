
-- ============================================================
-- FIX 1: Instagram tokens - restrict base table SELECT to service role only
-- The client already uses instagram_accounts_safe view
-- ============================================================

-- Drop existing SELECT policy that exposes tokens
DROP POLICY IF EXISTS "Admins can view instagram accounts" ON public.instagram_accounts;

-- Drop ALL policy (which includes SELECT) and replace with specific INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can manage instagram accounts" ON public.instagram_accounts;

-- Org admins can INSERT instagram accounts
CREATE POLICY "Org admins can insert instagram accounts"
  ON public.instagram_accounts FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Org admins can UPDATE instagram accounts
CREATE POLICY "Org admins can update instagram accounts"
  ON public.instagram_accounts FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id, auth.uid()));

-- Org admins can DELETE instagram accounts
CREATE POLICY "Org admins can delete instagram accounts"
  ON public.instagram_accounts FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id, auth.uid()));

-- Global admins can manage all (for admin panel)
CREATE POLICY "Global admins manage instagram accounts"
  ON public.instagram_accounts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- FIX 2: paid_groups_config - create safe RPC for reading config
-- Keep write policies, restrict SELECT to exclude api_key
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view paid_groups_config" ON public.paid_groups_config;
DROP POLICY IF EXISTS "Org admins manage paid_groups_config" ON public.paid_groups_config;

-- Org admins can INSERT/UPDATE/DELETE (write operations)
CREATE POLICY "Org admins can write paid_groups_config"
  ON public.paid_groups_config FOR ALL
  TO authenticated
  USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Create safe RPC that returns config WITHOUT the api key in plain text
CREATE OR REPLACE FUNCTION public.get_paid_groups_config_safe(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only org admins or global admins can access
  IF NOT (is_org_admin(_org_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', id,
    'organization_id', organization_id,
    'evolution_api_url', evolution_api_url,
    'evolution_api_key_set', (evolution_api_key IS NOT NULL AND evolution_api_key != ''),
    'evolution_api_key_masked', CASE 
      WHEN evolution_api_key IS NOT NULL AND length(evolution_api_key) > 8 
      THEN left(evolution_api_key, 4) || '****' || right(evolution_api_key, 4)
      WHEN evolution_api_key IS NOT NULL 
      THEN '****'
      ELSE NULL 
    END,
    'webhook_secret', webhook_secret,
    'is_active', is_active,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM public.paid_groups_config
  WHERE organization_id = _org_id
  LIMIT 1;

  RETURN result;
END;
$$;

-- ============================================================
-- FIX 3: user_gamification - restrict to SELECT only for users
-- ============================================================

-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Users can manage their own gamification" ON public.user_gamification;

-- Users can only VIEW their own gamification data
CREATE POLICY "Users can view own gamification"
  ON public.user_gamification FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
