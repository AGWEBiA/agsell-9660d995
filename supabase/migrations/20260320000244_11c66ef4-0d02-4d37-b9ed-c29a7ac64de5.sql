-- Allow authenticated users to read only the evolution_api config status (not the full key)
-- We create a security definer function that returns only is_configured boolean
CREATE OR REPLACE FUNCTION public.is_evolution_api_configured()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (value->>'is_configured')::boolean, 
    false
  )
  FROM public.platform_settings
  WHERE key = 'evolution_api'
  LIMIT 1
$$;