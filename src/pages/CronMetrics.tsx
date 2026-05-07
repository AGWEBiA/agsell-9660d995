import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, RefreshCw, AlertCircle, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CronMetrics {
  jobs: Array<{ jobid: number; jobname: string; schedule: string; active: boolean }>;
  runs: Array<{ jobname: string; status: string; return_message: string; start_time: string; end_time: string; duration_ms: number }>;
  queue: {
    pending: number; pending_due: number; pending_future: number;
    processing: number; completed_24h: number; error: number;
    oldest_pending: string | null; next_scheduled: string | null;
    stuck_processing: number;
  };
  now: string;
}

export default function CronMetrics() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['cron-queue-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_queue_metrics' as any);
      if (error) throw error;
      return data as unknown as CronMetrics;
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  useEffect(() => { document.title = 'Métricas de Cron & Fila'; }, []);

  const queue = data?.queue;
  const fmtTime = (s: string | null) => s ? formatDistanceToNow(new Date(s), { addSuffix: true, locale: ptBR }) : '—';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Métricas de Cron & Fila
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhamento em tempo real (atualiza a cada 5s) das execuções de cron e fila de automações.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={autoRefresh ? 'default' : 'outline'} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar agora</Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro:</span>
              <span className="text-sm">{(error as Error)?.message || 'Falha ao carregar (apenas admin global tem acesso).'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Pendentes" value={queue?.pending ?? '—'} icon={<Clock className="h-4 w-4" />} hint={`${queue?.pending_due ?? 0} prontos para executar`} />
        <KpiCard label="Em Processamento" value={queue?.processing ?? '—'} icon={<Activity className="h-4 w-4" />}
          tone={queue?.stuck_processing ? 'warning' : 'default'}
          hint={queue?.stuck_processing ? `${queue.stuck_processing} travados >5min` : 'Saudável'} />
        <KpiCard label="Concluídos (24h)" value={queue?.completed_24h ?? '—'} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <KpiCard label="Com Erro" value={queue?.error ?? '—'} icon={<AlertCircle className="h-4 w-4" />} tone={queue?.error ? 'destructive' : 'default'} />
      </div>

      {/* Queue details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Fila de Automações</CardTitle>
          <CardDescription>Próximos passos agendados e itens travados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <Info label="Mais antigo pendente" value={fmtTime(queue?.oldest_pending ?? null)} />
          <Info label="Próximo agendado" value={fmtTime(queue?.next_scheduled ?? null)} />
          <Info label="Pendentes no futuro" value={String(queue?.pending_future ?? '—')} />
        </CardContent>
      </Card>

      {/* Cron jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs de Cron Configurados</CardTitle>
          <CardDescription>Todos os agendamentos ativos no banco.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Agenda</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.jobs?.map(j => (
                <TableRow key={j.jobid}>
                  <TableCell className="font-mono text-xs">{j.jobname}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-0.5 rounded">{j.schedule}</code></TableCell>
                  <TableCell className="text-right">
                    <Badge variant={j.active ? 'default' : 'secondary'}>{j.active ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.jobs || data.jobs.length === 0) && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">{isLoading ? 'Carregando…' : 'Nenhum job.'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Last runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas 30 Execuções</CardTitle>
          <CardDescription>Histórico recente em ordem cronológica reversa.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.runs?.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.jobname || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'succeeded' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtTime(r.start_time)}</TableCell>
                    <TableCell className="text-right text-xs">{r.duration_ms ? `${Math.round(r.duration_ms)}ms` : '—'}</TableCell>
                  </TableRow>
                ))}
                {(!data?.runs || data.runs.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">Sem execuções recentes.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, hint, icon, tone = 'default' }: {
  label: string; value: number | string; hint?: string; icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const toneClass = {
    default: '', success: 'text-green-500', warning: 'text-amber-500', destructive: 'text-destructive',
  }[tone];
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <span className={toneClass}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${toneClass}`}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
