import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ContactPreference {
  id: string;
  contact_id: string;
  organization_id: string;
  channel: string;
  opted_out: boolean;
  opted_out_at: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactPreferences(contactId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contact-preferences', contactId, orgId],
    queryFn: async () => {
      let q = supabase.from('contact_preferences').select('*');
      if (contactId) q = q.eq('contact_id', contactId);
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q.order('channel');
      if (error) throw error;
      return data as ContactPreference[];
    },
    enabled: !!orgId,
  });

  const toggleOptOut = useMutation({
    mutationFn: async ({ contactId, channel, optedOut }: { contactId: string; channel: string; optedOut: boolean }) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data, error } = await supabase
        .from('contact_preferences')
        .upsert({
          contact_id: contactId,
          organization_id: orgId,
          channel,
          opted_out: optedOut,
          opted_out_at: optedOut ? new Date().toISOString() : null,
        } as any, { onConflict: 'contact_id,channel' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-preferences'] });
      toast.success('Preferência atualizada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const bulkOptOut = useMutation({
    mutationFn: async ({ contactIds, channel, optedOut }: { contactIds: string[]; channel: string; optedOut: boolean }) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const records = contactIds.map(cid => ({
        contact_id: cid,
        organization_id: orgId,
        channel,
        opted_out: optedOut,
        opted_out_at: optedOut ? new Date().toISOString() : null,
      }));
      const { error } = await supabase.from('contact_preferences').upsert(records as any[], { onConflict: 'contact_id,channel' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-preferences'] });
      toast.success('Preferências atualizadas em massa!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  return { preferences: query.data ?? [], isLoading: query.isLoading, toggleOptOut, bulkOptOut };
}
