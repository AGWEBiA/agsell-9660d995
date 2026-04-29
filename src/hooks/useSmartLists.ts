import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SmartListEntity = 'contact' | 'company' | 'deal';

export interface SmartListFilter {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'starts' | 'is_null' | 'not_null' | 'in';
  value?: any;
}

export interface SmartList {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  entity_type: SmartListEntity;
  filters: SmartListFilter[];
  is_shared: boolean;
  icon: string | null;
  color: string | null;
  pinned: boolean;
  sort_order: number;
}

export function useSmartLists(entity?: SmartListEntity) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['smart-lists', currentOrganization?.id, entity],
    queryFn: async () => {
      if (!currentOrganization) return [];
      let q = supabase.from('smart_lists').select('*').eq('organization_id', currentOrganization.id);
      if (entity) q = q.eq('entity_type', entity);
      const { data, error } = await q.order('pinned', { ascending: false }).order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as SmartList[];
    },
    enabled: !!currentOrganization,
  });
}

export function useCreateSmartList() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<SmartList, 'id' | 'organization_id' | 'user_id'>) => {
      if (!currentOrganization || !user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('smart_lists')
        .insert({ ...input, filters: input.filters as any, organization_id: currentOrganization.id, user_id: user.id })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-lists'] }); toast.success('Lista inteligente criada'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSmartList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('smart_lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-lists'] }); toast.success('Lista removida'); },
  });
}

// Apply filters in memory (simple, predictable, supports custom fields after enrichment)
export function applySmartListFilters<T extends Record<string, any>>(items: T[], filters: SmartListFilter[]): T[] {
  if (!filters?.length) return items;
  return items.filter(item =>
    filters.every(f => {
      const v = item[f.field];
      switch (f.op) {
        case 'eq': return v == f.value;
        case 'neq': return v != f.value;
        case 'gt': return Number(v) > Number(f.value);
        case 'gte': return Number(v) >= Number(f.value);
        case 'lt': return Number(v) < Number(f.value);
        case 'lte': return Number(v) <= Number(f.value);
        case 'contains': return String(v ?? '').toLowerCase().includes(String(f.value ?? '').toLowerCase());
        case 'starts': return String(v ?? '').toLowerCase().startsWith(String(f.value ?? '').toLowerCase());
        case 'is_null': return v == null || v === '';
        case 'not_null': return v != null && v !== '';
        case 'in': return Array.isArray(f.value) && f.value.includes(v);
        default: return true;
      }
    })
  );
}
