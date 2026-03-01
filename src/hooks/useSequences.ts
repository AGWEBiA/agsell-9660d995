import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Sequence {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  channel: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  status: string;
  enrolled_count: number;
  completed_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  action_type: string;
  delay_minutes: number;
  content: Record<string, unknown>;
  condition_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
  status: string;
  next_step_at: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useSequences() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['sequences', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Sequence[];
    },
    enabled: !!orgId,
  });
}

export function useSequenceSteps(sequenceId?: string) {
  return useQuery({
    queryKey: ['sequence_steps', sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId!)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return data as unknown as SequenceStep[];
    },
    enabled: !!sequenceId,
  });
}

export function useSequenceEnrollments(sequenceId?: string) {
  return useQuery({
    queryKey: ['sequence_enrollments', sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as SequenceEnrollment[];
    },
    enabled: !!sequenceId,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sequence: Partial<Sequence>) => {
      const { data, error } = await supabase
        .from('sequences')
        .insert({
          ...sequence,
          organization_id: currentOrganization!.id,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast({ title: 'Sequência criada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sequence> & { id: string }) => {
      const { data, error } = await supabase
        .from('sequences')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast({ title: 'Sequência atualizada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast({ title: 'Sequência excluída' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateSequenceStep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (step: Partial<SequenceStep>) => {
      const { data, error } = await supabase
        .from('sequence_steps')
        .insert(step as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps'] });
      toast({ title: 'Etapa adicionada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSequenceStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sequence_steps').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps'] });
    },
  });
}
