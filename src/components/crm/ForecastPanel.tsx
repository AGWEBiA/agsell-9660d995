import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, TrendingUp, Trash2, Plus } from 'lucide-react';
import { useForecast, useRevenueGoals, useCreateRevenueGoal, useDeleteRevenueGoal } from '@/hooks/useCRMIntelligence';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const firstDayOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const lastDayOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

export function ForecastPanel() {
  const [start, setStart] = useState(firstDayOfMonth());
  const [end, setEnd] = useState(lastDayOfMonth());
  const { data: forecast } = useForecast(start, end);
  const { data: goals = [] } = useRevenueGoals();
  const createGoal = useCreateRevenueGoal();
  const deleteGoal = useDeleteRevenueGoal();
  const [target, setTarget] = useState('');

  const f = forecast as any;
  const target_amount = Number(f?.target || 0);
  const won_value = Number(f?.won_value || 0);
  const weighted = Number(f?.weighted_forecast || 0);
  const progress = target_amount > 0 ? Math.min(100, (won_value / target_amount) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Período</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label>Início</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>Fim</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><DollarSign className="h-4 w-4 text-green-500" /> Realizado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(won_value)}</div><p className="text-xs text-muted-foreground">{f?.won_count || 0} deals fechados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><TrendingUp className="h-4 w-4 text-blue-500" /> Forecast Ponderado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(weighted)}</div><p className="text-xs text-muted-foreground">{f?.open_count || 0} deals abertos × probabilidade</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><Target className="h-4 w-4 text-amber-500" /> Meta</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(target_amount)}</div>
            {target_amount > 0 && <Progress value={progress} className="mt-2" />}
            <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% atingido</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Definir Meta para o Período</CardTitle></CardHeader>
        <CardContent className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Valor (R$)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="100000" />
          </div>
          <Button onClick={() => { if (target) { createGoal.mutate({ period_start: start, period_end: end, target_amount: Number(target) }); setTarget(''); } }}>
            <Plus className="h-4 w-4 mr-2" /> Criar Meta
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Metas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {goals.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{fmt(Number(g.target_amount))}</div>
                    <div className="text-xs text-muted-foreground">{g.period_start} → {g.period_end}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteGoal.mutate(g.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
