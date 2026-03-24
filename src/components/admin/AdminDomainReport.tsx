import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Globe, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

export function AdminDomainReport() {
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['admin_all_domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_domains' as any)
        .select('*, organization:organizations(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    verified: { label: 'Verificado', icon: <CheckCircle className="h-3 w-3 mr-1" />, variant: 'default' },
    pending: { label: 'Pendente', icon: <Clock className="h-3 w-3 mr-1" />, variant: 'secondary' },
    failed: { label: 'Falhou', icon: <XCircle className="h-3 w-3 mr-1" />, variant: 'destructive' },
  };

  const totalDomains = domains.length;
  const verifiedDomains = domains.filter((d: any) => d.status === 'verified').length;
  const pendingDomains = domains.filter((d: any) => d.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Domínios</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDomains}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedDomains}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingDomains}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domínios Configurados
          </CardTitle>
          <CardDescription>Visão global de todos os domínios de e-mail das organizações</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>E-mail de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DNS</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain: any) => {
                  const status = statusConfig[domain.status] || statusConfig.pending;
                  const dnsChecks = [
                    { label: 'SPF', ok: domain.spf_verified },
                    { label: 'DKIM', ok: domain.dkim_verified },
                    { label: 'DMARC', ok: domain.dmarc_verified },
                    { label: 'MX', ok: domain.mx_verified },
                  ];

                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {domain.organization?.name || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{domain.from_email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center w-fit">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {dnsChecks.map(check => (
                            <Badge
                              key={check.label}
                              variant={check.ok ? 'default' : 'outline'}
                              className={`text-[10px] px-1.5 py-0 ${check.ok ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}`}
                            >
                              {check.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(domain.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {domains.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum domínio configurado no sistema.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
