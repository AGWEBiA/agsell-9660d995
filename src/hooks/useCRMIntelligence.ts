import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface RottingDeal {
  deal_id: string;
  title: string;
  value: number;
  stage_id: string;
  contact_id: string | null;
  owner_id: string | null;
  days_in_stage: number;
  last_stage_change_at: string;
}

export function useRottingDeals(days: number = 14) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['rotting-deals', currentOrganization?.id, days],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase.rpc('get_rotting_deals', { _org_id: currentOrganization.id, _days: days });
      if (error) throw error;
      return (data || []) as unknown as RottingDeal[];
    },
    enabled: !!currentOrganization,
  });
}

export function useStageAvgTime() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['stage-avg-time', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase.rpc('get_stage_avg_time', { _org_id: currentOrganization.id });
      if (error) throw error;
      return (data || []) as Array<{ stage_id: string; avg_seconds: number; deals_count: number }>;
    },
    enabled: !!currentOrganization,
  });
}

export function useForecast(start: string, end: string, userId?: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['forecast', currentOrganization?.id, start, end, userId],
    queryFn: async () => {
      if (!currentOrganization) return null;
      const { data, error } = await supabase.rpc('calculate_forecast', {
        _org_id: currentOrganization.id, _start: start, _end: end, _user_id: userId ?? null,
      });
      if (error) throw error;
      return data as any;
    },
    enabled: !!currentOrganization,
  });
}

export function useRevenueGoals() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['revenue-goals', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase.from('revenue_goals').select('*')
        .eq('organization_id', currentOrganization.id).order('period_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization,
  });
}

export function useCreateRevenueGoal() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async (input: { period_start: string; period_end: string; target_amount: number; user_id?: string | null; notes?: string }) => {
      if (!currentOrganization) throw new Error('Sem organização');
      const { error } = await supabase.from('revenue_goals').insert({ ...input, organization_id: currentOrganization.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['revenue-goals'] }); qc.invalidateQueries({ queryKey: ['forecast'] }); toast.success('Meta criada'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRevenueGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revenue_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['revenue-goals'] }); qc.invalidateQueries({ queryKey: ['forecast'] }); toast.success('Meta removida'); },
  });
}

// Duplicates
export interface DuplicateGroup {
  match_type: 'email' | 'phone';
  key_value: string;
  contact_ids: string[];
  names: string[];
  created_dates: string[];
}

export function useDuplicateContacts() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['duplicate-contacts', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase.rpc('find_duplicate_contacts', { _org_id: currentOrganization.id });
      if (error) throw error;
      return (data || []) as unknown as DuplicateGroup[];
    },
    enabled: !!currentOrganization,
  });
}

export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { keepId: string; removeId: string }) => {
      const { data, error } = await supabase.rpc('merge_contacts', { _keep_id: params.keepId, _remove_id: params.removeId });
      if (error) throw error;
      const result = data as any;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['duplicate-contacts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contatos mesclados');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Deal stage history
export function useDealStageHistory(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-stage-history', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase.from('deal_stage_history').select('*')
        .eq('deal_id', dealId).order('changed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!dealId,
  });
}

// Next Best Action
export interface NextAction {
  id: string;
  contact_id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string | null;
  channel: string | null;
  status: 'pending' | 'done' | 'dismissed' | 'snoozed';
  created_at: string;
}

export function useNextActions(contactId?: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['next-actions', currentOrganization?.id, contactId],
    queryFn: async () => {
      if (!currentOrganization) return [];
      let q = supabase.from('contact_next_actions').select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as NextAction[];
    },
    enabled: !!currentOrganization,
  });
}

export function useGenerateNextAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase.functions.invoke('crm-next-action', { body: { contact_id: contactId } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['next-actions'] }); toast.success('Sugestão gerada com IA'); },
    onError: (e: Error) => toast.error(`Falha IA: ${e.message}`),
  });
}

export function useUpdateNextAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: NextAction['status'] }) => {
      const { error } = await supabase.from('contact_next_actions').update({
        status: params.status, done_at: params.status === 'done' ? new Date().toISOString() : null,
      }).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['next-actions'] }),
  });
}
