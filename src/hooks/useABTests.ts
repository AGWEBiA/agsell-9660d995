import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ABTest {
  id: string;
  organization_id: string;
  name: string;
  channel: string;
  variant_a: { message: string; subject?: string };
  variant_b: { message: string; subject?: string };
  sent_a: number;
  sent_b: number;
  responses_a: number;
  responses_b: number;
  conversion_a: number;
  conversion_b: number;
  status: string;
  winner: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useABTests() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['ab_tests', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ABTest[];
    },
    enabled: !!orgId,
  });
}

export function useCreateABTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (test: Partial<ABTest>) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          ...test,
          organization_id: currentOrganization!.id,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab_tests'] });
      toast({ title: 'Teste A/B criado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateABTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab_tests'] });
      toast({ title: 'Teste atualizado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteABTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ab_tests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab_tests'] });
      toast({ title: 'Teste excluído' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}
