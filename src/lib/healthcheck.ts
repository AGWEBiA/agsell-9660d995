import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rcxrkvwxlzwzrllwdwgz.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIcmN4cmt2d3hsenN6cmxsd2R3Z3oiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3NDA5NjU1NSwiZXhwIjoyMDg5NjcyNTU1fQ.aat2diT5-nOUUxszbpO9k9iuwpemhK_CgqfX6ZEqT4s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Healthcheck function to verify deployment and DB connectivity
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
};
