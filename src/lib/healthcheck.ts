import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Healthcheck function to verify deployment and DB connectivity
export const healthCheck = async () => {
  try {
    if (!supabase) {
      return { status: 'error', message: 'Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY ausentes no build.' };
    }
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
};
