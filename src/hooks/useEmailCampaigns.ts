import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EmailCampaign = Tables<'email_campaigns'>;
type EmailCampaignInsert = TablesInsert<'email_campaigns'>;
type EmailCampaignUpdate = TablesUpdate<'email_campaigns'>;

export function useEmailCampaigns() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
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
        .insert({ ...campaign, user_id: user.id, organization_id: currentOrganization?.id || null })
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

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get campaign details
      const { data: campaign, error: fetchError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (fetchError || !campaign) throw new Error('Campanha não encontrada');

      // Get contacts with email
      const query = supabase
        .from('contacts')
        .select('email, first_name')
        .eq('user_id', user.id)
        .not('email', 'is', null);
      if (currentOrganization?.id) {
        query.eq('organization_id', currentOrganization.id);
      }
      const { data: contacts, error: contactsError } = await query;
      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) throw new Error('Nenhum contato com email encontrado');

      // Update status to sending
      await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaignId);

      let sentCount = 0;
      let failCount = 0;
      const htmlContent = campaign.content || `<p>${campaign.subject}</p>`;

      for (const contact of contacts) {
        try {
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              organization_id: currentOrganization?.id || null,
              to: contact.email,
              subject: campaign.subject || campaign.name,
              html: htmlContent.replace(/\{\{nome\}\}/g, contact.first_name || ''),
            },
          });
          if (error || data?.error) {
            failCount++;
          } else {
            sentCount++;
          }
        } catch {
          failCount++;
        }
      }

      // Update campaign stats
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_count: sentCount,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return { sentCount, failCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.success(`Campanha enviada! ${data.sentCount} emails enviados, ${data.failCount} falhas.`);
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.error('Erro ao enviar campanha: ' + error.message);
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
  };
}
