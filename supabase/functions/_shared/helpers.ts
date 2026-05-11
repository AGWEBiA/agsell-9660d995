// Shared Edge Function utilities
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export function createErrorResponse(message: string, status = 400, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createSuccessResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function validateAuth(req: Request): Promise<{ userId: string; token: string } | Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return createErrorResponse('Missing authorization header', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return createErrorResponse('Invalid or expired token', 401);
  }
  
  return { userId: user.id, token };
}

/**
 * Handles standardized healthchecks and health reporting
 */
export async function handleHealthCheck(req: Request, functionName: string): Promise<Response | null> {
  const bodyText = await req.clone().text();
  let parsedBody: any = {};
  try {
    parsedBody = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    // Not JSON, ignore
  }

  if (parsedBody?.action === 'ping' || req.url.endsWith('/health')) {
    const deployId = Deno.env.get('DENO_DEPLOYMENT_ID') || 'local-dev';
    
    // Attempt to report health to DB if client is provided or env vars exist
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('edge_function_health').upsert({
          function_name: functionName,
          status: 'ok',
          last_execution_at: new Date().toISOString(),
          last_deploy_id: deployId,
        }, { onConflict: 'function_name' });
      }
    } catch (e: any) {
      console.error(`[HEALTHCHECK] Failed to report to DB:`, e);
    }

    return createSuccessResponse({
      status: 'ok',
      function: functionName,
      timestamp: new Date().toISOString(),
      deploy_id: deployId,
      version: 'v1.1'
    });
  }
  return null;
}

export function validateRequiredFields(body: Record<string, unknown>, fields: string[]): string | null {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

export function rateLimitCheck(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const store = (globalThis as any).__rateLimits = (globalThis as any).__rateLimits || {};
  
  if (!store[key]) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  
  if (now > store[key].resetAt) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  
  store[key].count++;
  return store[key].count <= maxRequests;
}

