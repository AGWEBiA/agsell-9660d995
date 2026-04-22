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
  Plug, Unplug, RefreshCw, TestTube, Settings, Power, PowerOff, FileText,
} from 'lucide-react';

const actionConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  connect: { icon: <Plug className="h-4 w-4" />, label: 'Conexão', color: 'text-emerald-500' },
  disconnect: { icon: <Unplug className="h-4 w-4" />, label: 'Desconexão', color: 'text-destructive' },
  sync: { icon: <RefreshCw className="h-4 w-4" />, label: 'Sincronização', color: 'text-blue-500' },
  test: { icon: <TestTube className="h-4 w-4" />, label: 'Teste', color: 'text-amber-500' },
  update: { icon: <Settings className="h-4 w-4" />, label: 'Configuração', color: 'text-primary' },
  activate: { icon: <Power className="h-4 w-4" />, label: 'Ativação', color: 'text-emerald-500' },
  deactivate: { icon: <PowerOff className="h-4 w-4" />, label: 'Desativação', color: 'text-muted-foreground' },
};

export function WhatsAppAuditLog() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['whatsapp-audit-logs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .eq('resource_type', 'whatsapp_instance')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const getConfig = (action: string) =>
    actionConfig[action] || { icon: <FileText className="h-4 w-4" />, label: action, color: 'text-muted-foreground' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" /> Histórico de Ações WhatsApp
        </CardTitle>
        <CardDescription>Registro de conexões, testes, sincronizações e configurações</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {logs.map((log: any) => {
                const cfg = getConfig(log.action);
                const details = log.details as Record<string, unknown> | null;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                        {details?.instance_name && (
                          <span className="text-xs text-muted-foreground truncate">
                            {String(details.instance_name)}
                          </span>
                        )}
                      </div>
                      {details && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {Object.entries(details)
                            .filter(([k]) => k !== 'instance_name')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ') || ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
