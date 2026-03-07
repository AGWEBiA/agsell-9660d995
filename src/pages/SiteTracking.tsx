import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Monitor, Smartphone, Globe, Clock, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function SiteTracking() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['site-tracking-sessions', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_tracking_sessions')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const totalVisitors = new Set(sessions.map(s => s.visitor_id)).size;
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length)
    : 0;

  const deviceCounts: Record<string, number> = {};
  sessions.forEach(s => {
    const d = s.device_type || 'Desconhecido';
    deviceCounts[d] = (deviceCounts[d] || 0) + 1;
  });
  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, sessões: value }));

  const pageCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.first_page) {
      const page = new URL(s.first_page, 'http://x').pathname;
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    }
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Site Tracking</h1>
        <p className="text-muted-foreground">Monitore visitantes e sessões do seu site em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              <p className="text-2xl font-bold text-foreground">{totalVisitors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10"><Eye className="h-6 w-6 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessões</p>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><Clock className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Duração Média</p>
              <p className="text-2xl font-bold text-foreground">{Math.floor(avgDuration / 60)}m {avgDuration % 60}s</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-warning/10"><Monitor className="h-6 w-6 text-warning" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Dispositivos</p>
              <p className="text-2xl font-bold text-foreground">{Object.keys(deviceCounts).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sessões por Dispositivo</CardTitle></CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados de sessão. Instale o snippet de tracking.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Páginas Mais Visitadas</CardTitle></CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">{i + 1}</Badge>
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{p.page}</span>
                    </div>
                    <Badge variant="secondary">{p.count} visitas</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sessões Recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Primeira Página</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 30).map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.visitor_id?.substring(0, 8)}...</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">{s.first_page || '-'}</TableCell>
                  <TableCell>
                    {s.device_type === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s` : '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.country || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(s.started_at), 'dd/MM HH:mm')}</TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma sessão registrada. Instale o snippet de Event Tracking para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
