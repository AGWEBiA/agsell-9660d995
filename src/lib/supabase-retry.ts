
import { supabase } from "@/integrations/supabase/client";
import { logSystemError } from "@/lib/error-logger";

/**
 * Executes a Supabase query with automatic retry and exponential backoff
 */
export async function withRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    module: string;
    onRetry?: (attempt: number, error: any) => void;
  }
): Promise<{ data: T | null; error: any }> {
  const { maxAttempts = 3, baseDelay = 1000, module, onRetry } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await queryFn();
      if (!result.error) return result;
      
      lastError = result.error;
      
      // Don't retry if it's not a network/connection error
      if (lastError.message && !isNetworkError(lastError)) {
        break;
      }

    } catch (err: any) {
      lastError = err;
    }

    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (onRetry) onRetry(attempt, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Final failure: Log the system error
  logSystemError({
    message: `Supabase Connection Failure: ${lastError?.message || 'Unknown error'}`,
    module,
    severity: 'high',
    context: { lastError, attempts: maxAttempts }
  });

  return { data: null, error: lastError };
}

function isNetworkError(error: any): boolean {
  const msg = error.message?.toLowerCase() || '';
  return (
    msg.includes('fetch') || 
    msg.includes('network') || 
    msg.includes('timeout') || 
    msg.includes('connection terminated') ||
    msg.includes('failed to fetch')
  );
}

/**
 * Simple UI helper for user-friendly error messages
 */
export const getFriendlyErrorMessage = (error: any) => {
  if (isNetworkError(error)) {
    return "Instabilidade na conexão detectada. Estamos tentando reconectar automaticamente...";
  }
  return "Ocorreu um erro inesperado. Por favor, tente novamente em instantes.";
};
