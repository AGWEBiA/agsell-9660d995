import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface EmailMailbox {
  id: string;
  organization_id: string;
  domain_id: string;
  name: string;
  prefix: string;
  logo_url: string | null;
  link_facebook: string | null;
  link_instagram: string | null;
  link_youtube: string | null;
  link_whatsapp: string | null;
  link_telegram: string | null;
  signature: string | null;
  address: string | null;
  is_active: boolean;
  warmup_status: string;
  daily_limit: number | null;
  sent_today: number | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  domain?: string;
}

export function useEmailMailboxes(domainId?: string) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const { data: mailboxes = [], isLoading } = useQuery({
    queryKey: ['email_mailboxes', orgId, domainId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('email_mailboxes' as any)
        .select('*, email_domains!inner(domain)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        domain: m.email_domains?.domain,
      }));
    },
    enabled: !!orgId,
  });

  // All mailboxes across all domains (for selectors)
  const { data: allMailboxes = [] } = useQuery({
    queryKey: ['email_mailboxes_all', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('email_mailboxes' as any)
        .select('*, email_domains!inner(domain)')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        domain: m.email_domains?.domain,
        from_email: `${m.prefix}@${m.email_domains?.domain}`,
      }));
    },
    enabled: !!orgId,
  });

  const createMailbox = useMutation({
    mutationFn: async (data: {
      domain_id: string;
      name: string;
      prefix: string;
      link_facebook?: string;
      link_instagram?: string;
      link_youtube?: string;
      link_whatsapp?: string;
      link_telegram?: string;
      signature?: string;
      address?: string;
    }) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data: result, error } = await supabase
        .from('email_mailboxes' as any)
        .insert({ ...data, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes_all'] });
      toast.success('Caixa postal criada!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate key')) {
        toast.error('Este prefixo já está em uso neste domínio.');
      } else {
        toast.error('Erro ao criar caixa postal: ' + error.message);
      }
    },
  });

  const updateMailbox = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmailMailbox> & { id: string }) => {
      const { error } = await supabase
        .from('email_mailboxes' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes_all'] });
      toast.success('Caixa postal atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteMailbox = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_mailboxes' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['email_mailboxes_all'] });
      toast.success('Caixa postal removida.');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  return {
    mailboxes,
    allMailboxes,
    isLoading,
    createMailbox,
    updateMailbox,
    deleteMailbox,
  };
}
