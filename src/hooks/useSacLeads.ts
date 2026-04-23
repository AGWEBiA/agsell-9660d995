import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SacLead {
  contact_id: string;
  first_name: string;
  last_name: string | null;
  source: string | null;
  phone: string | null;
  whatsapp: string | null;
  lead_score: number | null;
  channel: string;
  conversation_id: string;
  last_message_at: string | null;
  last_message_content: string | null;
}

/**
 * Returns recent SAC contacts (from conversations) that don't have any deal yet.
 * Used in Pipeline to surface qualified leads ready for conversion.
 */
export function useSacLeadsWithoutDeal(limit = 25) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['sac_leads_no_deal', orgId, limit],
    enabled: !!orgId,
    queryFn: async (): Promise<SacLead[]> => {
      // Step 1: contacts that already have a deal — exclude them
      const { data: dealsWithContact } = await supabase
        .from('deals')
        .select('contact_id')
        .eq('organization_id', orgId!)
        .not('contact_id', 'is', null);

      const contactsWithDeal = new Set(
        (dealsWithContact || []).map((d) => d.contact_id).filter(Boolean) as string[]
      );

      // Step 2: recent conversations from SAC channels
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          id,
          channel,
          last_message_at,
          contact:contacts!inner(id, first_name, last_name, source, phone, whatsapp, lead_score)
        `)
        .eq('organization_id', orgId!)
        .not('contact_id', 'is', null)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(limit * 3); // overfetch — many will be filtered out

      if (error) throw error;

      // Step 3: dedupe per contact (keep most recent), filter out those with deals
      const seenContacts = new Set<string>();
      const filtered = (convs || [])
        .filter((c: any) => c.contact && !contactsWithDeal.has(c.contact.id))
        .filter((c: any) => {
          if (seenContacts.has(c.contact.id)) return false;
          seenContacts.add(c.contact.id);
          return true;
        })
        .slice(0, limit);

      if (filtered.length === 0) return [];

      // Step 4: fetch last inbound message for each conversation
      const convIds = filtered.map((c: any) => c.id);
      const { data: messages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_type')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const lastMsgByConv = new Map<string, { content: string; created_at: string }>();
      (messages || []).forEach((m: any) => {
        if (!lastMsgByConv.has(m.conversation_id)) {
          lastMsgByConv.set(m.conversation_id, { content: m.content, created_at: m.created_at });
        }
      });

      return filtered.map((c: any): SacLead => ({
        contact_id: c.contact.id,
        first_name: c.contact.first_name,
        last_name: c.contact.last_name,
        source: c.contact.source,
        phone: c.contact.phone,
        whatsapp: c.contact.whatsapp,
        lead_score: c.contact.lead_score,
        channel: c.channel,
        conversation_id: c.id,
        last_message_at: c.last_message_at,
        last_message_content: lastMsgByConv.get(c.id)?.content || null,
      }));
    },
    staleTime: 30_000,
  });
}

/**
 * Fetches the latest SAC conversation snippet for a given contact (used in deal cards).
 */
export function useContactLastSacMessage(contactId: string | null | undefined) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['contact_last_sac_msg', contactId, orgId],
    enabled: !!contactId && !!orgId,
    queryFn: async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, channel, last_message_at')
        .eq('organization_id', orgId!)
        .eq('contact_id', contactId!)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (!conv) return null;

      const { data: msg } = await supabase
        .from('messages')
        .select('content, created_at, sender_type')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        conversation_id: conv.id,
        channel: conv.channel,
        last_message_at: conv.last_message_at,
        content: msg?.content || null,
        sender_type: msg?.sender_type || null,
      };
    },
    staleTime: 60_000,
  });
}
