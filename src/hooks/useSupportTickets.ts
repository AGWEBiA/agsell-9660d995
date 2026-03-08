import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  organization_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  parent_ticket_id: string | null;
  assigned_to: string | null;
  created_by: string;
  protocol_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  sla_hours: number | null;
  sla_deadline_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  contacts?: { id: string; first_name: string; last_name: string | null; email: string | null; phone: string | null } | null;
  sub_tickets?: SupportTicket[];
  assigned_profile?: { full_name: string } | null;
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  note_type: string;
  created_at: string;
  profile_name?: string;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const ticketsQuery = useQuery({
    queryKey: ['support-tickets', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .select(`
          *,
          contacts (id, first_name, last_name, email, phone)
        `)
        .eq('organization_id', orgId)
        .is('parent_ticket_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch sub-tickets
      const { data: subTickets } = await supabase
        .from('support_tickets' as any)
        .select('*')
        .eq('organization_id', orgId)
        .not('parent_ticket_id', 'is', null);

      // Fetch assigned profiles
      const allAssigned = new Set<string>();
      (data as any[])?.forEach((t: any) => { if (t.assigned_to) allAssigned.add(t.assigned_to); });
      (subTickets as any[])?.forEach((t: any) => { if (t.assigned_to) allAssigned.add(t.assigned_to); });

      let profileMap: Record<string, string> = {};
      if (allAssigned.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(allAssigned));
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }

      return (data as any[])?.map((t: any) => ({
        ...t,
        assigned_profile: t.assigned_to ? { full_name: profileMap[t.assigned_to] || t.assigned_to.slice(0, 8) } : null,
        sub_tickets: (subTickets as any[])?.filter((st: any) => st.parent_ticket_id === t.id).map((st: any) => ({
          ...st,
          assigned_profile: st.assigned_to ? { full_name: profileMap[st.assigned_to] || st.assigned_to.slice(0, 8) } : null,
        })) || [],
      })) as SupportTicket[];
    },
    enabled: !!orgId,
  });

  const createTicket = useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      priority?: string;
      category?: string;
      contact_id?: string | null;
      conversation_id?: string | null;
      parent_ticket_id?: string | null;
      sla_hours?: number;
      is_platform_ticket?: boolean;
    }) => {
      if (!orgId || !user?.id) throw new Error('Sem organização');
      const slaHours = input.sla_hours || 24;
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .insert({
          organization_id: orgId,
          created_by: user.id,
          title: input.title,
          description: input.description || null,
          priority: input.priority || 'medium',
          category: input.category || null,
          contact_id: input.contact_id || null,
          conversation_id: input.conversation_id || null,
          parent_ticket_id: input.parent_ticket_id || null,
          sla_hours: slaHours,
          sla_deadline_at: slaDeadline,
          is_platform_ticket: input.is_platform_ticket || false,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(`Ticket ${data.protocol_number} criado!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      if (updates.status === 'resolved' && !updates.resolved_at) updates.resolved_at = new Date().toISOString();
      if (updates.status === 'closed' && !updates.closed_at) updates.closed_at = new Date().toISOString();
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket atualizado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('support_tickets' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket removido!');
    },
    onError: (e) => toast.error(e.message),
  });

  return {
    tickets: (ticketsQuery.data || []) as SupportTicket[],
    isLoading: ticketsQuery.isLoading,
    createTicket,
    updateTicket,
    deleteTicket,
  };
}

export function useSupportTicketNotes(ticketId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ['support-ticket-notes', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from('support_ticket_notes' as any)
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch profile names
      const userIds = new Set<string>();
      (data as any[])?.forEach((n: any) => userIds.add(n.user_id));
      let profileMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', Array.from(userIds));
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }
      return (data as any[])?.map((n: any) => ({
        ...n,
        profile_name: profileMap[n.user_id] || 'Desconhecido',
      })) as TicketNote[];
    },
    enabled: !!ticketId,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!ticketId || !user?.id) throw new Error('Dados insuficientes');
      const { error } = await supabase.from('support_ticket_notes' as any).insert({
        ticket_id: ticketId,
        user_id: user.id,
        content,
        note_type: 'comment',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-notes', ticketId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('support_ticket_notes' as any).delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-notes', ticketId] });
    },
  });

  return {
    notes: (notesQuery.data || []) as TicketNote[],
    addNote,
    deleteNote,
  };
}
