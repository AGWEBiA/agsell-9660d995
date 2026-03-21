import { describe, it, expect } from 'vitest';

// Verify all route paths are importable (no broken imports)
const pagePaths = [
  '@/pages/ChatbotBuilder',
  '@/pages/FunnelPlanner',
  '@/pages/FunnelBI',
  '@/pages/AutomationMetrics',
  '@/pages/LandingPages',
  '@/pages/ContactPreferences',
  '@/pages/FlowBuilder',
  '@/pages/Dashboard',
  '@/pages/Contacts',
  '@/pages/Pipeline',
  '@/pages/Inbox',
  '@/pages/Email',
  '@/pages/WhatsApp',
  '@/pages/Automations',
  '@/pages/Forms',
  '@/pages/Analytics',
  '@/pages/Settings',
  '@/pages/Admin',
  '@/pages/Login',
  '@/pages/Register',
  '@/pages/Pricing',
  '@/pages/GroupRotator',
  '@/pages/PaidGroups',
  '@/pages/VoIP',
  '@/pages/SMSMarketing',
];

describe('Route Imports', () => {
  for (const path of pagePaths) {
    it(`${path} is importable`, async () => {
      const mod = await import(path);
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe('function');
    });
  }
});
