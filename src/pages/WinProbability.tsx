import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useDeals } from '@/hooks/usePipeline';
import { toast } from 'sonner';
import { Brain, TrendingUp, TrendingDown, Loader2, RefreshCw, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';

export default function WinProbability() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();
  const { deals } = usePipeline();

  const { data: scores = [] } = useQuery({
    queryKey: ['deal-win-scores', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_win_scores')
        .select('*')
        .eq('organization_id', orgId!)
        .order('win_probability', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const predict = useMutation({
    mutationFn: async (dealId: string) => {
      const { data, error } = await supabase.functions.invoke('predict-win', {
        body: { deal_id: dealId, organization_id: orgId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-win-scores'] });
      toast.success('Probabilidade calculada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const predictAll = async () => {
    if (!deals?.length) return;
    toast.info('Calculando probabilidades...');
    for (const deal of deals.slice(0, 20)) {
      await predict.mutateAsync(deal.id);
    }
    toast.success('Todas as probabilidades atualizadas!');
  };

  const getScoreForDeal = (dealId: string) => scores.find(s => s.deal_id === dealId);

  const dealsWithScores = (deals || []).map(d => ({
    ...d,
    score: getScoreForDeal(d.id),
  })).sort((a, b) => (b.score?.win_probability ?? -1) - (a.score?.win_probability ?? -1));

  const avgProbability = scores.length > 0
    ? Math.round(scores.reduce((s, sc) => s + Number(sc.win_probability), 0) / scores.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" /> Win Probability
          </h1>
          <p className="text-muted-foreground">IA analisa seus deals e prevê a probabilidade de fechamento</p>
        </div>
        <Button onClick={predictAll} disabled={predict.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" /> Recalcular Todos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><TrendingUp className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Probabilidade Média</p>
              <p className="text-2xl font-bold text-foreground">{avgProbability}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><ThumbsUp className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Alta Probabilidade (&gt;70%)</p>
              <p className="text-2xl font-bold text-foreground">{scores.filter(s => s.win_probability > 70).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-destructive/10"><ThumbsDown className="h-6 w-6 text-destructive" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Baixa Probabilidade (&lt;30%)</p>
              <p className="text-2xl font-bold text-foreground">{scores.filter(s => s.win_probability < 30).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deals & Probabilidades</CardTitle>
          <CardDescription>Clique em "Analisar" para calcular a probabilidade de fechamento com IA</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Probabilidade</TableHead>
                <TableHead>Fatores</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealsWithScores.slice(0, 30).map(deal => {
                const prob = deal.score?.win_probability;
                const factors = deal.score?.factors as any;
                return (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-foreground">{deal.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.value ? `R$ ${Number(deal.value).toLocaleString('pt-BR')}` : '-'}
                    </TableCell>
                    <TableCell>
                      {prob != null ? (
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={prob} className="h-2 flex-1" />
                          <Badge variant={prob > 70 ? 'default' : prob > 40 ? 'secondary' : 'destructive'}>
                            {prob}%
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não analisado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {factors ? (
                        <div className="flex flex-wrap gap-1">
                          {(factors.positive || []).slice(0, 2).map((f: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs text-success border-success/30">{f}</Badge>
                          ))}
                          {(factors.negative || []).slice(0, 1).map((f: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">{f}</Badge>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => predict.mutate(deal.id)} disabled={predict.isPending}>
                        {predict.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {dealsWithScores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum deal encontrado no pipeline. Crie deals para analisar probabilidades.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
