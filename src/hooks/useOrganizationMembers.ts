import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface OrganizationMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_email?: string;
}

export function useOrganizationMembers() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['organization_members', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          created_at
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for each member
      const memberIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', memberIds);

      // Merge profiles with members
      return data.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.user_id === member.user_id) || null,
      })) as OrganizationMemberWithProfile[];
    },
    enabled: !!currentOrganization?.id,
  });

  const invitesQuery = useQuery({
    queryKey: ['organization_invites', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('organization_invites')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('organization_invites')
        .insert({
          organization_id: currentOrganization.id,
          email,
          role: role as 'owner' | 'admin' | 'member' | 'viewer',
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_invites'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error) => {
      if (error.message.includes('unique')) {
        toast.error('Este email já foi convidado');
      } else {
        toast.error('Erro ao enviar convite: ' + error.message);
      }
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role: role as 'owner' | 'admin' | 'member' | 'viewer' })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_members'] });
      toast.success('Função atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar função: ' + error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_members'] });
      toast.success('Membro removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover membro: ' + error.message);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('organization_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_invites'] });
      toast.success('Convite cancelado!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar convite: ' + error.message);
    },
  });

  return {
    members: membersQuery.data ?? [],
    invites: invitesQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvite,
  };
}
