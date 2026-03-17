import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, ExternalLink, Settings2, Pause, Play, MousePointerClick, Link as LinkIcon } from 'lucide-react';
import { useGroupRotator } from '@/hooks/useGroupRotator';
import { toast } from 'sonner';

interface Props {
  onSelect: (id: string) => void;
}

export function GroupRotatorCampaigns({ onSelect }: Props) {
  const { campaigns, isLoadingCampaigns, createCampaign, updateCampaign, deleteCampaign } = useGroupRotator();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleCreate = () => {
    if (!name || !slug) return;
    createCampaign.mutate({ name, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }, {
      onSuccess: () => { setDialogOpen(false); setName(''); setSlug(''); },
    });
  };

  const getPublicLink = (slug: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `${window.location.origin}/r/${slug}`;
  };

  const getApiLink = (slug: string) => {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/group-rotator/${slug}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Campanhas de Rotação</CardTitle>
          <CardDescription>Cada campanha gera um link único que distribui cliques entre os grupos cadastrados.</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Campanha de Rotação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input placeholder="Ex: Lançamento Curso X" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug (identificador único no link)</Label>
                <Input placeholder="ex: curso-x" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
                <p className="text-xs text-muted-foreground">Link: {window.location.origin}/r/{slug || 'seu-slug'}</p>
              </div>
              <Button onClick={handleCreate} disabled={createCampaign.isPending || !name || !slug} className="w-full">
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingCampaigns ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha criada. Clique em "Nova Campanha" para começar.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs text-muted-foreground truncate max-w-[200px]">/r/{c.slug}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(getPublicLink(c.slug)); toast.success('Link copiado!'); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.total_clicks}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => updateCampaign.mutate({ id: c.id, is_active: !c.is_active })}>
                        {c.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onSelect(c.id)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCampaign.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
