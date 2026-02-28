import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePlans } from '@/hooks/usePlans';
import { toast } from 'sonner';

export interface AgencyClient {
  id: string;
  agency_org_id: string;
  client_org_id: string;
  status: 'pending' | 'active' | 'revoked';
  access_level: 'owner' | 'operational' | 'viewer';
  invite_token: string | null;
  invite_email: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  client_org?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    plan: string | null;
  } | null;
}

export function useAgencyClients() {
  const { currentOrganization } = useOrganization();
  const { currentPlan } = usePlans();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const isAgencyPlan = currentPlan?.features?.includes('agency_management') ?? false;

  // Fetch clients managed by this agency
  const clientsQuery = useQuery({
    queryKey: ['agency-clients', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('agency_clients')
        .select(`
          *,
          client_org:organizations!agency_clients_client_org_id_fkey(id, name, slug, logo_url, plan)
        `)
        .eq('agency_org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AgencyClient[];
    },
    enabled: !!orgId && isAgencyPlan,
  });

  // Fetch agencies managing the current org (from client perspective)
  const agenciesQuery = useQuery({
    queryKey: ['agency-links', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('agency_clients')
        .select(`
          *,
          agency_org:organizations!agency_clients_agency_org_id_fkey(id, name, slug, logo_url)
        `)
        .eq('client_org_id', orgId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  // Invite a client by email
  const inviteClient = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      if (!orgId) throw new Error('Organização não selecionada');

      // Check if client org exists by looking for the owner's email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('full_name', `%${email}%`);

      // For now, create a pending invite — the client will accept via their settings
      const { data, error } = await supabase
        .from('agency_clients')
        .insert({
          agency_org_id: orgId,
          client_org_id: orgId, // placeholder, will be updated on acceptance
          invite_email: email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-clients', orgId] });
      toast.success('Convite enviado!');
    },
    onError: (error) => toast.error('Erro ao convidar: ' + error.message),
  });

  // Accept agency link (from client side)
  const acceptAgencyLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase
        .from('agency_clients')
        .update({ 
          status: 'active', 
          accepted_at: new Date().toISOString(),
          client_org_id: orgId!,
        })
        .eq('id', linkId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-links', orgId] });
      toast.success('Vínculo com agência aceito!');
    },
    onError: (error) => toast.error('Erro ao aceitar: ' + error.message),
  });

  // Revoke agency link (from client side)
  const revokeAgencyLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase
        .from('agency_clients')
        .update({ status: 'revoked' })
        .eq('id', linkId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-links', orgId] });
      toast.success('Vínculo revogado!');
    },
    onError: (error) => toast.error('Erro ao revogar: ' + error.message),
  });

  // Update access level (from client side)
  const updateAccessLevel = useMutation({
    mutationFn: async ({ linkId, accessLevel }: { linkId: string; accessLevel: string }) => {
      const { data, error } = await supabase
        .from('agency_clients')
        .update({ access_level: accessLevel })
        .eq('id', linkId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-links', orgId] });
      toast.success('Nível de acesso atualizado!');
    },
    onError: (error) => toast.error('Erro ao atualizar: ' + error.message),
  });

  // Remove client (from agency side)
  const removeClient = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('agency_clients')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-clients', orgId] });
      toast.success('Cliente removido!');
    },
    onError: (error) => toast.error('Erro ao remover: ' + error.message),
  });

  return {
    clients: clientsQuery.data ?? [],
    agencies: agenciesQuery.data ?? [],
    isAgencyPlan,
    isLoading: clientsQuery.isLoading,
    inviteClient,
    acceptAgencyLink,
    revokeAgencyLink,
    updateAccessLevel,
    removeClient,
  };
}
