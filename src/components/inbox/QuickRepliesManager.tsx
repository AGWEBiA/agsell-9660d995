import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { Plus, Trash2, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const replyCategories = ['Saudação', 'Encerramento', 'Suporte', 'Vendas', 'Outro'];

export function QuickRepliesManager() {
  const { replies, isLoading, create, remove } = useQuickReplies();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [shortcut, setShortcut] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    create.mutate({ title, content, category: category || undefined, shortcut: shortcut || undefined }, {
      onSuccess: () => {
        setOpen(false);
        setTitle('');
        setContent('');
        setCategory('');
        setShortcut('');
      },
    });
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold">Respostas Rápidas</h3>
          <p className="text-sm text-muted-foreground">Templates pré-definidos para agilizar o atendimento</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Resposta
        </Button>
      </div>

      {replies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma resposta rápida cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atalho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replies.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.content}</TableCell>
                  <TableCell>{r.category ? <Badge variant="secondary">{r.category}</Badge> : '—'}</TableCell>
                  <TableCell>{r.shortcut ? <Badge variant="outline">/{r.shortcut}</Badge> : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Remover esta resposta rápida?')) remove.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Resposta Rápida</DialogTitle>
            <DialogDescription>Crie um template de resposta para agilizar o atendimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Saudação inicial" /></div>
            <div className="space-y-1"><Label>Conteúdo *</Label><Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Olá! Como posso ajudá-lo(a) hoje?" rows={4} /></div>
            <div className="space-y-1"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{replyCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Atalho (opcional)</Label><Input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="Ex: ola" /><p className="text-xs text-muted-foreground">Use /atalho no chat para inserir rapidamente</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={create.isPending || !title.trim() || !content.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
