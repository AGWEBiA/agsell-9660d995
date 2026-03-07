import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SiteEvent {
  id: string;
  organization_id: string;
  contact_id: string | null;
  visitor_id: string | null;
  event_name: string;
  event_data: Record<string, unknown>;
  page_url: string | null;
  referrer: string | null;
  created_at: string;
}

export function useSiteEvents(filters?: { eventName?: string; contactId?: string; limit?: number }) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['site-events', orgId, filters],
    queryFn: async () => {
      let q = supabase
        .from('site_events')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 200);

      if (filters?.eventName) q = q.eq('event_name', filters.eventName);
      if (filters?.contactId) q = q.eq('contact_id', filters.contactId);

      const { data, error } = await q;
      if (error) throw error;
      return data as SiteEvent[];
    },
    enabled: !!orgId,
  });
}

export function useSiteEventStats() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['site-event-stats', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_events')
        .select('event_name, created_at')
        .eq('organization_id', orgId!)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const byEvent: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      (data ?? []).forEach((e: any) => {
        byEvent[e.event_name] = (byEvent[e.event_name] || 0) + 1;
        const day = e.created_at.substring(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      });

      return { totalEvents: data?.length ?? 0, byEvent, byDay, uniqueEvents: Object.keys(byEvent).length };
    },
    enabled: !!orgId,
  });
}
