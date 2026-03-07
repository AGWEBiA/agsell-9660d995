import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface Touchpoint {
  id: string;
  organization_id: string;
  contact_id: string | null;
  deal_id: string | null;
  channel: string;
  source: string | null;
  medium: string | null;
  campaign_name: string | null;
  touchpoint_type: string;
  revenue_attributed: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useAttribution() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['attribution', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribution_touchpoints')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Touchpoint[];
    },
    enabled: !!orgId,
  });

  const addTouchpoint = useMutation({
    mutationFn: async (tp: Partial<Touchpoint>) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data, error } = await supabase
        .from('attribution_touchpoints')
        .insert({ ...tp, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attribution'] }),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const stats = useQuery({
    queryKey: ['attribution-stats', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribution_touchpoints')
        .select('channel, source, medium, revenue_attributed, touchpoint_type')
        .eq('organization_id', orgId!)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;

      const byChannel: Record<string, { count: number; revenue: number }> = {};
      const bySource: Record<string, { count: number; revenue: number }> = {};
      (data ?? []).forEach((tp: any) => {
        if (!byChannel[tp.channel]) byChannel[tp.channel] = { count: 0, revenue: 0 };
        byChannel[tp.channel].count++;
        byChannel[tp.channel].revenue += Number(tp.revenue_attributed) || 0;

        const src = tp.source || 'direto';
        if (!bySource[src]) bySource[src] = { count: 0, revenue: 0 };
        bySource[src].count++;
        bySource[src].revenue += Number(tp.revenue_attributed) || 0;
      });

      return { total: data?.length ?? 0, byChannel, bySource };
    },
    enabled: !!orgId,
  });

  return { touchpoints: query.data ?? [], isLoading: query.isLoading, addTouchpoint, stats: stats.data };
}
