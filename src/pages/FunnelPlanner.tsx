import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, ArrowDown, Target, Megaphone, Layout, Workflow,
  BarChart3, Users, DollarSign, Edit, Eye, X, Save, ChevronDown,
  ChevronUp, ExternalLink, Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';

interface FunnelStage {
  id: string;
  name: string;
  type: 'traffic' | 'landing_page' | 'automation' | 'conversion' | 'custom';
  description: string;
  metrics: { label: string; value: string }[];
  links: { label: string; url: string }[];
  color: string;
}

interface Funnel {
  id: string;
  name: string;
  description: string;
  stages: FunnelStage[];
  createdAt: string;
}

const stageColors: Record<string, string> = {
  traffic: 'bg-blue-500',
  landing_page: 'bg-purple-500',
  automation: 'bg-amber-500',
  conversion: 'bg-green-500',
  custom: 'bg-gray-500',
};

const stageIcons: Record<string, typeof Megaphone> = {
  traffic: Megaphone,
  landing_page: Layout,
  automation: Workflow,
  conversion: DollarSign,
  custom: Target,
};

const stageLabels: Record<string, string> = {
  traffic: 'Tráfego / Anúncios',
  landing_page: 'Página de Captura',
  automation: 'Automação / Nurture',
  conversion: 'Conversão / Venda',
  custom: 'Etapa Personalizada',
};

