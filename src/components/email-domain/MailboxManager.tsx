import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Mail, Plus, Trash2, Edit, Facebook, Instagram, Youtube, Send,
  MessageCircle, MapPin, PenLine, Flame, Loader2, Gauge,
} from 'lucide-react';
import { useEmailMailboxes, type EmailMailbox } from '@/hooks/useEmailMailboxes';

interface MailboxManagerProps {
  domainId: string;
  domain: string;
}

// Presets de limite diário baseados em boas práticas de entregabilidade
const DAILY_LIMIT_PRESETS = [
  { label: 'Aquecimento', value: 50, description: 'Domínio novo (primeiros 7 dias)' },
  { label: 'Conservador', value: 200, description: 'Reputação em construção' },
  { label: 'Moderado', value: 500, description: 'Domínio com boa reputação' },
  { label: 'Alto Volume', value: 1000, description: 'Domínio consolidado' },
  { label: 'Máximo', value: 2000, description: 'Alto volume, reputação excelente' },
];

function WarmupBadge({ status }: { status: string }) {
  switch (status) {
    case 'warming':
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"><Flame className="h-3 w-3 mr-1" />Aquecimento</Badge>;
    case 'warmed':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Aquecido</Badge>;
    default:
      return <Badge variant="outline">Sem aquecimento</Badge>;
  }
}

function getDefaultLimitForWarmup(warmupStatus: string): number {
  switch (warmupStatus) {
    case 'warming': return 50;
    case 'warmed': return 500;
    default: return 200;
  }
}

export default function MailboxManager({ domainId, domain }: MailboxManagerProps) {
  const { mailboxes, isLoading, createMailbox, updateMailbox, deleteMailbox } = useEmailMailboxes(domainId);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EmailMailbox | null>(null);

  const [form, setForm] = useState({
    name: '', prefix: '',
    link_facebook: '', link_instagram: '', link_youtube: '',
    link_whatsapp: '', link_telegram: '', signature: '', address: '',
    daily_limit: 200,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', prefix: '', link_facebook: '', link_instagram: '', link_youtube: '', link_whatsapp: '', link_telegram: '', signature: '', address: '', daily_limit: 200 });
    setShowDialog(true);
  };

  const openEdit = (m: EmailMailbox) => {
    setEditing(m);
    setForm({
      name: m.name, prefix: m.prefix,
      link_facebook: m.link_facebook || '', link_instagram: m.link_instagram || '',
      link_youtube: m.link_youtube || '', link_whatsapp: m.link_whatsapp || '',
      link_telegram: m.link_telegram || '', signature: m.signature || '', address: m.address || '',
      daily_limit: m.daily_limit ?? getDefaultLimitForWarmup(m.warmup_status),
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) {
      updateMailbox.mutate({ id: editing.id, ...form }, { onSuccess: () => setShowDialog(false) });
    } else {
      createMailbox.mutate({ domain_id: domainId, ...form }, { onSuccess: () => setShowDialog(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Caixas Postais
          </h3>
          <p className="text-sm text-muted-foreground">Gerencie os endereços de envio do domínio {domain}</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Caixa Postal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : mailboxes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma caixa postal criada.</p>
            <Button className="mt-4" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />Criar Primeira
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {mailboxes.map((m: any) => {
            const sentToday = m.sent_today ?? 0;
            const dailyLimit = m.daily_limit ?? 500;
            const usagePercent = dailyLimit > 0 ? Math.min((sentToday / dailyLimit) * 100, 100) : 0;
            const isNearLimit = usagePercent >= 80;

            return (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.prefix}@{domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <WarmupBadge status={m.warmup_status} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover caixa postal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O endereço <strong>{m.prefix}@{domain}</strong> não poderá mais ser usado para envios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMailbox.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Sending progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Gauge className="h-3 w-3" />
                        Envios hoje
                      </span>
                      <span className={`font-medium ${isNearLimit ? 'text-destructive' : 'text-foreground'}`}>
                        {sentToday} / {dailyLimit}
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-1.5" />
                  </div>

                  {/* Quick info row */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {m.signature && <Badge variant="outline" className="text-[10px]"><PenLine className="h-3 w-3 mr-1" />{m.signature}</Badge>}
                    {m.link_instagram && <Badge variant="outline" className="text-[10px]"><Instagram className="h-3 w-3 mr-1" />Instagram</Badge>}
                    {m.link_whatsapp && <Badge variant="outline" className="text-[10px]"><MessageCircle className="h-3 w-3 mr-1" />WhatsApp</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${form.prefix}@${domain}` : 'Nova Caixa Postal'}</DialogTitle>
            <DialogDescription>
              Os dados abaixo serão mostrados no rodapé do e-mail a ser enviado. Caso não selecione uma imagem, será utilizada a imagem do seu projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Caixa Postal</Label>
                <Input placeholder="AG WEBi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Prefixo</Label>
                <div className="flex">
                  <Input placeholder="faleconosco" value={form.prefix} onChange={e => setForm({...form, prefix: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')})} className="rounded-r-none" disabled={!!editing} />
                  <span className="inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-xs text-muted-foreground">@{domain}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" />Link para Facebook</Label>
              <Input placeholder="https://facebook.com/..." value={form.link_facebook} onChange={e => setForm({...form, link_facebook: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" />Link para Instagram</Label>
              <Input placeholder="https://instagram.com/..." value={form.link_instagram} onChange={e => setForm({...form, link_instagram: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Youtube className="h-3.5 w-3.5" />Link para YouTube</Label>
              <Input placeholder="https://youtube.com/..." value={form.link_youtube} onChange={e => setForm({...form, link_youtube: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />Link para WhatsApp</Label>
              <Input placeholder="https://wa.me/..." value={form.link_whatsapp} onChange={e => setForm({...form, link_whatsapp: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Send className="h-3.5 w-3.5" />Link para Telegram</Label>
              <Input placeholder="https://t.me/..." value={form.link_telegram} onChange={e => setForm({...form, link_telegram: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><PenLine className="h-3.5 w-3.5" />Assinatura</Label>
              <Input placeholder="Anderson Gomes  AG WEBi" value={form.signature} onChange={e => setForm({...form, signature: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Endereço</Label>
              <Input placeholder="Rua..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>

            {/* Daily Limit with presets */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <Label className="flex items-center gap-1 font-semibold"><Gauge className="h-3.5 w-3.5" />Limite Diário de Envios</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAILY_LIMIT_PRESETS.map(preset => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={form.daily_limit === preset.value ? 'default' : 'outline'}
                    className="text-xs h-7 px-2.5"
                    onClick={() => setForm({...form, daily_limit: preset.value})}
                  >
                    {preset.label} ({preset.value})
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={10000}
                placeholder="200"
                value={form.daily_limit}
                onChange={e => setForm({...form, daily_limit: parseInt(e.target.value) || 0})}
              />
              <p className="text-xs text-muted-foreground">
                {DAILY_LIMIT_PRESETS.find(p => p.value === form.daily_limit)?.description ||
                  'Valor personalizado. Recomendamos começar com limites baixos e aumentar gradualmente para proteger a reputação do domínio.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.prefix || createMailbox.isPending || updateMailbox.isPending}>
              {(createMailbox.isPending || updateMailbox.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
