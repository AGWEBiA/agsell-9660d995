import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ConversationNote {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useConversationNotes(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversation-notes', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('conversation_notes')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ConversationNote[];
    },
    enabled: !!conversationId,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) throw new Error('Sem contexto');
      const { data, error } = await supabase
        .from('conversation_notes')
        .insert({ conversation_id: conversationId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      toast.success('Nota adicionada!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conversation_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
    },
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    addNote,
    deleteNote,
  };
}
