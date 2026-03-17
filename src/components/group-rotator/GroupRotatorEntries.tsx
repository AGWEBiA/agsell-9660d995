import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Pause, Play, Users, MousePointerClick, Copy } from 'lucide-react';
import { useGroupRotator } from '@/hooks/useGroupRotator';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  campaignId: string;
  onBack: () => void;
}

export function GroupRotatorEntries({ campaignId, onBack }: Props) {
  const { campaigns, createEntry, updateEntry, deleteEntry, fetchEntries } = useGroupRotator();
  const queryClient = useQueryClient();
  const campaign = campaigns.find((c: any) => c.id === campaignId);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('250');
  const [maxClicks, setMaxClicks] = useState('0');

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchEntries(campaignId);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [campaignId]);

  const handleCreate = () => {
    if (!name || !inviteLink) return;
    createEntry.mutate({
      campaign_id: campaignId,
      name,
      invite_link: inviteLink,
      max_capacity: parseInt(maxCapacity) || 0,
      max_clicks: parseInt(maxClicks) || 0,
      sort_order: entries.length,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setName(''); setInviteLink(''); setMaxCapacity('250'); setMaxClicks('0');
        loadEntries();
      },
    });
  };

  const publicLink = campaign ? `${window.location.origin}/r/${campaign.slug}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">{campaign?.name || 'Campanha'}</h2>
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-foreground">{publicLink}</code>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Link copiado!'); }}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{campaign?.total_clicks || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{entries.length}</p>
                <p className="text-xs text-muted-foreground">Grupos Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{entries.filter((e: any) => !e.is_paused).length}</p>
                <p className="text-xs text-muted-foreground">Grupos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Grupos da Campanha</CardTitle>
            <CardDescription>Os cliques são distribuídos em round-robin entre os grupos ativos e com vagas.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="h-4 w-4" /> Adicionar Grupo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Grupo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Grupo</Label>
                  <Input placeholder="Ex: Grupo VIP 1" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Link de Convite do WhatsApp</Label>
                  <Input placeholder="https://chat.whatsapp.com/..." value={inviteLink} onChange={e => setInviteLink(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Capacidade Máx.</Label>
                    <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} />
                    <p className="text-xs text-muted-foreground">0 = sem limite</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. de Cliques</Label>
                    <Input type="number" value={maxClicks} onChange={e => setMaxClicks(e.target.value)} />
                    <p className="text-xs text-muted-foreground">0 = sem limite</p>
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createEntry.isPending || !name || !inviteLink} className="w-full">
                  Adicionar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo adicionado. Clique em "Adicionar Grupo" para começar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>Ocupação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any, idx: number) => {
                  const capPercent = entry.max_capacity > 0 ? Math.min(100, (entry.member_count / entry.max_capacity) * 100) : 0;
                  const clickPercent = entry.max_clicks > 0 ? Math.min(100, (entry.click_count / entry.max_clicks) * 100) : 0;
                  const isFull = (entry.max_capacity > 0 && entry.member_count >= entry.max_capacity) ||
                                 (entry.max_clicks > 0 && entry.click_count >= entry.max_clicks);
                  return (
                    <TableRow key={entry.id} className={entry.is_paused || isFull ? 'opacity-50' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <code className="text-xs text-muted-foreground truncate block max-w-[200px]">{entry.invite_link}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">{entry.click_count}{entry.max_clicks > 0 ? `/${entry.max_clicks}` : ''}</span>
                          {entry.max_clicks > 0 && <Progress value={clickPercent} className="h-1.5 w-20" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">{entry.member_count}{entry.max_capacity > 0 ? `/${entry.max_capacity}` : ''}</span>
                          {entry.max_capacity > 0 && <Progress value={capPercent} className="h-1.5 w-20" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isFull ? (
                          <Badge variant="destructive">Lotado</Badge>
                        ) : entry.is_paused ? (
                          <Badge variant="secondary">Pausado</Badge>
                        ) : (
                          <Badge variant="default">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            updateEntry.mutate({ id: entry.id, is_paused: !entry.is_paused }, { onSuccess: loadEntries });
                          }}>
                            {entry.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            deleteEntry.mutate(entry.id, { onSuccess: loadEntries });
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
