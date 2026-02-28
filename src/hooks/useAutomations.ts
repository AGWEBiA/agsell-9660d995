import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Automation = Tables<'automations'>;
type AutomationInsert = TablesInsert<'automations'>;
type AutomationUpdate = TablesUpdate<'automations'>;

export function useAutomations() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const automationsQuery = useQuery({
    queryKey: ['automations', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const query = supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (currentOrganization?.id) {
        query.eq('organization_id', currentOrganization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Automation[];
    },
    enabled: !!user?.id,
  });

  const createAutomation = useMutation({
    mutationFn: async (automation: Omit<AutomationInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('automations')
        .insert({ 
          ...automation, 
          user_id: user.id,
          organization_id: currentOrganization?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar automação: ' + error.message);
    },
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: AutomationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('automations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar automação: ' + error.message);
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir automação: ' + error.message);
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('automations')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success(data.is_active ? 'Automação ativada!' : 'Automação pausada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar automação: ' + error.message);
    },
  });

  return {
    automations: automationsQuery.data ?? [],
    isLoading: automationsQuery.isLoading,
    error: automationsQuery.error,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
  };
}
