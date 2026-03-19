import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Info, Clock, AlertCircle } from 'lucide-react';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';

interface InstagramNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  type: 'dm' | 'comment_reply';
}

export function InstagramNodeConfig({ config, onChange, type }: InstagramNodeConfigProps) {
  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  return (
    <div className="space-y-5">
      {/* Variables hint */}
      <div className="rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-pink-600" />
          <span className="text-sm font-medium text-pink-700 dark:text-pink-400">Variáveis Automáticas</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Use variáveis para personalizar a mensagem com dados do contato.
        </p>
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
          <Label>{type === 'dm' ? 'Mensagem da DM' : 'Resposta ao Comentário'}</Label>
          <span className="text-xs text-muted-foreground">
            {String(config.message || '').length}/1000
          </span>
        </div>
        <Textarea
          placeholder={type === 'dm' ? 'Digite a mensagem que será enviada por DM...' : 'Digite a resposta ao comentário...'}
          rows={5}
          maxLength={1000}
          value={String(config.message || '')}
          onChange={e => onChange({ ...config, message: e.target.value })}
        />
      </div>

      {/* Meta 24h window warning */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Janela de 24h do Meta</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {type === 'dm'
            ? 'DMs só podem ser enviadas para usuários que interagiram com sua conta nas últimas 24 horas.'
            : 'Respostas automáticas a comentários são enviadas como DM ao autor do comentário.'}
        </p>
      </div>

      {/* Time interval */}
      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-400">Agendar intervalo de envio?</span>
          </div>
          <Switch
            checked={!!config.has_time_interval}
            onCheckedChange={v => onChange({ ...config, has_time_interval: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Enviar mensagens somente no intervalo de horário definido.</p>
        {config.has_time_interval && (
          <div className="flex gap-3 mt-3">
            <Input
              type="time"
              value={String(config.interval_start || '08:00')}
              onChange={e => onChange({ ...config, interval_start: e.target.value })}
            />
            <Input
              type="time"
              value={String(config.interval_end || '22:00')}
              onChange={e => onChange({ ...config, interval_end: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
