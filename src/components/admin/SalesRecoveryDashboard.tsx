import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Mail,
  ExternalLink,
  Receipt,
  Banknote,
  QrCode,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  started: { label: 'Iniciado', variant: 'outline', icon: Clock },
  redirected_to_stripe: { label: 'Redirecionado Stripe', variant: 'secondary', icon: CreditCard },
  redirected_to_kiwify: { label: 'Redirecionado Kiwify', variant: 'secondary', icon: ExternalLink },
  waiting_payment: { label: 'Aguardando Pagamento', variant: 'outline', icon: Clock },
  boleto_generated: { label: 'Boleto Gerado', variant: 'outline', icon: Receipt },
  pix_generated: { label: 'PIX Gerado', variant: 'outline', icon: QrCode },
  converted: { label: 'Convertido', variant: 'default', icon: CheckCircle },
  expired: { label: 'Expirado', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Reembolsado', variant: 'destructive', icon: Banknote },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, variant: 'outline' as const, icon: AlertTriangle };
}

export function SalesRecoveryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['admin_checkout_leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_leads')
        .select('*, plans(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const stats = React.useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l: any) => l.converted || l.status === 'converted').length;
    const pending = leads.filter((l: any) => !l.converted && !['converted', 'expired', 'refunded'].includes(l.status || '')).length;
    const boleto = leads.filter((l: any) => l.status === 'boleto_generated').length;
    const pix = leads.filter((l: any) => l.status === 'pix_generated').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
    return { total, converted, pending, boleto, pix, conversionRate };
  }, [leads]);

  // Filtered leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead: any) => {
      const matchesSearch = !searchTerm ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  // Unique sources
  const sources = React.useMemo(() => {
    const s = new Set(leads.map((l: any) => l.source).filter(Boolean));
    return Array.from(s) as string[];
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">{stats.conversionRate}% de conversão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Recuperação possível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Emitidos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.boleto}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PIX Gerados</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pix}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Acompanhamento de Vendas
              </CardTitle>
              <CardDescription>Gerencie e recupere vendas pendentes</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou organização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Convertido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead: any) => {
                      const statusConf = getStatusConfig(lead.status || 'started');
                      const StatusIcon = statusConf.icon;

                      return (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.email}</p>
                              {lead.organization_name && (
                                <p className="text-xs text-muted-foreground">{lead.organization_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.plans?.name || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{lead.billing_cycle || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {lead.source || 'direto'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConf.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {statusConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lead.created_at
                              ? format(new Date(lead.created_at), "dd/MM/yy HH:mm", { locale: ptBR })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {lead.converted ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sim
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Não
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
