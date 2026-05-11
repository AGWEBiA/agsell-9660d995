import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertTriangle, Bug, CheckCircle, Clock, Filter, Search,
  TrendingUp, XCircle, MessageSquare, RefreshCw, AlertOctagon,
  Activity, BarChart3, Layers
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SEVERITY_CONFIG = {
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertOctagon },
  high: { label: 'Alto', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertTriangle },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Bug },
  low: { label: 'Baixo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Activity },
};

const STATUS_CONFIG = {
  open: { label: 'Aberto', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  in_progress: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  ignored: { label: 'Ignorado', color: 'bg-muted text-muted-foreground' },
};

export function ErrorMonitoringDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDeploy, setFilterDeploy] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['admin_system_errors', filterSeverity, filterStatus, filterDeploy],
    queryFn: async () => {
      let query = supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filterSeverity !== 'all') query = query.eq('severity', filterSeverity);
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      
      const { data, error } = await query;
      if (error) throw error;

      // Local filtering for Deploy ID if stored in user_context
      let result = data || [];
      if (filterDeploy !== 'all') {
        result = result.filter((e: any) => e.user_context?.deploy_id === filterDeploy);
      }
      return result;
    },
  });

  const updateError = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('system_errors')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_system_errors'] });
      toast.success('Erro atualizado com sucesso');
    },
  });

  const filteredErrors = errors.filter((e: any) =>
    !searchTerm || 
    e.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.module?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deploys = [...new Set(errors.map((e: any) => e.user_context?.deploy_id))].filter(Boolean);

  const handleStatusChange = (errorId: string, newStatus: string) => {
    updateError.mutate({ id: errorId, updates: { status: newStatus } });
  };

  const handleAddNote = () => {
    if (!selectedError || !noteText.trim()) return;
    const combined = `${selectedError.notes || ''}\n[${new Date().toLocaleString()}] ${noteText}`;
    updateError.mutate({ id: selectedError.id, updates: { notes: combined } });
    setNoteText('');
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Último Deploy</span>
            </div>
            <p className="text-2xl font-bold font-mono">{deploys[0] || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Críticos (24h)</span>
            </div>
            <p className="text-2xl font-bold">{errors.filter((e: any) => e.severity === 'critical').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por mensagem ou módulo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDeploy} onValueChange={setFilterDeploy}>
          <SelectTrigger className="w-[180px]"><Layers className="h-4 w-4 mr-2" /><SelectValue placeholder="Filtrar por Deploy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Deploys</SelectItem>
            {deploys.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Deploy ID</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredErrors.map((err: any) => (
                <TableRow key={err.id} onClick={() => setSelectedError(err)} className="cursor-pointer">
                  <TableCell><Badge className={STATUS_CONFIG[err.status as keyof typeof STATUS_CONFIG]?.color}>{err.status}</Badge></TableCell>
                  <TableCell><Badge className={SEVERITY_CONFIG[err.severity as keyof typeof SEVERITY_CONFIG]?.color}>{err.severity}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs">{err.error_message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{err.user_context?.deploy_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(err.id, 'resolved'); }}>Resolver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes do Erro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded font-mono text-xs overflow-auto max-h-40">{selectedError?.stack_trace || selectedError?.error_message}</div>
            <Textarea placeholder="Adicionar comentário técnico..." value={noteText} onChange={e => setNoteText(e.target.value)} />
            <div className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedError?.notes}</div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddNote}>Adicionar Comentário</Button>
            <Button variant="outline" onClick={() => setSelectedError(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
