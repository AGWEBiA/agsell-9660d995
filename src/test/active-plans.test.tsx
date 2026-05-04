import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Pricing from '@/pages/Pricing';
import { VendasPlansBox } from '@/components/vendas/VendasPlansBox';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockPlans = [
  {
    id: '1',
    name: 'Active Plan',
    slug: 'active',
    is_active: true,
    price_monthly: 100,
    price_yearly: 1000,
    features: ['feature1'],
  },
  {
    id: '2',
    name: 'Inactive Plan',
    slug: 'inactive',
    is_active: false,
    price_monthly: 200,
    price_yearly: 2000,
    features: ['feature2'],
  },
];

describe('Active Plans Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only show active plans on the Pricing page', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // Check if active plan is visible
    expect(await screen.findByText('Active Plan')).toBeInTheDocument();

    // Check if inactive plan is NOT visible
    expect(screen.queryByText('Inactive Plan')).not.toBeInTheDocument();
  });

  it('should only show active plans in VendasPlansBox', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <VendasPlansBox />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // Check if active plan is visible
    expect(await screen.findByText('Active Plan')).toBeInTheDocument();

    // Check if inactive plan is NOT visible
    expect(screen.queryByText('Inactive Plan')).not.toBeInTheDocument();
  });
});
