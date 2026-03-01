import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSequences, useCreateSequence, useDeleteSequence, useUpdateSequence, useSequenceSteps, useCreateSequenceStep, useDeleteSequenceStep, useSequenceEnrollments } from '@/hooks/useSequences';
import { Plus, GitBranch, Trash2, Play, Pause, Users, Clock, MessageSquare, Mail, Filter, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function SequenceStepsEditor({ sequenceId }: { sequenceId: string }) {
  const { data: steps = [], isLoading } = useSequenceSteps(sequenceId);
  const createStep = useCreateSequenceStep();
  const deleteStep = useDeleteSequenceStep();
  const { data: enrollments = [] } = useSequenceEnrollments(sequenceId);

  const addStep = (actionType: string) => {
    createStep.mutate({
      sequence_id: sequenceId,
      step_order: steps.length,
      action_type: actionType,
      delay_minutes: actionType === 'wait' ? 60 : 0,
      content: actionType === 'send_message' ? { message: '' } : {},
    });
  };

  const actionIcon = (type: string) => {
    switch (type) {
      case 'send_message': return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'send_email': return <Mail className="h-4 w-4 text-primary" />;
      case 'wait': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'condition': return <Filter className="h-4 w-4 text-purple-500" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  const actionLabel = (type: string) => {
    const map: Record<string, string> = {
      send_message: 'Enviar Mensagem',
      send_email: 'Enviar E-mail',
      wait: 'Aguardar',
      condition: 'Condição',
      add_tag: 'Adicionar Tag',
    };
    return map[type] || type;
  };

  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Etapas da Sequência</h3>
        <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{enrollments.length} inscritos</Badge>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id}>
              {idx > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {actionIcon(step.action_type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{actionLabel(step.action_type)}</p>
                  {step.action_type === 'wait' && (
                    <p className="text-xs text-muted-foreground">Aguardar {formatDelay(step.delay_minutes)}</p>
                  )}
                  {step.action_type === 'send_message' && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {(step.content as any)?.message || 'Mensagem não configurada'}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteStep.mutate(step.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => addStep('send_message')}>
          <MessageSquare className="h-3.5 w-3.5 mr-1" />Mensagem
        </Button>
        <Button variant="outline" size="sm" onClick={() => addStep('wait')}>
          <Clock className="h-3.5 w-3.5 mr-1" />Aguardar
        </Button>
        <Button variant="outline" size="sm" onClick={() => addStep('send_email')}>
          <Mail className="h-3.5 w-3.5 mr-1" />E-mail
        </Button>
        <Button variant="outline" size="sm" onClick={() => addStep('condition')}>
          <Filter className="h-3.5 w-3.5 mr-1" />Condição
        </Button>
      </div>
    </div>
  );
}

export default function Sequences() {
  const { data: sequences = [], isLoading } = useSequences();
  const createSequence = useCreateSequence();
  const deleteSequence = useDeleteSequence();
  const updateSequence = useUpdateSequence();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    channel: 'whatsapp',
    trigger_type: 'manual',
  });

  const handleCreate = () => {
    if (!form.name) return;
    createSequence.mutate(
      { name: form.name, description: form.description || null, channel: form.channel, trigger_type: form.trigger_type },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: '', description: '', channel: 'whatsapp', trigger_type: 'manual' });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      active: { label: 'Ativa', variant: 'default' },
      paused: { label: 'Pausada', variant: 'outline' },
    };
    const s = map[status] || map.draft;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const triggerLabel = (type: string) => {
    const map: Record<string, string> = {
      manual: 'Manual',
      tag_added: 'Tag adicionada',
      deal_created: 'Negócio criado',
      form_submitted: 'Formulário enviado',
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="h-8 w-8 text-primary" />
            Sequências
          </h1>
          <p className="text-muted-foreground">Campanhas drip com etapas automatizadas e delays</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Sequência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Sequência</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Onboarding novos leads" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Objetivo desta sequência..." rows={2} />
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gatilho</Label>
                <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="tag_added">Tag adicionada</SelectItem>
                    <SelectItem value="deal_created">Negócio criado</SelectItem>
                    <SelectItem value="form_submitted">Formulário enviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createSequence.isPending} className="w-full">
                {createSequence.isPending ? 'Criando...' : 'Criar Sequência'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sequência</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Crie sequências de mensagens automatizadas com delays entre cada etapa para nutrir seus leads.
            </p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeira Sequência</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="space-y-3 lg:col-span-1">
            {sequences.map(seq => (
              <Card
                key={seq.id}
                className={`cursor-pointer transition-colors ${selectedId === seq.id ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
                onClick={() => setSelectedId(seq.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{seq.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={e => { e.stopPropagation(); deleteSequence.mutate(seq.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(seq.status)}
                    <Badge variant="outline" className="text-xs">{seq.channel}</Badge>
                    <Badge variant="outline" className="text-xs">{triggerLabel(seq.trigger_type)}</Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{seq.enrolled_count} inscritos</span>
                    <span>{seq.completed_count} concluídos</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {seq.status === 'active' ? (
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); updateSequence.mutate({ id: seq.id, status: 'paused' }); }}>
                        <Pause className="h-3 w-3 mr-1" />Pausar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); updateSequence.mutate({ id: seq.id, status: 'active' }); }}>
                        <Play className="h-3 w-3 mr-1" />Ativar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selectedId ? (
              <Card>
                <CardContent className="p-6">
                  <SequenceStepsEditor sequenceId={selectedId} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-24 text-muted-foreground">
                  Selecione uma sequência para editar suas etapas
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
