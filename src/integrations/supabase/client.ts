import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing! Site may not function correctly.");
}

// Fallback to a proxy if variables are missing to prevent top-level crash
// and provide a descriptive error when used.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'auth') {
           return new Proxy({}, {
             get: () => () => { throw new Error("Supabase environment variables (URL/Key) are missing. Check your project configuration."); }
           });
        }
        return () => { throw new Error("Supabase environment variables (URL/Key) are missing. Check your project configuration."); };
      }
    }) as any;
