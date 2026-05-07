import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Maximize2, Workflow } from 'lucide-react';
import { useGatewayProducts } from '@/hooks/useGatewayProducts';
import { useAutomations } from '@/hooks/useAutomations';
import { FlowCanvas } from './FlowCanvas';
import type { FlowNode, FlowConnection } from './flowNodeTypes';

interface SequenceNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  subtype: string;
}

const TRANSACTION_STATUSES = [
  { value: 'cart_abandoned', label: 'Abandonou o carrinho' },
  { value: 'purchase_approved', label: 'Compra aprovada' },
  { value: 'purchase_completed', label: 'Compra realizada' },
  { value: 'boleto_generated', label: 'Boleto gerado' },
  { value: 'boleto_paid', label: 'Boleto pago' },
  { value: 'pix_generated', label: 'PIX gerado' },
  { value: 'pix_paid', label: 'PIX pago' },
  { value: 'refund', label: 'Reembolso' },
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'subscription_canceled', label: 'Assinatura cancelada' },
  { value: 'subscription_renewed', label: 'Assinatura renovada' },
  { value: 'trial_started', label: 'Trial iniciado' },
  { value: 'trial_ended', label: 'Trial finalizado' },
];

const LEAD_STATUSES = [
  { value: 'new', label: 'Novo lead' },
  { value: 'engaged', label: 'Engajado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'opportunity', label: 'Oportunidade' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'lost', label: 'Perdido' },
];

function SubFlowEditor({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const initialNodes = (config.sub_nodes as FlowNode[]) || [];
  const initialConnections = (config.sub_connections as FlowConnection[]) || [];
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [connections, setConnections] = useState<FlowConnection[]>(initialConnections);
  const [sidebarPayload, setSidebarPayload] = useState<{ nodeType: FlowNode['type']; subtype: string } | null>(null);

  const handleSave = () => {
    onChange({ ...config, sub_nodes: nodes, sub_connections: connections });
    setOpen(false);
  };

  const quickAdd = (subtype: string, type: FlowNode['type'] = 'action') => {
    setSidebarPayload({ nodeType: type, subtype });
  };

  return (
    <>
      <div className="rounded-lg border border-dashed p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium flex items-center gap-2"><Workflow className="h-4 w-4" /> Sub-fluxo embutido</p>
            <p className="text-xs text-muted-foreground">{nodes.length} nó(s) configurado(s)</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Maximize2 className="h-4 w-4 mr-1" /> Abrir editor
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Editor de sub-fluxo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 overflow-hidden">
            <div className="w-44 border-r p-2 overflow-y-auto space-y-1 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground px-2">Adicionar</p>
              {[
                ['timer', 'Timer', 'timer'],
                ['warmup', 'Aquecimento', 'warmup'],
                ['send_whatsapp', 'WhatsApp', 'action'],
                ['send_whatsapp_oficial', 'WhatsApp Oficial', 'action'],
                ['send_sms', 'SMS', 'action'],
                ['send_email_marketing', 'Email Marketing', 'action'],
                ['voice_torpedo', 'Torp. de Voz', 'action'],
                ['add_tag', 'Add Tag', 'action'],
                ['conditional', 'Condicional', 'condition'],
              ].map(([id, label, type]) => (
                <button
                  key={id}
                  onClick={() => quickAdd(id, type as FlowNode['type'])}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <FlowCanvas
                nodes={nodes}
                connections={connections}
                onNodesChange={setNodes}
                onConnectionsChange={setConnections}
                onEditNode={() => undefined}
                onDeleteNode={(id) => {
                  setNodes((prev) => prev.filter((n) => n.id !== id));
                  setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
                }}
                sidebarDragPayload={sidebarPayload}
                onSidebarDragConsume={() => setSidebarPayload(null)}
              />
            </div>
          </div>
          <DialogFooter className="px-4 py-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar sub-fluxo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReferenceAutomationPicker({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const { automations } = useAutomations();
  const list = (automations as Array<{ id: string; name: string; is_active: boolean }>) || [];

  return (
    <div className="space-y-2">
      <Label>Automação alvo *</Label>
      <Select
        value={String(config.target_automation_id || '')}
        onValueChange={(v) => onChange({ ...config, target_automation_id: v })}
      >
        <SelectTrigger><SelectValue placeholder="Selecione uma automação" /></SelectTrigger>
        <SelectContent>
          {list.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">Nenhuma automação encontrada</div>
          ) : (
            list.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name} {!a.is_active && '(inativa)'}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Quando este nó executar, dispara a automação selecionada para o mesmo contato.</p>
    </div>
  );
}

export function SequenceNodeConfig({ config, onChange, subtype }: SequenceNodeConfigProps) {
  const { data: gatewayProducts = [] } = useGatewayProducts(String(config.gateway || 'any'));

  const updateField = (field: string, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  const mode = String(config.mode || 'inline');

  // Per-subtype entry/exit settings block
  const settingsBlock = (() => {
    if (subtype === 'sequence_transaction') {
      return (
        <>
          <div>
            <Label>Gateway de Pagamento</Label>
            <Select value={String(config.gateway || 'any')} onValueChange={v => updateField('gateway', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer gateway</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="kiwify">Kiwify</SelectItem>
                <SelectItem value="eduzz">Eduzz</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status de Entrada *</Label>
            <Select value={String(config.entry_status || '')} onValueChange={v => updateField('entry_status', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{TRANSACTION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status de Saída *</Label>
            <Select value={String(config.exit_status || '')} onValueChange={v => updateField('exit_status', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{TRANSACTION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Produto (opcional)</Label>
            <Select value={String(config.product_id || 'any')} onValueChange={v => updateField('product_id', v)}>
              <SelectTrigger><SelectValue placeholder="Qualquer produto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer produto</SelectItem>
                {gatewayProducts.map(p => (
                  <SelectItem key={p.id} value={p.external_product_id || p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }
    if (subtype === 'sequence_lead') {
      return (
        <>
          <div>
            <Label>Status de Entrada *</Label>
            <Select value={String(config.entry_status || '')} onValueChange={v => updateField('entry_status', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status de Saída *</Label>
            <Select value={String(config.exit_status || '')} onValueChange={v => updateField('exit_status', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      );
    }
    if (subtype === 'sequence_rewarming') {
      return (
        <>
          <div>
            <Label>Dias de inatividade para entrada *</Label>
            <Input type="number" min={1} value={String(config.inactivity_days || 30)} onChange={e => updateField('inactivity_days', Number(e.target.value))} />
          </div>
          <div>
            <Label>Critério de saída</Label>
            <Select value={String(config.exit_criteria || 'any_interaction')} onValueChange={v => updateField('exit_criteria', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any_interaction">Qualquer interação</SelectItem>
                <SelectItem value="email_opened">Abriu e-mail</SelectItem>
                <SelectItem value="link_clicked">Clicou em link</SelectItem>
                <SelectItem value="whatsapp_reply">Respondeu WhatsApp</SelectItem>
                <SelectItem value="purchase">Realizou compra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }
    if (subtype === 'sequence_optin') {
      return (
        <>
          <div>
            <Label>Tipo de Opt-in</Label>
            <Select value={String(config.optin_type || 'single')} onValueChange={v => updateField('optin_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Opt-in</SelectItem>
                <SelectItem value="double">Double Opt-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canal de confirmação</Label>
            <Select value={String(config.confirmation_channel || 'email')} onValueChange={v => updateField('confirmation_channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timeout (horas)</Label>
            <Input type="number" min={1} value={String(config.timeout_hours || 48)} onChange={e => updateField('timeout_hours', Number(e.target.value))} />
          </div>
        </>
      );
    }
    return null;
  })();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure como esta sequência será executada. Você pode montar um sub-fluxo embutido (estilo SellFlux) ou apontar para outra automação existente.
      </p>

      <Tabs value={mode} onValueChange={(v) => updateField('mode', v)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="inline">Sub-fluxo embutido</TabsTrigger>
          <TabsTrigger value="reference">Automação existente</TabsTrigger>
        </TabsList>
        <TabsContent value="inline" className="space-y-3 pt-3">
          <SubFlowEditor config={config} onChange={onChange} />
        </TabsContent>
        <TabsContent value="reference" className="pt-3">
          <ReferenceAutomationPicker config={config} onChange={onChange} />
        </TabsContent>
      </Tabs>

      <div className="space-y-3 border-t pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Regras de entrada/saída</p>
        {settingsBlock}
        <div>
          <Label>Data de início</Label>
          <Input type="datetime-local" value={String(config.start_date || '')} onChange={e => updateField('start_date', e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={!!config.allow_reentry} onCheckedChange={v => updateField('allow_reentry', v)} />
          <Label>Permitir reentrada</Label>
        </div>
      </div>
    </div>
  );
}
