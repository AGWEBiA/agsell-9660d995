import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, Settings2, Pause, Play, MousePointerClick, Link as LinkIcon } from 'lucide-react';
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

  const getPublicLink = (slug: string) => `${window.location.origin}/r/${slug}`;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <LinkIcon className="h-5 w-5 shrink-0" /> Campanhas de Rotação
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Cada campanha gera um link único que distribui cliques entre os grupos cadastrados.
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader><DialogTitle>Nova Campanha de Rotação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input placeholder="Ex: Lançamento Curso X" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug (identificador único no link)</Label>
                <Input placeholder="ex: curso-x" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
                <p className="text-xs text-muted-foreground break-all">Link: {window.location.origin}/r/{slug || 'seu-slug'}</p>
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
          <div className="space-y-3">
            {campaigns.map((c: any) => (
              <div key={c.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                {/* Top row: name + status */}
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm sm:text-base truncate">{c.name}</p>
                  <Badge variant={c.is_active ? 'default' : 'secondary'} className="shrink-0">
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {/* Link + clicks row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <code className="text-xs text-muted-foreground truncate">/r/{c.slug}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(getPublicLink(c.slug)); toast.success('Link copiado!'); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    <span className="text-sm">{c.total_clicks} cliques</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t">
                  <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs" onClick={() => updateCampaign.mutate({ id: c.id, is_active: !c.is_active })}>
                    {c.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {c.is_active ? 'Pausar' : 'Ativar'}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs" onClick={() => onSelect(c.id)}>
                    <Settings2 className="h-3.5 w-3.5" /> Configurar
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs ml-auto text-destructive hover:text-destructive" onClick={() => deleteCampaign.mutate(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
