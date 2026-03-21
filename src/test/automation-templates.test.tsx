import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('AutomationTemplates', () => {
  it('renders templates with strategic options', async () => {
    const { AutomationTemplates } = await import('@/components/automations/AutomationTemplates');
    const { container } = render(<AutomationTemplates onSelectTemplate={vi.fn()} />);
    const text = container.textContent || '';
    // Verify SellFlux-inspired templates are present
    expect(text).toMatch(/Lançamento Meteórico/i);
    expect(text).toMatch(/Webinar/i);
    expect(text).toMatch(/Upsell/i);
    expect(text).toMatch(/Reativação/i);
  });
});
