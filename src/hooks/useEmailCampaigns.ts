import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EmailCampaign = Tables<'email_campaigns'>;
type EmailCampaignInsert = TablesInsert<'email_campaigns'>;
type EmailCampaignUpdate = TablesUpdate<'email_campaigns'>;

export function useEmailCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['email_campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailCampaign[];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<EmailCampaignInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({ ...campaign, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar campanha: ' + error.message);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: EmailCampaignUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.success('Campanha atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar campanha: ' + error.message);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.success('Campanha excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir campanha: ' + error.message);
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
