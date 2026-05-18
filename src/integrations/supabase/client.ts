import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

// Use the internal Lovable project for Edge Functions even if the data is external
// Internal Project Ref: rcxrkvwxlzwzrllwdwgz
const INTERNAL_FUNCTIONS_URL = "https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'lovable',
    },
  },
});

// Create a separate client or override the functions property
// Actually, supabase-js allows overriding the functions URL in the constructor
export const supabaseWithInternalFunctions = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  functions: {
    url: INTERNAL_FUNCTIONS_URL,
  }
});

// Replace the default export to use internal functions
// This ensures that when the app calls supabase.functions.invoke, it hits the Lovable project
(supabase as any).functions.url = INTERNAL_FUNCTIONS_URL;
