import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, FileSpreadsheet, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useImportJobs } from '@/hooks/useImportContacts';
import { useQueryClient } from '@tanstack/react-query';

function statusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Processando</Badge>;
    case 'pending':
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Na fila</Badge>;
    default:
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
  }
}

export function ImportJobsList() {
  const { data: jobs, isLoading, refetch } = useImportJobs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma importação realizada ainda.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Importações
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{statusBadge(job.status)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{job.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.success_count}/{job.total_rows} processados
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{job.total_rows.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.completed_at
                      ? new Date(job.completed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
