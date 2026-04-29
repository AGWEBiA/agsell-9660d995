import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { useRottingDeals, useStageAvgTime } from '@/hooks/useCRMIntelligence';
import { usePipelineStages } from '@/hooks/usePipeline';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export function RottingDealsPanel() {
  const [days, setDays] = useState(14);
  const { data: rotting = [], isLoading } = useRottingDeals(days);
  const { data: avgTimes = [] } = useStageAvgTime();
  const { data: stages = [] } = usePipelineStages();

  const stageName = (id: string | null) =>
    stages.find((s) => s.id === id)?.name || '—';

  const totalValue = rotting.reduce((acc, d) => acc + Number(d.value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Deals Parados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rotting.length}</div>
            <p className="text-xs text-muted-foreground">há mais de {days} dias sem mudança</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> Valor em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Limiar (dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value) || 14)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deals Parados (Rotting)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : rotting.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum deal parado. Ótimo trabalho! 🎉</p>
          ) : (
            <div className="space-y-2">
              {rotting.map((d) => (
                <div key={d.deal_id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/40">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {stageName(d.stage_id)} • {fmt(Number(d.value || 0))}
                    </div>
                  </div>
                  <Badge variant="destructive">{d.days_in_stage} dias</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          {avgTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
          ) : (
            <div className="space-y-2">
              {avgTimes.map((s) => (
                <div key={s.stage_id} className="flex items-center justify-between text-sm">
                  <span>{stageName(s.stage_id)}</span>
                  <Badge variant="outline">
                    {(Number(s.avg_seconds) / 86400).toFixed(1)} dias • {s.deals_count} deals
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
