import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomations } from '@/hooks/useAutomations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle, Clock, AlertTriangle, MessageSquare, Mail, Phone, TrendingUp } from 'lucide-react';

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(220, 90%, 56%)'];

export default function AutomationMetrics() {
  const { automations } = useAutomations();
  const [selectedAutomation, setSelectedAutomation] = useState<string>('all');

  // Mock granular metrics per step/channel
  const stepMetrics = [
    { step: 'Enviar WhatsApp', channel: 'whatsapp', sent: 1250, delivered: 1180, failed: 70, opened: 980, clicked: 320, successRate: 94.4 },
    { step: 'Enviar E-mail', channel: 'email', sent: 1250, delivered: 1200, failed: 50, opened: 640, clicked: 180, successRate: 96.0 },
    { step: 'Enviar SMS', channel: 'sms', sent: 800, delivered: 760, failed: 40, opened: 0, clicked: 0, successRate: 95.0 },
    { step: 'Aguardar 24h', channel: 'system', sent: 1250, delivered: 1250, failed: 0, opened: 0, clicked: 0, successRate: 100 },
    { step: 'Adicionar Tag', channel: 'system', sent: 980, delivered: 980, failed: 0, opened: 0, clicked: 0, successRate: 100 },
    { step: 'Condição: Score > 50', channel: 'system', sent: 980, delivered: 620, failed: 360, opened: 0, clicked: 0, successRate: 63.3 },
  ];

  const channelSummary = [
    { channel: 'WhatsApp', icon: MessageSquare, total: 1250, success: 1180, fail: 70, rate: 94.4, color: 'text-green-600' },
    { channel: 'E-mail', icon: Mail, total: 1250, success: 1200, fail: 50, rate: 96.0, color: 'text-blue-600' },
    { channel: 'SMS', icon: Phone, total: 800, success: 760, fail: 40, rate: 95.0, color: 'text-purple-600' },
  ];

  const pieData = [
    { name: 'Sucesso', value: 3140 },
    { name: 'Falha', value: 160 },
    { name: 'Pendente', value: 80 },
  ];

  const chartData = stepMetrics.filter(s => s.channel !== 'system');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Métricas de Automação</h1>
          <p className="text-muted-foreground">Sucesso/falha granular por canal e etapa</p>
        </div>
        <Select value={selectedAutomation} onValueChange={setSelectedAutomation}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Automações</SelectItem>
            {automations.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Channel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channelSummary.map(ch => {
          const Icon = ch.icon;
          return (
            <Card key={ch.channel}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-muted"><Icon className={`h-6 w-6 ${ch.color}`} /></div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{ch.channel}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{ch.rate}%</p>
                      <span className="text-xs text-muted-foreground">sucesso</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-green-600">✓ {ch.success}</span>
                      <span className="text-red-600">✗ {ch.fail}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sucesso vs Falha por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="delivered" fill="hsl(142, 76%, 36%)" name="Sucesso" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(0, 84%, 60%)" name="Falha" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Etapa</CardTitle>
          <CardDescription>Métricas granulares de cada passo da automação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Enviados</TableHead>
                  <TableHead className="text-right">Entregues</TableHead>
                  <TableHead className="text-right">Falhas</TableHead>
                  <TableHead className="text-right">Abertos</TableHead>
                  <TableHead className="text-right">Clicados</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stepMetrics.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{s.step}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{s.channel}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{s.sent}</TableCell>
                    <TableCell className="text-right text-green-600">{s.delivered}</TableCell>
                    <TableCell className="text-right text-red-600">{s.failed > 0 ? s.failed : '-'}</TableCell>
                    <TableCell className="text-right">{s.opened > 0 ? s.opened : '-'}</TableCell>
                    <TableCell className="text-right">{s.clicked > 0 ? s.clicked : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={s.successRate >= 90 ? 'default' : s.successRate >= 70 ? 'secondary' : 'destructive'} className="text-[10px]">
                        {s.successRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
