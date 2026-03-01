import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useABTests, useCreateABTest, useDeleteABTest } from '@/hooks/useABTests';
import { Plus, FlaskConical, Trash2, Trophy, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ABTests() {
  const { data: tests = [], isLoading } = useABTests();
  const createTest = useCreateABTest();
  const deleteTest = useDeleteABTest();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel: 'whatsapp',
    variant_a: { message: '' },
    variant_b: { message: '' },
  });

  const handleCreate = () => {
    if (!form.name || !form.variant_a.message || !form.variant_b.message) return;
    createTest.mutate(
      { name: form.name, channel: form.channel, variant_a: form.variant_a, variant_b: form.variant_b },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: '', channel: 'whatsapp', variant_a: { message: '' }, variant_b: { message: '' } });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      running: { label: 'Em execução', variant: 'default' },
      completed: { label: 'Concluído', variant: 'outline' },
    };
    const s = map[status] || map.draft;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const calcRate = (responses: number, sent: number) =>
    sent > 0 ? ((responses / sent) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Testes A/B
          </h1>
          <p className="text-muted-foreground">Compare variantes de mensagens e otimize conversões</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Teste</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Teste A/B</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do teste</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Teste abertura WhatsApp" />
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variante A</Label>
                <Textarea
                  value={form.variant_a.message}
                  onChange={e => setForm(f => ({ ...f, variant_a: { message: e.target.value } }))}
                  placeholder="Mensagem da variante A..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Variante B</Label>
                <Textarea
                  value={form.variant_b.message}
                  onChange={e => setForm(f => ({ ...f, variant_b: { message: e.target.value } }))}
                  placeholder="Mensagem da variante B..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} disabled={createTest.isPending} className="w-full">
                {createTest.isPending ? 'Criando...' : 'Criar Teste'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum teste A/B</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Crie testes A/B para comparar variantes de mensagens e descobrir qual gera mais engajamento.
            </p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeiro Teste</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map(test => (
            <Card key={test.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{test.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(test.status)}
                    <Badge variant="outline" className="text-xs">{test.channel}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTest.mutate(test.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Variante A</span>
                      {test.winner === 'a' && <Trophy className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{(test.variant_a as any).message}</p>
                    <div className="flex justify-between text-xs">
                      <span>Enviados: {test.sent_a}</span>
                      <span>Taxa: {calcRate(test.responses_a, test.sent_a)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Variante B</span>
                      {test.winner === 'b' && <Trophy className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{(test.variant_b as any).message}</p>
                    <div className="flex justify-between text-xs">
                      <span>Enviados: {test.sent_b}</span>
                      <span>Taxa: {calcRate(test.responses_b, test.sent_b)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
