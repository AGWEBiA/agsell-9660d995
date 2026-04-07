import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';

interface WhatsAppGroupNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function WhatsAppGroupNodeConfig({ config, onChange }: WhatsAppGroupNodeConfigProps) {
  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  return (
    <div className="space-y-5">
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
          <Label>Mensagem para os Grupos</Label>
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
        <p className="text-xs text-muted-foreground">
          Os grupos alvo são definidos pelas tags configuradas no gatilho (nó de entrada).
        </p>
      </div>
    </div>
  );
}