export default function FunnelPlanner() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newFunnel, setNewFunnel] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (!newFunnel.name) return toast.error('Nome é obrigatório');
    const funnel: Funnel = {
      id: crypto.randomUUID(),
      name: newFunnel.name,
      description: newFunnel.description,
      stages: [
        { id: crypto.randomUUID(), name: 'Facebook Ads', type: 'traffic', description: 'Campanha de tráfego pago', metrics: [{ label: 'Investimento', value: 'R$ 0' }, { label: 'Cliques', value: '0' }], links: [], color: stageColors.traffic },
        { id: crypto.randomUUID(), name: 'Landing Page', type: 'landing_page', description: 'Página de captura principal', metrics: [{ label: 'Visitas', value: '0' }, { label: 'Leads', value: '0' }], links: [], color: stageColors.landing_page },
        { id: crypto.randomUUID(), name: 'Sequência de Emails', type: 'automation', description: 'Nutrição automática', metrics: [{ label: 'Opens', value: '0%' }, { label: 'Clicks', value: '0%' }], links: [], color: stageColors.automation },
        { id: crypto.randomUUID(), name: 'Checkout', type: 'conversion', description: 'Página de pagamento', metrics: [{ label: 'Vendas', value: '0' }, { label: 'Receita', value: 'R$ 0' }], links: [], color: stageColors.conversion },
      ],
      createdAt: new Date().toISOString(),
    };
    setFunnels(prev => [...prev, funnel]);
    setNewFunnel({ name: '', description: '' });
    setShowCreate(false);
    setEditingFunnel(funnel);
  };

  const saveFunnel = (updated: Funnel) => {
    setFunnels(prev => prev.map(f => f.id === updated.id ? updated : f));
    setEditingFunnel(null);
    toast.success('Funil salvo!');
  };

  if (editingFunnel) {
    return <FunnelCanvas funnel={editingFunnel} onSave={saveFunnel} onClose={() => setEditingFunnel(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planejador de Funil</h1>
          <p className="text-muted-foreground">Canvas visual para planejar anúncios → páginas → automações → métricas</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Funil</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Funil</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={newFunnel.name} onChange={e => setNewFunnel(p => ({ ...p, name: e.target.value }))} placeholder="Funil de Lançamento" /></div>
              <div><Label>Descrição</Label><Textarea value={newFunnel.description} onChange={e => setNewFunnel(p => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Criar Funil</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {funnels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Target className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">Nenhum funil criado</h3>
            <p className="text-muted-foreground text-center max-w-md">Planeje visualmente toda a jornada do cliente: desde o anúncio até a conversão.</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Criar Funil</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funnels.map(f => (
            <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditingFunnel(f)}>
              <CardHeader>
                <CardTitle className="text-base">{f.name}</CardTitle>
                <CardDescription className="text-xs">{f.stages.length} etapas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  {f.stages.map((s, i) => {
                    const Icon = stageIcons[s.type];
                    return (
                      <React.Fragment key={s.id}>
                        <div className={`h-6 w-6 rounded flex items-center justify-center ${stageColors[s.type]}`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        {i < f.stages.length - 1 && <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Funnel Canvas Editor ───
function FunnelCanvas({ funnel, onSave, onClose }: { funnel: Funnel; onSave: (f: Funnel) => void; onClose: () => void }) {
  const [stages, setStages] = useState<FunnelStage[]>(funnel.stages);
  const [name, setName] = useState(funnel.name);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const selectedStage = stages.find(s => s.id === selectedStageId);

  const addStage = (type: FunnelStage['type']) => {
    const newStage: FunnelStage = {
      id: crypto.randomUUID(),
      name: stageLabels[type],
      type,
      description: '',
      metrics: [{ label: 'Valor', value: '0' }],
      links: [],
      color: stageColors[type],
    };
    setStages(prev => [...prev, newStage]);
    setSelectedStageId(newStage.id);
  };

  const updateStage = (id: string, data: Partial<FunnelStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const moveStage = (id: string, dir: 'up' | 'down') => {
    const idx = stages.findIndex(s => s.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === stages.length - 1)) return;
    const arr = [...stages];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setStages(arr);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          <Target className="h-5 w-5 text-primary" />
          <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm font-semibold border-0 p-0 focus-visible:ring-0 w-60" />
        </div>
        <Button size="sm" onClick={() => onSave({ ...funnel, name, stages })}><Save className="h-4 w-4 mr-1" />Salvar</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Add Stages */}
        <div className="w-48 border-r p-3 space-y-2 shrink-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Adicionar Etapa</p>
          {Object.entries(stageLabels).map(([type, label]) => {
            const Icon = stageIcons[type];
            return (
              <Button key={type} variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => addStage(type as FunnelStage['type'])}>
                <div className={`h-4 w-4 rounded flex items-center justify-center ${stageColors[type]}`}>
                  <Icon className="h-2.5 w-2.5 text-white" />
                </div>
                {label}
              </Button>
            );
          })}
        </div>

        {/* Center: Canvas */}
        <ScrollArea className="flex-1 bg-muted/30">
          <div className="max-w-[500px] mx-auto py-8 px-4">
            {stages.map((stage, idx) => {
              const Icon = stageIcons[stage.type];
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className={`group relative rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedStageId === stage.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'} bg-card`}
                    onClick={() => setSelectedStageId(stage.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stageColors[stage.type]}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{stage.name}</p>
                        <p className="text-xs text-muted-foreground">{stageLabels[stage.type]}</p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveStage(stage.id, 'up'); }}><ChevronUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveStage(stage.id, 'down'); }}><ChevronDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); setStages(prev => prev.filter(s => s.id !== stage.id)); if (selectedStageId === stage.id) setSelectedStageId(null); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {stage.description && <p className="text-xs text-muted-foreground mb-2">{stage.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {stage.metrics.map((m, mi) => (
                        <div key={mi} className="bg-muted rounded px-2 py-1">
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          <p className="text-sm font-bold">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className="flex justify-center py-2"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollArea>

        {/* Right: Properties */}
        <div className="w-64 border-l shrink-0 flex flex-col">
          <div className="p-3 border-b"><p className="font-medium text-sm">Propriedades</p></div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {selectedStage ? (
                <div className="space-y-3">
                  <div><Label className="text-xs">Nome</Label><Input value={selectedStage.name} onChange={e => updateStage(selectedStage.id, { name: e.target.value })} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={selectedStage.description} onChange={e => updateStage(selectedStage.id, { description: e.target.value })} className="text-xs" /></div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={selectedStage.type} onValueChange={v => updateStage(selectedStage.id, { type: v as any, color: stageColors[v] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(stageLabels).map(([t, l]) => <SelectItem key={t} value={t}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator className="my-2" />
                  <Label className="text-xs font-medium">Métricas</Label>
                  {selectedStage.metrics.map((m, i) => (
                    <div key={i} className="flex gap-1">
                      <Input value={m.label} onChange={e => { const metrics = [...selectedStage.metrics]; metrics[i] = { ...m, label: e.target.value }; updateStage(selectedStage.id, { metrics }); }} className="h-7 text-xs" placeholder="Label" />
                      <Input value={m.value} onChange={e => { const metrics = [...selectedStage.metrics]; metrics[i] = { ...m, value: e.target.value }; updateStage(selectedStage.id, { metrics }); }} className="h-7 text-xs w-24" placeholder="Valor" />
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => updateStage(selectedStage.id, { metrics: selectedStage.metrics.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => updateStage(selectedStage.id, { metrics: [...selectedStage.metrics, { label: 'Nova Métrica', value: '0' }] })}><Plus className="h-3 w-3 mr-1" />Métrica</Button>
                  <Separator className="my-2" />
                  <Label className="text-xs font-medium">Links</Label>
                  {selectedStage.links.map((l, i) => (
                    <div key={i} className="flex gap-1">
                      <Input value={l.label} onChange={e => { const links = [...selectedStage.links]; links[i] = { ...l, label: e.target.value }; updateStage(selectedStage.id, { links }); }} className="h-7 text-xs" placeholder="Label" />
                      <Input value={l.url} onChange={e => { const links = [...selectedStage.links]; links[i] = { ...l, url: e.target.value }; updateStage(selectedStage.id, { links }); }} className="h-7 text-xs" placeholder="URL" />
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => updateStage(selectedStage.id, { links: selectedStage.links.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => updateStage(selectedStage.id, { links: [...selectedStage.links, { label: 'Link', url: '' }] })}><Plus className="h-3 w-3 mr-1" />Link</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Selecione uma etapa para editar</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
