import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface PredictiveProfile {
  id: string;
  contact_id: string;
  best_hour_email: number | null;
  best_day_email: number | null;
  best_hour_whatsapp: number | null;
  best_day_whatsapp: number | null;
  engagement_score: number;
  sample_size: number;
  last_calculated_at: string | null;
}

export function usePredictiveProfiles(contactId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['predictive-profiles', orgId, contactId],
    queryFn: async () => {
      let q = supabase
        .from('predictive_send_profiles')
        .select('*')
        .eq('organization_id', orgId!);
      if (contactId) q = q.eq('contact_id', contactId);
      q = q.order('engagement_score', { ascending: false }).limit(100);
      const { data, error } = await q;
      if (error) throw error;
      return data as PredictiveProfile[];
    },
    enabled: !!orgId,
  });
}

export function getBestSendTime(profile: PredictiveProfile | undefined, channel: 'email' | 'whatsapp'): string {
  if (!profile) return 'Sem dados suficientes';
  const hour = channel === 'email' ? profile.best_hour_email : profile.best_hour_whatsapp;
  const day = channel === 'email' ? profile.best_day_email : profile.best_day_whatsapp;
  if (hour === null || day === null) return 'Sem dados suficientes';
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `${days[day]} às ${String(hour).padStart(2, '0')}:00`;
}
