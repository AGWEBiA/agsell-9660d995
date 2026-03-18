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
  Activity, BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from '@/lib/recharts';

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

const PIE_COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function ErrorMonitoringDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['admin_system_errors', filterSeverity, filterStatus, filterModule],
    queryFn: async () => {
      let query = supabase
        .from('system_errors')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filterSeverity !== 'all') query = query.eq('severity', filterSeverity);
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      if (filterModule !== 'all') query = query.eq('module', filterModule);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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
    e.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.endpoint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modules = [...new Set(errors.map((e: any) => e.module))].filter(Boolean);

  // Stats
  const openCount = errors.filter((e: any) => e.status === 'open').length;
  const criticalCount = errors.filter((e: any) => e.severity === 'critical' && e.status !== 'resolved').length;
  const resolvedToday = errors.filter((e: any) => {
    if (e.status !== 'resolved' || !e.resolved_at) return false;
    return new Date(e.resolved_at).toDateString() === new Date().toDateString();
  }).length;
  const inProgressCount = errors.filter((e: any) => e.status === 'in_progress').length;

  // Severity distribution for pie chart
  const severityDist = Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: errors.filter((e: any) => e.severity === key && e.status !== 'resolved').length,
  })).filter(d => d.value > 0);

  // Errors by module for bar chart
  const moduleDistMap: Record<string, number> = {};
  errors.filter((e: any) => e.status !== 'resolved').forEach((e: any) => {
    moduleDistMap[e.module] = (moduleDistMap[e.module] || 0) + 1;
  });
  const moduleDist = Object.entries(moduleDistMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Trend: errors per day (last 14 days)
  const trendData = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const count = errors.filter((e: any) => e.created_at?.startsWith(dateStr)).length;
      days.push({ date: label, count });
    }
    return days;
  }, [errors]);

  const handleStatusChange = (errorId: string, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolved_by = user?.id;
      updates.resolved_at = new Date().toISOString();
    }
    updateError.mutate({ id: errorId, updates });
  };

  const handleAddNote = () => {
    if (!selectedError || !noteText.trim()) return;
    const existing = selectedError.notes || '';
    const timestamp = new Date().toLocaleString('pt-BR');
    const newNote = `[${timestamp}] ${noteText.trim()}`;
    const combined = existing ? `${existing}\n${newNote}` : newNote;
    updateError.mutate({ id: selectedError.id, updates: { notes: combined } });
    setNoteText('');
    setSelectedError({ ...selectedError, notes: combined });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros Abertos</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando resolução</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Não resolvidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Sendo investigados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Corrigidos hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tendência (14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Gravidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDist.length > 0 ? severityDist : [{ name: 'Nenhum', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {(severityDist.length > 0 ? severityDist : [{ name: 'Nenhum', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Módulo (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleDist} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar erro, módulo, endpoint..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Gravidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="ignored">Ignorado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {modules.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin_system_errors'] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Erros do Sistema ({filteredErrors.length})</CardTitle>
          <CardDescription>Clique em um erro para ver detalhes e adicionar notas</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="max-w-[300px]">Mensagem</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredErrors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      Nenhum erro encontrado com os filtros atuais
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredErrors.map((err: any) => {
                    const sev = SEVERITY_CONFIG[err.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium;
                    const stat = STATUS_CONFIG[err.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
                    const SevIcon = sev.icon;
                    return (
                      <TableRow key={err.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedError(err)}>
                        <TableCell>
                          <Badge className={sev.color}>
                            <SevIcon className="h-3 w-3 mr-1" />
                            {sev.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{err.module}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">{err.error_message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(err as any).organizations?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={stat.color}>{stat.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(err.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                            {err.status !== 'resolved' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(err.id, 'resolved')}>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {err.status === 'open' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(err.id, 'in_progress')}>
                                <Clock className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedError} onOpenChange={open => { if (!open) setSelectedError(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Detalhes do Erro
            </DialogTitle>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Gravidade</p>
                  <Badge className={SEVERITY_CONFIG[selectedError.severity as keyof typeof SEVERITY_CONFIG]?.color}>
                    {SEVERITY_CONFIG[selectedError.severity as keyof typeof SEVERITY_CONFIG]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select value={selectedError.status} onValueChange={v => {
                    handleStatusChange(selectedError.id, v);
                    setSelectedError({ ...selectedError, status: v });
                  }}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="ignored">Ignorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Módulo</p>
                  <p className="font-mono text-sm">{selectedError.module}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm">{new Date(selectedError.created_at).toLocaleString('pt-BR')}</p>
                </div>
                {selectedError.endpoint && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded">{selectedError.endpoint}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                <p className="text-sm bg-destructive/10 p-3 rounded border border-destructive/20">{selectedError.error_message}</p>
              </div>

              {selectedError.error_details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">{selectedError.error_details}</pre>
                </div>
              )}

              {selectedError.stack_trace && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stack Trace</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[200px] whitespace-pre-wrap">{selectedError.stack_trace}</pre>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Notas de Resolução
                </p>
                {selectedError.notes && (
                  <pre className="text-xs bg-muted p-3 rounded mb-2 whitespace-pre-wrap">{selectedError.notes}</pre>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Adicionar nota..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
