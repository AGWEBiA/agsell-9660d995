
/**
 * Checklist de CI para validação de resiliência do App
 */

export const CI_RESILIENCE_CHECKLIST = {
  "Build Verification": [
    "Verify all environment variables are defined",
    "Run 'npm run build' to check for type errors",
    "Ensure window.__DEPLOY_ID__ is set correctly"
  ],
  "Supabase Resilience": [
    "Verify 'withRetry' is used in critical data fetching",
    "Test app behavior with 'supabase' mock returning 5xx",
    "Ensure 'logSystemError' catches and saves errors to localStorage when offline"
  ],
  "Telemetry Correlation": [
    "Verify Deploy ID is included in all 'system_errors' records",
    "Check if stack traces are being serialized correctly"
  ],
  "Automation Fail-safe": [
    "Verify 'manual_retry_automation_step' RPC is accessible by admin",
    "Test backoff logic in 'process-automation' edge function"
  ]
};

/**
 * Script de teste para simular falhas de rede no console
 * Use no console do navegador para validar o fallback:
 * window.simulateOffline()
 */
export const initDebugTools = () => {
  if (typeof window === 'undefined') return;

  (window as any).simulateOffline = () => {
    console.warn("DEBUG: Simulating network failure for 10 seconds...");
    const originalFetch = window.fetch;
    window.fetch = () => Promise.reject(new Error("Simulated Network Error (Failed to fetch)"));
    
    setTimeout(() => {
      window.fetch = originalFetch;
      console.log("DEBUG: Network restored.");
      window.dispatchEvent(new Event('online'));
    }, 10000);
  };
};
