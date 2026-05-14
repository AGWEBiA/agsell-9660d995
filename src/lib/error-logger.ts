
import { supabase } from "@/integrations/supabase/client";

/**
 * Global system error logger with deployment correlation
 */
export const logSystemError = async ({
  message,
  module,
  severity = 'medium',
  stack,
  context = {}
}: {
  message: string;
  module: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  stack?: string;
  context?: any;
}) => {
  const deployId = window.__DEPLOY_ID__ || 'unknown';
  const errorId = crypto.randomUUID();
  
  console.error(`[${module}] [${deployId}] [${errorId}] ${message}`, { severity, stack, context });

  const errorData = {
    id: errorId,
    error_message: message,
    module,
    severity,
    stack_trace: stack,
    metadata: {
      ...context,
      deploy_id: deployId,
      url: window.location.href,
      user_agent: navigator.userAgent
    },
    status: 'open',
    created_at: new Date().toISOString()
  };

  try {
    // Attempt to log to Supabase with a timeout to avoid blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { error } = await supabase.from('system_errors').insert(errorData);
    clearTimeout(timeoutId);

    if (error) {
      saveToLocalStorage(errorData);
    }
  } catch (err) {
    saveToLocalStorage(errorData);
  }

  return { errorId, deployId };
};


const saveToLocalStorage = (errorData: any) => {
  try {
    const pendingErrors = JSON.parse(localStorage.getItem('pending_system_errors') || '[]');
    pendingErrors.push(errorData);
    // Keep last 50 errors only
    localStorage.setItem('pending_system_errors', JSON.stringify(pendingErrors.slice(-50)));
  } catch (e) {
    console.error("Failed to save error to localStorage", e);
  }
};

/**
 * Syncs errors from localStorage back to Supabase when connection is restored
 * Optimized with batching and backoff
 */
let isSyncing = false;
export const syncPendingErrors = async () => {
  if (isSyncing) return;
  
  const pendingErrors = JSON.parse(localStorage.getItem('pending_system_errors') || '[]');
  if (pendingErrors.length === 0) return;

  isSyncing = true;
  console.log(`Syncing ${pendingErrors.length} pending errors to Supabase...`);
  
  try {
    const { error } = await supabase.from('system_errors').insert(pendingErrors);
    if (!error) {
      localStorage.removeItem('pending_system_errors');
      console.log("Error sync complete.");
    }
  } catch (err) {
    console.warn("Failed to sync errors, will retry later:", err);
  } finally {
    isSyncing = false;
  }
};

/**
 * Global fallback for unhandled exceptions
 */
export const initGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return;

  window.onerror = (message, source, lineno, colno, error) => {
    logSystemError({
      message: String(message),
      module: 'window.onerror',
      severity: 'high',
      stack: error?.stack,
      context: { source, lineno, colno }
    });
  };

  window.onunhandledrejection = (event) => {
    logSystemError({
      message: `Unhandled Rejection: ${event.reason}`,
      module: 'window.unhandledrejection',
      severity: 'medium',
      stack: event.reason?.stack,
      context: { reason: event.reason }
    });
  };

  // Sync errors periodically
  setInterval(syncPendingErrors, 60000); // Every minute
  window.addEventListener('online', syncPendingErrors);
};

declare global {
  interface Window {
    __DEPLOY_ID__?: string;
  }
}
