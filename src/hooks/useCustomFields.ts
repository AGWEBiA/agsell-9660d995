import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type EntityType = 'contact' | 'company' | 'deal';
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'url' | 'email';

export interface CustomFieldDef {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  show_in_list: boolean;
  sort_order: number;
}

export interface CustomFieldValue {
  id: string;
  field_id: string;
  entity_id: string;
  entity_type: EntityType;
  value: any;
}

export function useCustomFields(entityType: EntityType) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['custom-fields', currentOrganization?.id, entityType],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('entity_type', entityType)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as CustomFieldDef[];
    },
    enabled: !!currentOrganization,
  });
}

export function useCustomFieldValues(entityType: EntityType, entityId: string | undefined) {
  return useQuery({
    queryKey: ['custom-field-values', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      if (error) throw error;
      return (data || []) as unknown as CustomFieldValue[];
    },
    enabled: !!entityId,
  });
}

export function useUpsertCustomFieldValue() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async (params: { fieldId: string; entityType: EntityType; entityId: string; value: any }) => {
      if (!currentOrganization) throw new Error('Organização não selecionada');
      const { error } = await supabase
        .from('custom_field_values')
        .upsert({
          field_id: params.fieldId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          value: params.value,
          organization_id: currentOrganization.id,
        }, { onConflict: 'field_id,entity_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-field-values', vars.entityType, vars.entityId] });
    },
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async (def: Omit<CustomFieldDef, 'id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Sem organização');
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert({ ...def, organization_id: currentOrganization.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Campo customizado criado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_field_definitions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Campo removido');
    },
  });
}
