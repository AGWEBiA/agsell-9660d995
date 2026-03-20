import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Users, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';

interface WhatsAppGroupAddNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface GroupOption {
  id: string;
  name: string;
  external_group_id: string | null;
  member_count: number;
  is_active: boolean;
}

export function WhatsAppGroupAddNodeConfig({ config, onChange }: WhatsAppGroupAddNodeConfigProps) {
  const { currentOrganization } = useOrganization();
  const { activeInstances } = useWhatsAppInstances();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    supabase
      .from('whatsapp_groups')
      .select('id, name, external_group_id, member_count, is_active')
      .eq('organization_id', currentOrganization.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setGroups((data as GroupOption[]) || []);
        setIsLoading(false);
      });
  }, [currentOrganization?.id]);

  const selectedGroup = groups.find(g => g.id === config.group_id);

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Adicionar Lead ao Grupo</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Quando esta ação for executada, o contato será adicionado automaticamente ao grupo do WhatsApp selecionado (via Evolution API). O número de WhatsApp do contato será utilizado.
        </p>
      </div>

      {/* Instance selector */}
      <div className="space-y-2">
        <Label>Instância (dispositivo)</Label>
        <Select
          value={String(config.instance_name || '')}
          onValueChange={v => onChange({ ...config, instance_name: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a instância..." />
          </SelectTrigger>
          <SelectContent>
            {activeInstances.map(inst => (
              <SelectItem key={inst.id} value={inst.instance_name || inst.id}>
                {inst.name} {inst.status === 'connected' ? '🟢' : '🔴'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Dispositivo que será usado para adicionar o membro ao grupo</p>
      </div>

      {/* Group selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Grupo de Destino
        </Label>
        <Select
          value={String(config.group_id || '')}
          onValueChange={v => {
            const group = groups.find(g => g.id === v);
            onChange({
              ...config,
              group_id: v,
              group_name: group?.name || '',
              external_group_id: group?.external_group_id || '',
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? 'Carregando grupos...' : 'Selecione o grupo...'} />
          </SelectTrigger>
          <SelectContent>
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} ({g.member_count} membros)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedGroup && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {selectedGroup.name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {selectedGroup.external_group_id ? '✓ Vinculado ao WhatsApp' : '⚠ Sem JID externo'}
          </span>
        </div>
      )}

      {/* Warning if no external_group_id */}
      {selectedGroup && !selectedGroup.external_group_id && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Este grupo não possui JID externo. Ele precisa ser criado ou importado do WhatsApp para que a adição funcione.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
