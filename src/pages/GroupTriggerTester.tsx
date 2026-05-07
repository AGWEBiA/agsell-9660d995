import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWhatsAppGroups } from '@/hooks/useWhatsAppGroups';
import { toast } from 'sonner';
import { Loader2, Play, RefreshCw, FlaskConical } from 'lucide-react';

interface ExecutionRow {
  execution_id: string;
  automation_id: string;
  automation_name: string | null;
  trigger_event: string;
  status: string;
  current_step: number;
  total_steps: number;
  trigger_data: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export default function GroupTriggerTester() {
  const { currentOrganization } = useOrganization();
  const { data: groups = [] } = useWhatsAppGroups();
  const [groupId, setGroupId] = useState('');
  const [tagName, setTagName] = useState('');
  const [triggerType, setTriggerType] = useState<'group_tag_added' | 'group_tag_removed'>('group_tag_added');
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ enqueued_count: number; executions: ExecutionRow[] } | null>(null);
  const [recent, setRecent] = useState<ExecutionRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const loadRecent = async () => {
    if (!currentOrganization?.id) return;
    setLoadingRecent(true);
    const { data, error } = await supabase.rpc('list_group_trigger_executions', {
      _org_id: currentOrganization.id,
      _group_id: groupId || null,
      _limit: 50,
    });
    if (error) {
      toast.error('Erro ao listar execuções: ' + error.message);
    } else {
      setRecent((data as ExecutionRow[]) || []);
    }
    setLoadingRecent(false);
  };

  useEffect(() => { loadRecent(); /* eslint-disable-next-line */ }, [currentOrganization?.id, groupId]);

  const runSimulation = async () => {
    if (!currentOrganization?.id) {
      toast.error('Selecione uma organização');
      return;
    }
    if (!groupId) {
      toast.error('Selecione um grupo');
      return;
    }
    if (!tagName.trim()) {
      toast.error('Informe o nome da tag');
      return;
    }
    setRunning(true);
    const { data, error } = await supabase.rpc('simulate_group_tag_trigger', {
      _org_id: currentOrganization.id,
      _group_id: groupId,
      _tag_name: tagName.trim(),
      _trigger_type: triggerType,
    });
    setRunning(false);
    if (error) {
      toast.error('Falha na simulação: ' + error.message);
      return;
    }
    const result = data as { enqueued_count: number; executions: ExecutionRow[] };
    setLastResult(result);
    toast.success(`${result.enqueued_count} automação(ões) enfileirada(s)`);
    loadRecent();
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Teste de Trigger de Grupo</h1>
          <p className="text-sm text-muted-foreground">
            Simule "Tag adicionada/removida ao Grupo" e inspecione as automações disparadas.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurar simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de gatilho</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as 'group_tag_added' | 'group_tag_removed')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group_tag_added">Tag adicionada ao Grupo</SelectItem>
                  <SelectItem value="group_tag_removed">Tag removida do Grupo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grupo *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">Nenhum grupo cadastrado</div>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name || g.external_group_id}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tag a simular *</Label>
            <Input
              placeholder="ex: aquecimento_dia1"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={runSimulation} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Disparar simulação
            </Button>
            <Button variant="outline" onClick={loadRecent} disabled={loadingRecent}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecent ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resultado da última simulação
              <Badge variant={lastResult.enqueued_count > 0 ? 'default' : 'secondary'}>
                {lastResult.enqueued_count} enfileirada(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.executions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma automação ativa correspondeu ao gatilho. Verifique se existe automação com trigger "{triggerType}" e tag "{tagName}" (ou tag vazia para qualquer).
              </p>
            ) : (
              <div className="space-y-2">
                {lastResult.executions.map((e) => (
                  <ExecutionCard key={e.execution_id} exec={e} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Execuções recentes (últimas 50)</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução de gatilho de grupo encontrada{groupId ? ' para este grupo' : ''}.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e) => <ExecutionCard key={e.execution_id} exec={e} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutionCard({ exec }: { exec: ExecutionRow }) {
  const statusColor =
    exec.status === 'completed' ? 'default' :
    exec.status === 'failed' || exec.status === 'error' ? 'destructive' :
    exec.status === 'pending' ? 'secondary' : 'outline';
  return (
    <div className="border rounded-md p-3 space-y-1.5 bg-muted/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant={statusColor as 'default' | 'destructive' | 'secondary' | 'outline'}>{exec.status}</Badge>
          <span className="font-medium text-sm">{exec.automation_name || exec.automation_id}</span>
          <Badge variant="outline" className="text-xs">{exec.trigger_event}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(exec.created_at).toLocaleString('pt-BR')}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        Passo {exec.current_step}/{exec.total_steps}
        {exec.trigger_data?.tag_name ? ` • tag: ${String(exec.trigger_data.tag_name)}` : ''}
        {exec.trigger_data?.group_id ? ` • group_id: ${String(exec.trigger_data.group_id).slice(0, 8)}…` : ''}
      </div>
      {exec.error_message && <p className="text-xs text-destructive">{exec.error_message}</p>}
    </div>
  );
}
