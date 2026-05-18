import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

// Use the internal Lovable project for Edge Functions even if the data is external
// Internal Project Ref: gmemxbfibakfpsjbsvyt
const INTERNAL_FUNCTIONS_URL = "https://gmemxbfibakfpsjbsvyt.supabase.co/functions/v1";

// Create the main client with the internal functions URL configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  functions: {
    url: INTERNAL_FUNCTIONS_URL,
  },
  global: {
    headers: {
      'x-client-info': 'lovable',
    },
  },
});
