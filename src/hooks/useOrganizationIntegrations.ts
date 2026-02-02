import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type OrganizationIntegration = Tables<'organization_integrations'>;
type OrganizationIntegrationInsert = TablesInsert<'organization_integrations'>;
type OrganizationIntegrationUpdate = TablesUpdate<'organization_integrations'>;

export function useOrganizationIntegrations() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const integrationsQuery = useQuery({
    queryKey: ['organization_integrations', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationIntegration[];
    },
    enabled: !!currentOrganization?.id,
  });

  const upsertIntegration = useMutation({
    mutationFn: async (integration: Omit<OrganizationIntegrationInsert, 'organization_id'>) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('organization_integrations')
        .upsert({
          ...integration,
          organization_id: currentOrganization.id,
        }, {
          onConflict: 'organization_id,integration_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Integração salva com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar integração: ' + error.message);
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: OrganizationIntegrationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Integração atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar integração: ' + error.message);
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success(data.is_active ? 'Integração ativada!' : 'Integração desativada!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar integração: ' + error.message);
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Integração removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover integração: ' + error.message);
    },
  });

  const getIntegration = (type: string) => {
    return integrationsQuery.data?.find(i => i.integration_type === type);
  };

  return {
    integrations: integrationsQuery.data ?? [],
    isLoading: integrationsQuery.isLoading,
    upsertIntegration,
    updateIntegration,
    toggleIntegration,
    deleteIntegration,
    getIntegration,
  };
}
