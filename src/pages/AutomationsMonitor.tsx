import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  error: 'destructive',
  failed: 'destructive',
};

export default function AutomationsMonitor() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const stepsQuery = useQuery({
    queryKey: ['automation-scheduled-steps', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_scheduled_steps')
        .select('id, automation_id, contact_id, status, current_step, scheduled_at, created_at, execution_id')
        .eq('organization_id', orgId)
        .order('scheduled_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 15_000,
  });

  const alertsQuery = useQuery({
    queryKey: ['automation-alerts', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('id, alert_type, severity, title, description, metadata, is_resolved, created_at')
        .eq('organization_id', orgId)
        .in('alert_type', ['automation_step_failed', 'automation_step_exception'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 30_000,
  });

  // Realtime updates on scheduled steps
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel('automations-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_scheduled_steps', filter: `organization_id=eq.${orgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['automation-scheduled-steps', orgId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, queryClient]);

  const counts = (stepsQuery.data ?? []).reduce<Record<string, number>>((acc, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleReprocess = async (stepId: string) => {
    const { data, error } = await (supabase as any).rpc('reprocess_scheduled_step', { _step_id: stepId });
    if (error) { toast.error('Erro: ' + error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    toast.success('Step recolocado em fila para reprocessar');
    queryClient.invalidateQueries({ queryKey: ['automation-scheduled-steps', orgId] });
  };

  const triggerCron = async () => {
    const { error } = await supabase.functions.invoke('process-scheduled-steps');
    if (error) toast.error('Falha ao disparar: ' + error.message);
    else toast.success('Processamento disparado');
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['automation-scheduled-steps', orgId] }), 1500);
  };

  if (stepsQuery.isLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Monitor de Automações
          </h1>
          <p className="text-muted-foreground">Status em tempo quase real dos passos agendados</p>
        </div>
        <Button onClick={triggerCron} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Disparar processamento agora
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'pending', label: 'Pendentes' },
          { key: 'processing', label: 'Processando' },
          { key: 'completed', label: 'Concluídos' },
          { key: 'error', label: 'Erros' },
          { key: 'failed', label: 'Falharam' },
        ].map(s => (
          <Card key={s.key}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{counts[s.key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(alertsQuery.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas recentes
            </CardTitle>
            <CardDescription>Falhas reportadas pelo motor de automações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {alertsQuery.data!.map((a: any) => (
                <div key={a.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                    <span className="font-medium">{a.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(a.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">{a.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passos agendados</CardTitle>
          <CardDescription>Atualiza automaticamente a cada 15s + realtime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agendado</TableHead>
                  <TableHead>Automação</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stepsQuery.data ?? []).map((s: any) => {
                  const stuck = s.status === 'processing' || s.status === 'error' || s.status === 'failed';
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(s.scheduled_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs font-mono">{s.automation_id?.slice(0, 8)}…</TableCell>
                      <TableCell className="text-xs">{s.current_step}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[s.status] ?? 'outline'} className="text-[10px]">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {stuck && (
                          <Button size="sm" variant="outline" onClick={() => handleReprocess(s.id)}>
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reprocessar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(stepsQuery.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Nenhum passo agendado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
