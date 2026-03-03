import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface QuickReply {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export function useQuickReplies() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const query = useQuery({
    queryKey: ['quick-replies', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data as QuickReply[];
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { title: string; content: string; category?: string; shortcut?: string }) => {
      if (!orgId || !user?.id) throw new Error('Sem organização');
      const { data, error } = await supabase
        .from('quick_replies')
        .insert({
          organization_id: orgId,
          created_by: user.id,
          title: input.title,
          content: input.content,
          category: input.category || null,
          shortcut: input.shortcut || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast.success('Resposta rápida criada!');
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quick_replies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast.success('Resposta rápida removida!');
    },
    onError: (e) => toast.error(e.message),
  });

  return {
    replies: query.data ?? [],
    isLoading: query.isLoading,
    create,
    remove,
  };
}
