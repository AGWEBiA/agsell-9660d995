import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), data: [], error: null }), data: [], error: null }) }),
    auth: { getUser: vi.fn(), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), subscribe: vi.fn() }),
  },
}));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-1' } }),
}));

const hookPaths = [
  '@/hooks/useContactPreferences',
  '@/hooks/useFlowNodeAnalytics',
  '@/hooks/useContacts',
  '@/hooks/useAutomations',
  '@/hooks/useTags',
  '@/hooks/useContactTags',
  '@/hooks/usePipeline',
  '@/hooks/useInbox',
  '@/hooks/useEmailCampaigns',
  '@/hooks/useWhatsAppCampaigns',
  '@/hooks/useWhatsAppGroups',
  '@/hooks/useForms',
  '@/hooks/useAnalytics',
  '@/hooks/useLeadScoring',
  '@/hooks/useGamification',
  '@/hooks/useSms',
  '@/hooks/useVoip',
  '@/hooks/useGroupRotator',
  '@/hooks/usePaidGroups',
];

describe('Hooks Imports', () => {
  for (const path of hookPaths) {
    it(`${path} exports correctly`, async () => {
      const mod = await import(path);
      const exports = Object.keys(mod);
      expect(exports.length).toBeGreaterThan(0);
    });
  }
});
