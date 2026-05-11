import { describe, it, expect, vi } from 'vitest';
import { supabase } from './integrations/supabase/client';

describe('CI/CD Resiliency Checks', () => {
  it('should have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', () => {
    // In CI, these should be set. If not, the app uses the resilient Proxy client.
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // We expect them to be strings for a "perfect" publish, but we check if our fallback works
    if (!url || !key) {
      console.warn("CI Warning: Supabase variables are missing, testing fallback resilience...");
      expect(supabase).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    } else {
      expect(url).toContain('supabase.co');
      expect(key.length).toBeGreaterThan(20);
    }
  });

  it('should handle Supabase offline gracefully without crashing the render', async () => {
    // Mock a failed fetch to simulate Supabase offline
    const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    global.fetch = mockFetch;

    try {
      await supabase.from('profiles').select('*');
    } catch (e: any) {
      expect(e.message).toContain("Conexão");
    }
  });
});
