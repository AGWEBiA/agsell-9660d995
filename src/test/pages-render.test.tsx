import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock all contexts and hooks used across pages
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', email: 'test@test.com' }, loading: false, isAdmin: false }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-1', name: 'Test Org' }, organizations: [] }),
  OrganizationProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/contexts/PermissionsContext', () => ({
  usePermissions: () => ({ hasPermission: () => true, hasFeature: () => true }),
  PermissionsProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/contexts/AdminViewContext', () => ({
  useAdminView: () => ({ isAdminView: false }),
  AdminViewProvider: ({ children }: any) => <>{children}</>,
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

// Recharts mock to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  LabelList: () => <div />,
  FunnelChart: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  Legend: () => <div />,
}));

const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// ──────────── 1. Chatbot Builder ────────────
describe('ChatbotBuilder Page', () => {
  it('renders the chatbot builder interface', async () => {
    const ChatbotBuilder = (await import('@/pages/ChatbotBuilder')).default;
    renderWithProviders(<ChatbotBuilder />);
    expect(screen.getByText(/Construtor de Chatbot/i)).toBeInTheDocument();
  });

  it('shows node type options for adding', async () => {
    const ChatbotBuilder = (await import('@/pages/ChatbotBuilder')).default;
    renderWithProviders(<ChatbotBuilder />);
    expect(screen.getByText(/Regras/i)).toBeInTheDocument();
  });
});

// ──────────── 2. Funnel Planner ────────────
describe('FunnelPlanner Page', () => {
  it('renders the funnel planner canvas', async () => {
    const FunnelPlanner = (await import('@/pages/FunnelPlanner')).default;
    renderWithProviders(<FunnelPlanner />);
    expect(screen.getByText(/Planejador de Funis/i)).toBeInTheDocument();
  });
});

// ──────────── 3. Funnel BI ────────────
describe('FunnelBI Page', () => {
  it('renders BI dashboard with metrics', async () => {
    const FunnelBI = (await import('@/pages/FunnelBI')).default;
    renderWithProviders(<FunnelBI />);
    expect(screen.getByText(/Funil BI/i)).toBeInTheDocument();
  });

  it('shows channel performance data', async () => {
    const FunnelBI = (await import('@/pages/FunnelBI')).default;
    renderWithProviders(<FunnelBI />);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
  });
});

// ──────────── 4. Automation Metrics ────────────
describe('AutomationMetrics Page', () => {
  it('renders granular metrics per step', async () => {
    const AutomationMetrics = (await import('@/pages/AutomationMetrics')).default;
    renderWithProviders(<AutomationMetrics />);
    expect(screen.getByText(/Métricas de Automação/i)).toBeInTheDocument();
  });

  it('shows channel summary cards', async () => {
    const AutomationMetrics = (await import('@/pages/AutomationMetrics')).default;
    renderWithProviders(<AutomationMetrics />);
    expect(screen.getByText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/SMS/i)).toBeInTheDocument();
  });
});

// ──────────── 5. Landing Pages ────────────
describe('LandingPages Page', () => {
  it('renders the landing pages builder', async () => {
    const LandingPages = (await import('@/pages/LandingPages')).default;
    renderWithProviders(<LandingPages />);
    expect(screen.getByText(/Landing Pages/i)).toBeInTheDocument();
  });
});

// ──────────── 6. Contact Preferences (Granular Unsubscribe) ────────────
describe('ContactPreferences Page', () => {
  it('renders channel-specific opt-out interface', async () => {
    const ContactPreferences = (await import('@/pages/ContactPreferences')).default;
    renderWithProviders(<ContactPreferences />);
    expect(screen.getByText(/Preferências de Comunicação/i)).toBeInTheDocument();
  });

  it('shows all channels (email, whatsapp, sms)', async () => {
    const ContactPreferences = (await import('@/pages/ContactPreferences')).default;
    renderWithProviders(<ContactPreferences />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});

// ──────────── 7. Flow Builder ────────────
describe('FlowBuilder Page', () => {
  it('renders the flow builder canvas', async () => {
    const FlowBuilder = (await import('@/pages/FlowBuilder')).default;
    renderWithProviders(<FlowBuilder />);
    expect(screen.getByText(/Campanhas/i)).toBeInTheDocument();
  });
});
