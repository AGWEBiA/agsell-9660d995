import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LandingPage {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  content: any[];
  settings: Record<string, unknown>;
  custom_css: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  visits_count: number;
  conversions_count: number;
  conversion_rate: number;
  form_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useLandingPages() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['landing-pages', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LandingPage[];
    },
    enabled: !!orgId,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (page: Partial<LandingPage>) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          ...page,
          organization_id: currentOrganization!.id,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing page criada!');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LandingPage> & { id: string }) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing page atualizada!');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing page excluída!');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}
