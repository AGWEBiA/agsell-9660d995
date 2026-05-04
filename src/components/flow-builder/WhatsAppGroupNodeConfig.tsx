import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Users, MessageSquare } from 'lucide-react';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';

interface WhatsAppGroupNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface GroupOption {
  id: string;
  name: string;
  external_group_id: string | null;
  member_count: number;
}

export function WhatsAppGroupNodeConfig({ config, onChange }: WhatsAppGroupNodeConfigProps) {
  const { currentOrganization } = useOrganization();
  const { activeInstances } = useWhatsAppInstances();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    supabase
      .from('whatsapp_groups')
      .select('id, name, external_group_id, member_count')
      .eq('organization_id', currentOrganization.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setGroups((data as GroupOption[]) || []);
        setIsLoading(false);
      });
  }, [currentOrganization?.id]);

  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  const selectedGroup = groups.find(g => g.id === config.group_id);

  return (
    <div className="space-y-6">
      {/* Group selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Grupo Alvo
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
        <p className="text-xs text-muted-foreground">
          Selecione o grupo que receberá a mensagem.
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
        <p className="text-xs text-muted-foreground">Dispositivo que enviará a mensagem no grupo</p>
      </div>

      {/* Variables hint */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Variáveis Disponíveis</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map(v => (
            <Badge
              key={v.key}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
              onClick={() => insertVariable(v.key)}
            >
              {v.key}
            </Badge>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Mensagem
          </Label>
          <span className="text-xs text-muted-foreground">
            {String(config.message || '').length}/500
          </span>
        </div>
        <Textarea
          placeholder="Digite a mensagem que será enviada nos grupos..."
          rows={5}
          maxLength={500}
          value={String(config.message || '')}
          onChange={e => onChange({ ...config, message: e.target.value })}
        />
      </div>

      {selectedGroup && !selectedGroup.external_group_id && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Este grupo não possui JID externo. Ele precisa ser criado ou importado do WhatsApp para que o disparo funcione.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

