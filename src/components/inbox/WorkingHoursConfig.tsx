import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface WorkingHours {
  mode: 'always' | 'business_hours' | 'custom';
  timezone: string;
  offlineMessage: string;
  days: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}

const dayLabels: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const defaultHours: WorkingHours = {
  mode: 'business_hours',
  timezone: 'America/Sao_Paulo',
  offlineMessage: 'Nosso horário de atendimento é de segunda a sexta, das 09:00 às 18:00. Deixe sua mensagem que retornaremos assim que possível!',
  days: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' },
  },
};

export function WorkingHoursConfig() {
  const [config, setConfig] = useState<WorkingHours>(defaultHours);

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: { ...prev.days[day as keyof typeof prev.days], [field]: value },
      },
    }));
  };

  const handleSave = () => {
    toast.success('Horário de atendimento salvo com sucesso!');
  };

  const applyToAll = (start: string, end: string) => {
    const updated = { ...config.days };
    (Object.keys(updated) as Array<keyof typeof updated>).forEach(day => {
      updated[day] = { ...updated[day], start, end };
    });
    setConfig(prev => ({ ...prev, days: updated }));
    toast.info('Horário aplicado a todos os dias');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Modo de Atendimento
          </CardTitle>
          <CardDescription>
            Configure quando sua equipe está disponível para atender
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={config.mode} onValueChange={(v) => setConfig(prev => ({ ...prev, mode: v as WorkingHours['mode'] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">24/7 — Sempre online</SelectItem>
                <SelectItem value="business_hours">Horário comercial</SelectItem>
                <SelectItem value="custom">Personalizado por dia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.mode !== 'always' && (
            <>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={config.timezone} onValueChange={(v) => setConfig(prev => ({ ...prev, timezone: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                    <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                    <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                    <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                    <SelectItem value="America/Porto_Velho">Porto Velho (GMT-4)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem fora do horário</Label>
                <Textarea
                  value={config.offlineMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, offlineMessage: e.target.value }))}
                  placeholder="Mensagem exibida fora do horário de atendimento..."
                  className="min-h-20"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {config.mode !== 'always' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Horários por Dia</CardTitle>
                <CardDescription>Configure o horário de atendimento para cada dia da semana</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyToAll('09:00', '18:00')}
              >
                Aplicar 09-18h a todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Object.entries(config.days) as [string, DaySchedule][]).map(([day, schedule]) => (
                <div key={day} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(v) => updateDay(day, 'enabled', v)}
                  />
                  <span className="w-36 font-medium text-sm">
                    {dayLabels[day]}
                  </span>
                  {schedule.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={schedule.start}
                        onChange={(e) => updateDay(day, 'start', e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={schedule.end}
                        onChange={(e) => updateDay(day, 'end', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Horários
        </Button>
      </div>
    </div>
  );
}
