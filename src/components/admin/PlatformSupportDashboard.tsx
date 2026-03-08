import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Ticket, AlertCircle, Clock, CheckCircle2, Loader2, Send, MessageSquare, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformTicket {
  id: string;
  organization_id: string;
  created_by: string;
  protocol_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  org_name?: string;
  creator_name?: string;
}

export function PlatformSupportDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<PlatformTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch ALL platform tickets across all organizations
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-platform-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .select('*')
        .eq('is_platform_ticket', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rawTickets = data as any[];
      if (!rawTickets?.length) return [];

      // Get org names and creator profiles
      const orgIds = [...new Set(rawTickets.map(t => t.organization_id))];
      const userIds = [...new Set(rawTickets.map(t => t.created_by))];

      const [orgsRes, profilesRes] = await Promise.all([
        supabase.from('organizations').select('id, name').in('id', orgIds),
        supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
      ]);

      const orgMap: Record<string, string> = {};
      orgsRes.data?.forEach((o: any) => { orgMap[o.id] = o.name; });

      const profileMap: Record<string, string> = {};
      profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

      return rawTickets.map(t => ({
        ...t,
        org_name: orgMap[t.organization_id] || 'Desconhecida',
        creator_name: profileMap[t.created_by] || 'Desconhecido',
      })) as PlatformTicket[];
    },
  });

  // Fetch notes for selected ticket
  const { data: ticketNotes = [] } = useQuery({
    queryKey: ['admin-platform-ticket-notes', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase
        .from('support_ticket_notes' as any)
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data as any[])?.map((n: any) => n.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }

      return (data as any[])?.map((n: any) => ({
        ...n,
        profile_name: profileMap[n.user_id] || 'Sistema',
      }));
    },
    enabled: !!selectedTicket,
  });

  // Reply to ticket
  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !user?.id || !replyText.trim()) throw new Error('Dados insuficientes');
      const { error } = await supabase.from('support_ticket_notes' as any).insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        content: replyText.trim(),
        note_type: 'reply',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-ticket-notes', selectedTicket?.id] });
      setReplyText('');
      toast.success('Resposta enviada!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Update ticket status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      if (status === 'closed') updates.closed_at = new Date().toISOString();
      if (status === 'in_progress' && !selectedTicket?.assigned_to) updates.assigned_to = user?.id;
      const { error } = await supabase.from('support_tickets' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-tickets'] });
      toast.success('Status atualizado!');
    },
  });

  const filteredTickets = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

  const statusIcon = (status: string) => {
    if (status === 'open') return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-primary" />;
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'Aberto', variant: 'destructive' },
      in_progress: { label: 'Em andamento', variant: 'default' },
      resolved: { label: 'Resolvido', variant: 'secondary' },
      closed: { label: 'Fechado', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>;
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return <Badge className={`text-[10px] ${colors[priority] || ''}`}>{map[priority] || priority}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-xs text-muted-foreground">Abertos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Tickets da Plataforma
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Tickets abertos pelos clientes da AG Sell via Suporte AG Sell
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum ticket encontrado</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map(ticket => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="font-mono text-xs">{ticket.protocol_number}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{ticket.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ticket.org_name}</TableCell>
                      <TableCell className="text-xs">{ticket.creator_name}</TableCell>
                      <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{statusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedTicket && statusIcon(selectedTicket.status)}
              {selectedTicket?.protocol_number}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedTicket?.org_name} · {selectedTicket?.creator_name}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">{selectedTicket.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedTicket.description || 'Sem descrição'}
                </p>
                <div className="flex gap-2 mt-2">
                  {statusBadge(selectedTicket.status)}
                  {priorityBadge(selectedTicket.priority)}
                  {selectedTicket.category && (
                    <Badge variant="outline" className="text-[10px]">{selectedTicket.category}</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {selectedTicket.status === 'open' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'in_progress' })}>
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Assumir
                  </Button>
                )}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'resolved' })}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Resolver
                  </Button>
                )}
              </div>

              <Separator />

              {/* Notes / Replies */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h4>
                <ScrollArea className="max-h-[200px]">
                  {ticketNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhuma resposta ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {ticketNotes.map((note: any) => (
                        <div key={note.id} className="p-2.5 rounded-lg bg-muted/50 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{note.profile_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(note.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Reply Form */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Escrever resposta..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={2}
                  className="text-sm resize-none flex-1"
                />
                <Button
                  size="icon"
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
