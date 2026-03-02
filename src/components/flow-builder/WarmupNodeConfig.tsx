import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar } from 'lucide-react';
import { WEEKDAYS } from './flowNodeTypes';

interface WarmupNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function WarmupNodeConfig({ config, onChange }: WarmupNodeConfigProps) {
  const selectedDays = (config.selected_days as string[]) || WEEKDAYS.map(d => d.key);
  const leadsPerMinute = Number(config.leads_per_minute) || 1;

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    onChange({ ...config, selected_days: newDays });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Aquecimento</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A etapa Aquecimento serve para limitar a quantidade de leads que passará para a próxima etapa a cada 1 minuto. Número máximo de liberações por minuto é 300 leads.
        </p>

        <div className="space-y-2">
          <Label className="font-semibold">Liberações por minuto</Label>
          <p className="text-xs text-muted-foreground">A quantidade de leads que serão liberados por minuto para a próxima etapa</p>
          <Input
            type="number"
            min={1}
            max={300}
            value={leadsPerMinute}
            onChange={e => onChange({ ...config, leads_per_minute: Math.min(300, Math.max(1, parseInt(e.target.value) || 1)) })}
          />
          <p className="text-xs text-muted-foreground">{300 - leadsPerMinute} restantes</p>
        </div>
      </div>

      {/* Time interval */}
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Determinar um intervalo de tempo?</span>
          </div>
          <Switch
            checked={!!config.has_time_interval}
            onCheckedChange={v => onChange({ ...config, has_time_interval: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">O aquecimento vai ser utilizado entre os horários de início e fim.</p>
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

      {/* Weekday selection */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Selecionar os dias da semana?</span>
          </div>
          <Switch
            checked={!!config.has_weekday_filter}
            onCheckedChange={v => onChange({ ...config, has_weekday_filter: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Determine quais dias da semana o aquecimento vai ser acionado, por padrão funciona todos os dias.</p>
        {config.has_weekday_filter && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {WEEKDAYS.map(day => (
              <Badge
                key={day.key}
                variant={selectedDays.includes(day.key) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleDay(day.key)}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
