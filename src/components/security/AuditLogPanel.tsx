import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Shield, UserCheck, Trash2, Edit, Plus, LogIn } from 'lucide-react';

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-500" />,
  update: <Edit className="h-4 w-4 text-blue-500" />,
  delete: <Trash2 className="h-4 w-4 text-destructive" />,
  login: <LogIn className="h-4 w-4 text-primary" />,
  export: <FileText className="h-4 w-4 text-amber-500" />,
  permission_change: <UserCheck className="h-4 w-4 text-purple-500" />,
};

const actionLabels: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  export: 'Exportação',
  permission_change: 'Permissão alterada',
};

export function AuditLogPanel() {
  const { logs, isLoading } = useAuditLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Audit Logs</CardTitle>
        </CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Carregando...</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Audit Logs</CardTitle>
        <CardDescription>Registro de todas as ações críticas na organização</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma ação registrada ainda.</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5">
                    {actionIcons[log.action] || <Shield className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.resource_type}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
