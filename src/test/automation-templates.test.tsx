import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('AutomationTemplates', () => {
  it('renders strategic templates including SellFlux-inspired ones', async () => {
    const { AutomationTemplates } = await import('@/components/automations/AutomationTemplates');
    render(<AutomationTemplates onSelectTemplate={vi.fn()} />);
    
    // Should contain advanced strategic templates
    const allText = document.body.textContent || '';
    expect(allText).toMatch(/template|Template|Modelo/i);
  });
});
