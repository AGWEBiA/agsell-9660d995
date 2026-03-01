import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface GrowthTool {
  id: string;
  organization_id: string;
  name: string;
  tool_type: string;
  channel: string;
  config: Record<string, unknown>;
  phone_number: string | null;
  prefilled_message: string | null;
  clicks_count: number;
  conversions_count: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useGrowthTools() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['growth_tools', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_tools')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as GrowthTool[];
    },
    enabled: !!orgId,
  });
}

export function useCreateGrowthTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tool: Partial<GrowthTool>) => {
      const { data, error } = await supabase
        .from('growth_tools')
        .insert({
          ...tool,
          organization_id: currentOrganization!.id,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth_tools'] });
      toast({ title: 'Growth Tool criada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateGrowthTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GrowthTool> & { id: string }) => {
      const { data, error } = await supabase
        .from('growth_tools')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth_tools'] });
      toast({ title: 'Growth Tool atualizada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteGrowthTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('growth_tools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth_tools'] });
      toast({ title: 'Growth Tool excluída' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}
