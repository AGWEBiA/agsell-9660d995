import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw, Check, XCircle, Clock, AlertTriangle, RotateCcw, Send,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WebhookDeliveryQueue() {
  const { currentOrganization } = useOrganization();

  const { data: deliveries, isLoading, refetch } = useQuery({
    queryKey: ['webhook_deliveries', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrganization?.id,
    refetchInterval: 10000,
  });

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    retrying: <RotateCcw className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
    completed: <Check className="h-3.5 w-3.5 text-green-500" />,
    failed: <XCircle className="h-3.5 w-3.5 text-red-500" />,
    dead_letter: <AlertTriangle className="h-3.5 w-3.5 text-red-600" />,
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    retrying: 'Retentando',
    completed: 'Entregue',
    failed: 'Falhou',
    dead_letter: 'Dead Letter',
  };

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  const pending = deliveries?.filter(d => ['pending', 'retrying'].includes(d.status)).length ?? 0;
  const failed = deliveries?.filter(d => ['failed', 'dead_letter'].includes(d.status)).length ?? 0;
  const completed = deliveries?.filter(d => d.status === 'completed').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Fila de Entrega de Webhooks</h3>
            <p className="text-sm text-muted-foreground">Retry automático com backoff exponencial</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-lg font-bold">{pending}</span>
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold">{completed}</span>
              <span className="text-xs text-muted-foreground">Entregues</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-lg font-bold">{failed}</span>
              <span className="text-xs text-muted-foreground">Falharam</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {deliveries && deliveries.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {deliveries.map((delivery: any) => (
                  <div key={delivery.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 text-sm">
                    {statusIcons[delivery.status] || <Clock className="h-3.5 w-3.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate">{delivery.url}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabels[delivery.status] || delivery.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Tentativa {delivery.attempts}/{delivery.max_attempts}
                        </span>
                        {delivery.last_status_code && (
                          <Badge variant={delivery.last_status_code < 300 ? 'secondary' : 'destructive'} className="text-[10px]">
                            HTTP {delivery.last_status_code}
                          </Badge>
                        )}
                      </div>
                      {delivery.last_error && (
                        <p className="text-[10px] text-red-500 mt-0.5 truncate">{delivery.last_error}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma entrega de webhook registrada</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
