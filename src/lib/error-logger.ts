
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
  
  console.error(`[${module}] ${message}`, { severity, deployId, stack, context });

  try {
    // Attempt to log to Supabase, but don't crash if it fails (resilience)
    const { error } = await supabase.from('system_errors').insert({
      error_message: message,
      module,
      severity,
      stack_trace: stack,
      user_context: {
        ...context,
        deploy_id: deployId,
        url: window.location.href,
        user_agent: navigator.userAgent
      },
      status: 'open'
    });

    if (error) {
      // If DB is down, we at least have it in console and potentially local storage for later sync
      const pendingErrors = JSON.parse(localStorage.getItem('pending_system_errors') || '[]');
      pendingErrors.push({ message, module, severity, stack, timestamp: new Date().toISOString() });
      localStorage.setItem('pending_system_errors', JSON.stringify(pendingErrors.slice(-10)));
    }
  } catch (err) {
    console.warn("Failed to log system error to Supabase:", err);
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
};

declare global {
  interface Window {
    __DEPLOY_ID__?: string;
  }
}
