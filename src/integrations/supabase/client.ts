import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

// Centralized error handling for connectivity issues
const handleSupabaseError = (prop: string | symbol) => {
  return (...args: any[]) => {
    const errorMsg = "Conexão com o servidor de dados indisponível (Supabase).";
    console.error(`[Supabase Proxy Error] Accessing ${String(prop)}:`, errorMsg);
    
    // Return a failed promise for async methods to allow frontend catch/fallback
    return Promise.reject(new Error(errorMsg));
  };
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: { 'x-application-name': 'agsell-resilient-client' }
      }
    })
  : new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'auth') {
          return new Proxy({}, {
            get: (_t2, authProp) => {
              if (authProp === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => {} } } });
              return handleSupabaseError(`auth.${String(authProp)}`);
            }
          });
        }
        if (prop === 'from') return () => ({ 
          select: () => ({ order: () => ({ limit: () => Promise.reject(new Error("Supabase Offline")) }) }),
          insert: () => Promise.reject(new Error("Supabase Offline")),
          update: () => Promise.reject(new Error("Supabase Offline")),
          delete: () => Promise.reject(new Error("Supabase Offline"))
        });
        return handleSupabaseError(prop);
      }
    }) as any;
