import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type LeadScoringRule = Tables<'lead_scoring_rules'>;
type LeadScoringRuleInsert = TablesInsert<'lead_scoring_rules'>;
type LeadScoringRuleUpdate = TablesUpdate<'lead_scoring_rules'>;

export function useLeadScoring() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ['lead_scoring_rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadScoringRule[];
    },
    enabled: !!user?.id,
  });

  const segmentsQuery = useQuery({
    queryKey: ['lead_segments', user?.id],
    queryFn: async () => {
      if (!user?.id) return { cold: 0, warm: 0, hot: 0 };
      const { data, error } = await supabase
        .from('contacts')
        .select('lead_score')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const cold = data.filter(c => (c.lead_score ?? 0) <= 30).length;
      const warm = data.filter(c => (c.lead_score ?? 0) > 30 && (c.lead_score ?? 0) <= 70).length;
      const hot = data.filter(c => (c.lead_score ?? 0) > 70).length;
      
      return { cold, warm, hot };
    },
    enabled: !!user?.id,
  });

  const topLeadsQuery = useQuery({
    queryKey: ['top_leads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, lead_score, companies(name)')
        .eq('user_id', user.id)
        .order('lead_score', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<LeadScoringRuleInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .insert({ ...rule, user_id: user.id, organization_id: currentOrganization?.id || null })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_scoring_rules'] });
      toast.success('Regra criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar regra: ' + error.message);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: LeadScoringRuleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_scoring_rules'] });
      toast.success('Regra atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar regra: ' + error.message);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_scoring_rules'] });
      toast.success('Regra excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir regra: ' + error.message);
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead_scoring_rules'] });
      toast.success(data.is_active ? 'Regra ativada!' : 'Regra desativada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar regra: ' + error.message);
    },
  });

  return {
    rules: rulesQuery.data ?? [],
    segments: segmentsQuery.data ?? { cold: 0, warm: 0, hot: 0 },
    topLeads: topLeadsQuery.data ?? [],
    isLoading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
