import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle } from 'lucide-react';

const severityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-blue-500/10 text-blue-700 border-blue-200', label: 'Baixa' },
  medium: { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: 'Média' },
  high: { color: 'bg-orange-500/10 text-orange-700 border-orange-200', label: 'Alta' },
  critical: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Crítica' },
};

export function SecurityAlertsPanel() {
  const { alerts, isLoading, unresolvedCount, resolveAlert } = useSecurityAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Alertas de Segurança</CardTitle>
        </CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Carregando...</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Alertas de Segurança
              {unresolvedCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unresolvedCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>Atividades suspeitas e alertas de segurança</CardDescription>
          </div>
          {unresolvedCount === 0 && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ShieldCheck className="h-4 w-4" /> Tudo seguro
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum alerta de segurança registrado.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {alerts.map((alert: any) => {
                const sev = severityConfig[alert.severity] || severityConfig.medium;
                return (
                  <div key={alert.id} className={`p-3 rounded-lg border ${alert.is_resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{alert.title}</span>
                            <Badge variant="outline" className={`text-xs ${sev.color}`}>{sev.label}</Badge>
                          </div>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                          )}
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      {!alert.is_resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlert.mutate(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                        </Button>
                      )}
                      {alert.is_resolved && (
                        <Badge variant="outline" className="text-green-600 text-xs">Resolvido</Badge>
                      )}
                    </div>
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
