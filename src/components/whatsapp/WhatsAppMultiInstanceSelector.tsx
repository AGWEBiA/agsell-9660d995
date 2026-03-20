import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Server, Smartphone, Star, CheckSquare, Square } from 'lucide-react';
import { useWhatsAppInstances, WhatsAppInstance } from '@/hooks/useWhatsAppInstances';

interface WhatsAppMultiInstanceSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  showLabel?: boolean;
  currentInstanceId?: string | null;
  className?: string;
}

export function WhatsAppMultiInstanceSelector({
  selectedIds,
  onChange,
  label = 'Instâncias de envio',
  showLabel = true,
  currentInstanceId,
  className,
}: WhatsAppMultiInstanceSelectorProps) {
  const { activeInstances, isLoading } = useWhatsAppInstances();

  if (isLoading) {
    return (
      <div className={className}>
        {showLabel && <Label className="text-muted-foreground">Carregando...</Label>}
      </div>
    );
  }

  if (activeInstances.length === 0) {
    return (
      <div className={className}>
        {showLabel && <Label>{label}</Label>}
        <p className="text-sm text-muted-foreground mt-1">Nenhuma instância ativa</p>
      </div>
    );
  }

  const allSelected = activeInstances.every(i => selectedIds.includes(i.id));
  const noneSelected = selectedIds.length === 0;

  const toggleInstance = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange(activeInstances.map(i => i.id));
  const selectNone = () => onChange([]);
  const selectCurrent = () => {
    if (currentInstanceId) onChange([currentInstanceId]);
  };

  const getIcon = (instance: WhatsAppInstance) => {
    if (instance.integration_type === 'whatsapp_business') return <Smartphone className="h-3.5 w-3.5 text-blue-600" />;
    if (instance.config?.own_api_url) return <Server className="h-3.5 w-3.5 text-orange-600" />;
    return <Server className="h-3.5 w-3.5 text-purple-600" />;
  };

  return (
    <div className={className}>
      {showLabel && <Label>{label}</Label>}
      <div className="mt-2 space-y-2">
        {/* Quick actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant={allSelected ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={selectAll}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Todas ({activeInstances.length})
          </Button>
          {currentInstanceId && (
            <Button
              type="button"
              variant={selectedIds.length === 1 && selectedIds[0] === currentInstanceId ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={selectCurrent}
            >
              <Star className="h-3 w-3 mr-1" />
              Selecionada
            </Button>
          )}
          {!noneSelected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={selectNone}
            >
              <Square className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Instance list */}
        <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
          {activeInstances.map((instance) => {
            const isChecked = selectedIds.includes(instance.id);
            const phone = instance.phone_number || (instance.config?.phone_number as string) || '';
            const displayName = phone || instance.name;
            const isCurrent = instance.id === currentInstanceId;

            return (
              <label
                key={instance.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${isChecked ? 'bg-primary/5' : ''}`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleInstance(instance.id)}
                />
                {getIcon(instance)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {phone && instance.name !== phone && (
                    <p className="text-[10px] text-muted-foreground truncate">{instance.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Em uso
                    </Badge>
                  )}
                  {instance.is_default && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {selectedIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedIds.length === activeInstances.length
              ? 'Todas as instâncias selecionadas'
              : `${selectedIds.length} instância(s) selecionada(s)`}
          </p>
        )}
      </div>
    </div>
  );
}
