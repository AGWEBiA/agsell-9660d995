import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAttribution } from '@/hooks/useAttribution';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from '@/lib/recharts';
import { GitBranch, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8B5CF6', '#EC4899'];

export default function Attribution() {
  const { touchpoints, isLoading, stats } = useAttribution();

  const channelData = stats?.byChannel
    ? Object.entries(stats.byChannel).map(([name, d]) => ({ name, ...d }))
    : [];

  const sourceData = stats?.bySource
    ? Object.entries(stats.bySource).map(([name, d]) => ({ name, ...d }))
    : [];

  const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Atribuição Multi-touch</h1>
        <p className="text-muted-foreground">Entenda quais canais e campanhas geram mais resultados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><GitBranch className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Touchpoints</p>
              <p className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><DollarSign className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Atribuída</p>
              <p className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10"><TrendingUp className="h-6 w-6 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Canais Ativos</p>
              <p className="text-2xl font-bold text-foreground">{channelData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-warning/10"><Eye className="h-6 w-6 text-warning" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Fontes</p>
              <p className="text-2xl font-bold text-foreground">{sourceData.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados de atribuição</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sourceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Touchpoints Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {touchpoints.slice(0, 30).map(tp => (
                <TableRow key={tp.id}>
                  <TableCell><Badge variant="outline">{tp.channel}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{tp.source || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{tp.campaign_name || '-'}</TableCell>
                  <TableCell><Badge variant="secondary">{tp.touchpoint_type}</Badge></TableCell>
                  <TableCell className="font-medium">R$ {Number(tp.revenue_attributed).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(tp.created_at), 'dd/MM HH:mm')}</TableCell>
                </TableRow>
              ))}
              {touchpoints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum touchpoint registrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
