import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface SentimentRecord {
  id: string;
  organization_id: string;
  message_id: string | null;
  conversation_id: string | null;
  contact_id: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[] | null;
  summary: string | null;
  analyzed_at: string;
}

export function useSentimentAnalysis(conversationId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sentiment', orgId, conversationId],
    queryFn: async () => {
      let q = supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('organization_id', orgId!)
        .order('analyzed_at', { ascending: false });

      if (conversationId) q = q.eq('conversation_id', conversationId);
      else q = q.limit(100);

      const { data, error } = await q;
      if (error) throw error;
      return data as SentimentRecord[];
    },
    enabled: !!orgId,
  });

  const analyzeMessage = useMutation({
    mutationFn: async ({ messageContent, messageId, conversationId, contactId }: {
      messageContent: string; messageId?: string; conversationId?: string; contactId?: string;
    }) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { message: messageContent, message_id: messageId, conversation_id: conversationId, contact_id: contactId, organization_id: orgId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentiment'] });
    },
    onError: (e) => toast.error('Erro na análise: ' + e.message),
  });

  return { sentiments: query.data ?? [], isLoading: query.isLoading, analyzeMessage };
}
