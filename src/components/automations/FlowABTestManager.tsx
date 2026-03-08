import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, Play, Pause, Trophy, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function FlowABTestManager({ automationId }: { automationId?: string }) {
  const { currentOrganization } = useOrganization();

  const { data: tests, isLoading } = useQuery({
    queryKey: ['flow_ab_tests', automationId || currentOrganization?.id],
    queryFn: async () => {
      let q = supabase
        .from('flow_ab_tests')
        .select('*, automations(name)')
        .order('created_at', { ascending: false });
      
      if (automationId) {
        q = q.eq('automation_id', automationId);
      } else if (currentOrganization?.id) {
        q = q.eq('organization_id', currentOrganization.id);
      }
      
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(automationId || currentOrganization?.id),
  });

  if (isLoading) {
    return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32" />)}</div>;
  }

  if (!tests || tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <h4 className="font-medium mb-1">Nenhum teste A/B de fluxo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crie testes para comparar dois caminhos diferentes e descobrir qual converte mais
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <GitBranch className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Testes A/B de Fluxos</h3>
          <p className="text-sm text-muted-foreground">Compare caminhos completos para otimizar conversões</p>
        </div>
      </div>

      {tests.map((test: any) => {
        const totalA = test.entries_a || 0;
        const totalB = test.entries_b || 0;
        const convA = test.conversions_a || 0;
        const convB = test.conversions_b || 0;
        const rateA = totalA > 0 ? Math.round((convA / totalA) * 100) : 0;
        const rateB = totalB > 0 ? Math.round((convB / totalB) * 100) : 0;
        const winner = test.winner || (rateA > rateB && totalA > 10 ? 'A' : rateB > rateA && totalB > 10 ? 'B' : null);

        return (
          <Card key={test.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{test.name}</CardTitle>
                  <CardDescription>
                    {(test as any).automations?.name || 'Fluxo'}
                    {' · '}Split {test.split_percentage}% / {100 - test.split_percentage}%
                  </CardDescription>
                </div>
                <Badge variant={test.status === 'running' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}>
                  {test.status === 'running' ? 'Em execução' : test.status === 'completed' ? 'Concluído' : 'Rascunho'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${winner === 'A' ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'bg-muted/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Variante A</span>
                    {winner === 'A' && <Trophy className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Entradas</span><span className="font-medium">{totalA}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Conversões</span><span className="font-medium">{convA}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Taxa</span><span className="font-bold">{rateA}%</span>
                    </div>
                    <Progress value={rateA} className="h-1.5" />
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${winner === 'B' ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'bg-muted/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Variante B</span>
                    {winner === 'B' && <Trophy className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Entradas</span><span className="font-medium">{totalB}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Conversões</span><span className="font-medium">{convB}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Taxa</span><span className="font-bold">{rateB}%</span>
                    </div>
                    <Progress value={rateB} className="h-1.5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
