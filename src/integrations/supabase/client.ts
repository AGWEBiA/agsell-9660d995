import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

// Backoff configuration
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

/**
 * Enhanced fetch with retry and backoff for Supabase calls
 */
const fetchWithRetry = async (url: string, options: any, retryCount = 0): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && (response.status === 544 || response.status >= 500) && retryCount < MAX_RETRIES) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 15000);
      console.warn(`Supabase temporary failure (${response.status}). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 15000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

// Centralized error handling for connectivity issues
const handleSupabaseError = (prop: string | symbol) => {
  const errorMsg = "Conexão com Lovable Cloud indisponível. Verifique suas configurações.";
  if (typeof window !== 'undefined') {
    toast.error(errorMsg, {
      id: "supabase-offline-toast"
    });
  }
  return Promise.reject(new Error(errorMsg));
};

// Recursive Proxy to handle chained Supabase calls gracefully when offline/misconfigured
const createRecursiveProxy = (path: string = ''): any => {
  const proxy: any = new Proxy(() => proxy, {
    get: (_t, prop) => {
      if (prop === 'then') {
        // Handle as a promise when awaited
        return (resolve: any, reject: any) => {
          handleSupabaseError(path).then(resolve).catch(reject);
        };
      }
      if (typeof prop === 'symbol') return undefined;
      return createRecursiveProxy(path ? `${path}.${prop}` : prop);
    },
    apply: (_t, _thisArg, _args) => {
      return proxy;
    }
  });
  return proxy;
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
  : createRecursiveProxy('supabase');
