import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, AlertTriangle, Activity, History, ExternalLink, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// build: 2026-05-07e — backend health & publish resilience
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
  const [selectedStepAudit, setSelectedStepAudit] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    try {
      setBackendStatus('checking');
      const { data, error } = await supabase.functions.invoke('process-scheduled-steps', {
        body: { action: 'ping' }
      });
      if (error) throw error;
      setBackendStatus('online');
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Backend health check failed:', err);
      setBackendStatus('offline');
    }
  };

  const stepsQuery = useQuery({
    queryKey: ['automation-scheduled-steps', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_scheduled_steps')
        .select('*')
        .eq('organization_id', orgId)
        .order('scheduled_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 10_000,
  });

  const auditQuery = useQuery({
    queryKey: ['automation-audit', selectedStepAudit],
    queryFn: async () => {
      if (!selectedStepAudit) return [];
      const { data, error } = await (supabase as any)
        .from('automation_scheduled_steps_audit')
        .select('*')
        .eq('step_id', selectedStepAudit)
        .order('created_at', { ascending: false });
      if (error) {
        console.log('Audit table might not exist yet:', error.message);
        return [];
      }
      return data ?? [];
    },
    enabled: !!selectedStepAudit,
  });

  const alertsQuery = useQuery({
    queryKey: ['automation-alerts', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('organization_id', orgId)
        .in('alert_type', ['automation_step_failed', 'automation_step_exception'])
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    checkBackendHealth();
  }, []);

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

  const handleReprocess = async (stepId: string) => {
    setIsReprocessing(stepId);
    try {
      const { data, error } = await supabase.functions.invoke('process-scheduled-steps', {
        body: { action: 'reprocess_step', step_id: stepId },
      });
      if (error) {
        toast.error('Erro na Edge Function: ' + error.message);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      toast.success('Step reiniciado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['automation-scheduled-steps', orgId] });
    } finally {
      setIsReprocessing(null);
    }
  };

  if (stepsQuery.isLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const counts = (stepsQuery.data ?? []).reduce<Record<string, number>>((acc, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" /> Monitor de Automações
          </h1>
          <p className="text-muted-foreground">Rastreamento de steps agendados e retentativas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge 
            variant={backendStatus === 'online' ? 'default' : 'destructive'} 
            className={`flex gap-1.5 items-center ${backendStatus === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {backendStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            Backend {backendStatus === 'online' ? 'Ativo' : backendStatus === 'checking' ? 'Verificando...' : 'Inativo'}
          </Badge>
          <Button onClick={() => { queryClient.invalidateQueries(); checkBackendHealth(); }} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['pending', 'processing', 'completed', 'error', 'failed'].map(status => (
          <Card key={status} className="border-l-4" style={{ borderLeftColor: status === 'error' || status === 'failed' ? '#ef4444' : (status === 'completed' ? '#22c55e' : '#94a3b8') }}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium uppercase text-muted-foreground">{status}</p>
              <p className="text-3xl font-bold">{counts[status] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="steps">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
          <TabsTrigger value="steps">Steps Ativos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Falha</TabsTrigger>
          <TabsTrigger value="system">Diagnóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimos 100 Steps Agendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Agendamento</TableHead>
                      <TableHead>Retentativas</TableHead>
                      <TableHead>Último Erro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stepsQuery.data?.map((s: any) => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedStepAudit(s.id)}>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[s.status] || 'outline'}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {s.retry_count > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <History className="h-3 w-3" /> {s.retry_count}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                          {s.last_error || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {(s.status === 'error' || s.status === 'failed' || s.status === 'processing') && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0" 
                              disabled={isReprocessing === s.id}
                              onClick={(e) => { e.stopPropagation(); handleReprocess(s.id); }}
                            >
                              <RefreshCw className={`h-4 w-4 text-primary ${isReprocessing === s.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stepsQuery.data?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Nenhuma automação agendada encontrada para esta organização.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedStepAudit && (
            <Card className="animate-in fade-in slide-in-from-top-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-md flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" /> Histórico de Tentativas
                  </CardTitle>
                  <CardDescription className="text-xs">Step: {selectedStepAudit}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStepAudit(null)}>Fechar</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {auditQuery.data?.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-10">Nenhum registro de auditoria encontrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {auditQuery.data?.map((a: any) => (
                        <div key={a.id} className="text-xs border-b pb-2">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold">Tentativa #{a.attempt_number}</span>
                            <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex gap-2 items-center mb-1">
                            <Badge variant="outline" className="text-[10px]">{a.status_before}</Badge>
                            <span>→</span>
                            <Badge variant={STATUS_VARIANT[a.status_after] || 'outline'} className="text-[10px]">{a.status_after}</Badge>
                          </div>
                          {a.error_message && <p className="text-destructive mt-1 italic">{a.error_message}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="pt-4">
          <div className="grid gap-4">
            {alertsQuery.data?.map((alert: any) => (
              <Card key={alert.id} className="border-destructive/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      <CardTitle className="text-md">{alert.title}</CardTitle>
                    </div>
                    <Badge variant="destructive">{alert.severity}</Badge>
                  </div>
                  <CardDescription>{new Date(alert.created_at).toLocaleString('pt-BR')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{alert.description}</p>
                  {alert.metadata?.step_id && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                      setSelectedStepAudit(alert.metadata.step_id);
                      document.querySelector('[value="steps"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                    }}>
                      Ver Step Relacionado <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {alertsQuery.data?.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground">Nenhum alerta crítico encontrado.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="system" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico de Infraestrutura</CardTitle>
              <CardDescription>Verifique se os componentes de backend estão acessíveis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${backendStatus === 'online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Edge Function: process-scheduled-steps</p>
                    <p className="text-xs text-muted-foreground">Responsável pelo processamento automático e retentativas.</p>
                  </div>
                </div>
                <Badge variant={backendStatus === 'online' ? 'default' : 'destructive'}>
                  {backendStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <p className="font-bold mb-2">Dica de Deploy:</p>
                <p>Se o backend estiver "OFFLINE", tente atualizar o projeto clicando no botão "Publicar" ou peça ao suporte para verificar as Edge Functions do seu projeto Supabase.</p>
                {lastCheck && <p className="mt-2">Última verificação bem-sucedida: {lastCheck}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}