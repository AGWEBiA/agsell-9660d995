import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Activity, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function EdgeFunctionHealthDashboard() {
  const queryClient = useQueryClient();

  const { data: healthData = [], isLoading } = useQuery({
    queryKey: ['edge_function_health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_health')
        .select('*')
        .order('function_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const checkHealthMutation = useMutation({
    mutationFn: async (functionName: string) => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'ping' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edge_function_health'] });
      toast.success('Check de saúde concluído');
    },
    onError: (err: any) => {
      toast.error(`Falha no healthcheck: ${err.message}`);
    }
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Saúde das Edge Functions
            </CardTitle>
            <CardDescription>
              Status em tempo real e correlação por Deploy ID
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['edge_function_health'] })}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Lista
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Execução</TableHead>
              <TableHead>Deploy ID</TableHead>
              <TableHead>Métricas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma função reportou saúde ainda.
                </TableCell>
              </TableRow>
            ) : (
              healthData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.function_name}</TableCell>
                  <TableCell>
                    <Badge className={item.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {item.status === 'ok' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(item.last_execution_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
                      {item.last_deploy_id || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-green-600">✓ {item.success_count || 0}</span>
                      <span className="text-red-600">✗ {item.error_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => checkHealthMutation.mutate(item.function_name)}
                      disabled={checkHealthMutation.isPending}
                    >
                      <Activity className="h-3 w-3 mr-1" /> Ping
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
