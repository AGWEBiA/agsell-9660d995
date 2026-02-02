import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DashboardStats {
  totalContacts: number;
  contactsGrowth: number;
  totalDealsValue: number;
  dealsGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface LeadsByMonth {
  month: string;
  leads: number;
}

export interface DealsByStage {
  name: string;
  value: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  created_at: string;
}

export interface TopLead {
  id: string;
  name: string;
  score: number;
  company: string | null;
  status: 'hot' | 'warm' | 'cold';
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Contacts last month
      const { count: lastMonthContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      // Contacts this month
      const { count: thisMonthContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString());

      const contactsGrowth = lastMonthContacts && lastMonthContacts > 0
        ? Math.round(((thisMonthContacts || 0) - lastMonthContacts) / lastMonthContacts * 100)
        : 0;

      // Total deals value (open deals)
      const { data: deals } = await supabase
        .from('deals')
        .select('value, status')
        .eq('status', 'open');

      const totalDealsValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      // Last month deals
      const { data: lastMonthDeals } = await supabase
        .from('deals')
        .select('value')
        .eq('status', 'open')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const lastMonthDealsValue = lastMonthDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const dealsGrowth = lastMonthDealsValue > 0
        ? Math.round((totalDealsValue - lastMonthDealsValue) / lastMonthDealsValue * 100)
        : 0;

      // Conversion rate
      const { count: wonDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won');

      const { count: allDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      const conversionRate = allDeals && allDeals > 0
        ? Math.round((wonDeals || 0) / allDeals * 100 * 10) / 10
        : 0;

      // Tasks
      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: tasksPending } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed');

      return {
        totalContacts: totalContacts || 0,
        contactsGrowth,
        totalDealsValue,
        dealsGrowth,
        conversionRate,
        conversionGrowth: 0,
        tasksCompleted: tasksCompleted || 0,
        tasksPending: tasksPending || 0,
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}

export function useLeadsByMonth() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads-by-month', user?.id],
    queryFn: async (): Promise<LeadsByMonth[]> => {
      const months: LeadsByMonth[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        months.push({
          month: format(date, 'MMM'),
          leads: count || 0,
        });
      }

      return months;
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
}

export function useDealsByStage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals-by-stage', user?.id],
    queryFn: async (): Promise<DealsByStage[]> => {
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, name, color')
        .order('position');

      if (!stages) return [];

      const result: DealsByStage[] = [];

      for (const stage of stages) {
        const { count } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('stage_id', stage.id)
          .eq('status', 'open');

        result.push({
          name: stage.name,
          value: count || 0,
          color: stage.color || '#3b82f6',
        });
      }

      return result;
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useRecentActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      const { data } = await supabase
        .from('activities')
        .select('id, activity_type, title, description, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return (data || []).map((a) => ({
        id: a.id,
        type: a.activity_type,
        message: a.title,
        time: a.created_at,
        created_at: a.created_at,
      }));
    },
    enabled: !!user,
    staleTime: 15000,
  });
}

export function useTopLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-leads', user?.id],
    queryFn: async (): Promise<TopLead[]> => {
      const { data } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          lead_score,
          company:companies(name)
        `)
        .not('lead_score', 'is', null)
        .order('lead_score', { ascending: false })
        .limit(5);

      return (data || []).map((c) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name || ''}`.trim(),
        score: c.lead_score || 0,
        company: c.company?.name || null,
        status: (c.lead_score || 0) >= 80 ? 'hot' : (c.lead_score || 0) >= 50 ? 'warm' : 'cold',
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });
}
