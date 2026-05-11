import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ;

// Backoff configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

/**
 * Enhanced fetch with retry and backoff for Supabase calls
 */
const fetchWithRetry = async (url: string, options: any, retryCount = 0): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && (response.status === 544 || response.status >= 500) && retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.warn(`Supabase temporary failure (${response.status}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

// Centralized error handling for connectivity issues
const handleSupabaseError = (prop: string | symbol) => {
  return (...args: any[]) => {
    const errorMsg = "Conexão lenta ou indisponível com o servidor. Tentando reconectar...";
    console.error(`[Supabase Proxy Error] Accessing ${String(prop)}:`, errorMsg);
    
    if (typeof window !== 'undefined') {
      toast.error(errorMsg, {
        description: "Verifique sua internet ou aguarde um momento.",
        id: "supabase-offline-toast"
      });
    }
    
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
        fetch: fetchWithRetry,
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
