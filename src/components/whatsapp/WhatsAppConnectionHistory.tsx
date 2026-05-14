import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity, ArrowRight, Smartphone, Clock, ShieldCheck, Globe
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Conectado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  connected: { label: 'Conectado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  connecting: { label: 'Conectando', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  disconnected: { label: 'Desconectado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  close: { label: 'Fechado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  not_found: { label: 'Não Encontrado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  unknown: { label: 'Desconhecido', color: 'bg-muted text-muted-foreground border-border' },
  unknown_retry_pending: { label: 'Pendente Retentativa', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const sourceLabels: Record<string, string> = {
  webhook: 'Webhook (Evolution)',
  manual_sync: 'Sincronização Manual',
  qrcode_check: 'Checagem Automática',
};

export function WhatsAppConnectionHistory() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['whatsapp-connection-history', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('whatsapp_connection_history')
        .select('*, organization_integrations(name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'unknown';
    const cfg = statusConfig[s] || statusConfig.unknown;
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 h-5 font-medium ${cfg.color}`}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" /> Trilhas de Auditoria de Conexão
        </CardTitle>
        <CardDescription>Histórico detalhado de mudanças no estado das instâncias</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum evento de conexão registrado.</p>
          </div>
        ) : (
          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-3">
              {history.map((item: any) => (
                <div key={item.id} className="group relative flex flex-col gap-2 p-3 rounded-xl border border-border bg-card/50 hover:bg-muted/30 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {item.organization_integrations?.name || 'Instância Desconhecida'}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                            {item.event_source === 'webhook' ? 'Live' : 'Check'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "dd 'de' MMM, HH:mm:ss", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(item.old_status)}
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {getStatusBadge(item.new_status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2 mt-1">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Origem: <span className="text-foreground font-medium">{sourceLabels[item.event_source] || item.event_source}</span>
                    </div>
                    {item.payload?.instance?.owner && (
                      <div className="text-foreground/70 font-mono">
                        UID: {String(item.payload.instance.owner).split('@')[0]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
