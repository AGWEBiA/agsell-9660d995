import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  user_id: string;
  organization_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  company_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateActivityData {
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export function useActivities(contactId?: string, dealId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities', contactId, dealId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user && (!!contactId || !!dealId),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      const { data: result, error } = await supabase
        .from('activities')
        .insert([{
          activity_type: data.activity_type,
          title: data.title,
          description: data.description,
          contact_id: data.contact_id,
          deal_id: data.deal_id,
          company_id: data.company_id,
          metadata: (data.metadata || {}) as Record<string, string | number | boolean | null>,
          user_id: user!.id,
          organization_id: currentOrganization?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.contact_id, variables.deal_id] });
    },
    onError: (error) => {
      console.error('Error creating activity:', error);
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Atividade removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover atividade: ' + error.message);
    },
  });
}
