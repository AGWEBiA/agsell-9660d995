import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', email: 'test@test.com' }, loading: false, isAdmin: false }),
}));
vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-1', name: 'Test Org' }, organizations: [] }),
}));
vi.mock('@/contexts/PermissionsContext', () => ({
  usePermissions: () => ({ hasPermission: () => true, hasFeature: () => true }),
}));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/contexts/AdminViewContext', () => ({
  useAdminView: () => ({ isAdminView: false }),
}));
vi.mock('@/hooks/useSubscriptionStatus', () => ({
  useSubscriptionStatus: () => ({ isBlocked: false, isLoading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), data: [], error: null }), data: [], error: null }), insert: vi.fn(), upsert: vi.fn() }),
    auth: { getUser: vi.fn(), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), subscribe: vi.fn() }),
    functions: { invoke: vi.fn() },
  },
}));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useAutomations', () => ({
  useAutomations: () => ({ automations: [], isLoading: false, createAutomation: { mutateAsync: vi.fn() }, updateAutomation: { mutateAsync: vi.fn() }, deleteAutomation: { mutateAsync: vi.fn() } }),
}));
vi.mock('@/hooks/useLandingPages', () => ({
  useLandingPages: () => ({ data: [], isLoading: false }),
  useCreateLandingPage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateLandingPage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLandingPage: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/useContactPreferences', () => ({
  useContactPreferences: () => ({ preferences: [], isLoading: false, toggleOptOut: { mutateAsync: vi.fn() }, bulkOptOut: { mutateAsync: vi.fn() } }),
}));
vi.mock('@/hooks/useFlowNodeAnalytics', () => ({
  useFlowNodeAnalytics: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/useForms', () => ({
  useForms: () => ({ forms: [], isLoading: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useParams: () => ({}),
  };
});
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />, XAxis: () => <div />, YAxis: () => <div />,
  CartesianGrid: () => <div />, Tooltip: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />, Cell: () => <div />, LabelList: () => <div />,
  FunnelChart: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />, AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />, Legend: () => <div />,
}));

const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');

function renderPage(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// ──────────── Chatbot Builder ────────────
describe('ChatbotBuilder Page', () => {
  it('renders correctly', async () => {
    const C = (await import('@/pages/ChatbotBuilder')).default;
    renderPage(<C />);
    expect(screen.getByText('Chatbot Builder')).toBeInTheDocument();
  });
  it('shows empty state', async () => {
    const C = (await import('@/pages/ChatbotBuilder')).default;
    renderPage(<C />);
    expect(screen.getByText(/Nenhum chatbot criado/i)).toBeInTheDocument();
  });
});

// ──────────── Funnel Planner ────────────
describe('FunnelPlanner Page', () => {
  it('renders correctly', async () => {
    const C = (await import('@/pages/FunnelPlanner')).default;
    renderPage(<C />);
    expect(screen.getByText('Planejador de Funil')).toBeInTheDocument();
  });
});

// ──────────── Funnel BI ────────────
describe('FunnelBI Page', () => {
  it('renders BI dashboard', async () => {
    const C = (await import('@/pages/FunnelBI')).default;
    renderPage(<C />);
    expect(screen.getByText('Funil BI')).toBeInTheDocument();
  });
  it('shows channel data', async () => {
    const C = (await import('@/pages/FunnelBI')).default;
    renderPage(<C />);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
  });
});

// ──────────── Automation Metrics ────────────
describe('AutomationMetrics Page', () => {
  it('renders metrics', async () => {
    const C = (await import('@/pages/AutomationMetrics')).default;
    renderPage(<C />);
    expect(screen.getByText(/Métricas de Automação/i)).toBeInTheDocument();
  });
});

// ──────────── Landing Pages ────────────
describe('LandingPages Page', () => {
  it('renders landing pages', async () => {
    const C = (await import('@/pages/LandingPages')).default;
    renderPage(<C />);
    expect(screen.getByText('Landing Pages')).toBeInTheDocument();
  });
});

// ──────────── Contact Preferences ────────────
describe('ContactPreferences Page', () => {
  it('renders preferences interface', async () => {
    const C = (await import('@/pages/ContactPreferences')).default;
    renderPage(<C />);
    expect(screen.getByText(/Preferências de Comunicação/i)).toBeInTheDocument();
  });
  it('shows all channels', async () => {
    const C = (await import('@/pages/ContactPreferences')).default;
    renderPage(<C />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});

// ──────────── Flow Builder ────────────
describe('FlowBuilder Page', () => {
  it('renders flow builder', async () => {
    const C = (await import('@/pages/FlowBuilder')).default;
    renderPage(<C />);
    expect(screen.getByText(/Campanhas/i)).toBeInTheDocument();
  });
});
