import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDown, TrendingDown, TrendingUp, Users, DollarSign, Target, BarChart3, Loader2 } from 'lucide-react';
import { useFunnelMetrics } from '@/hooks/useFunnelMetrics';

export default function FunnelBI() {
  const [period, setPeriod] = useState('30d');
  const { funnelStats, automationMetrics } = useFunnelMetrics();

  const isLoading = funnelStats.isLoading || automationMetrics.isLoading;

  const funnelData = funnelStats.data?.map(stat => ({
    name: stat.out_stage_name,
    value: Number(stat.out_deal_count),
    totalValue: Number(stat.out_total_value),
    fill: stat.out_color || '#3B82F6',
    position: stat.out_position
  })) || [];

  const dropOffData = funnelData.map((stage, i, arr) => ({
    ...stage,
    dropOff: i > 0 && arr[i - 1].value > 0 ? Math.round((1 - stage.value / arr[i - 1].value) * 100) : 0,
    conversionRate: i > 0 && arr[i - 1].value > 0 ? Math.round((stage.value / arr[i - 1].value) * 100) : 100,
  }));

  const channelPerformance = automationMetrics.data?.map(m => ({
    channel: m.out_status,
    events: Number(m.out_event_count)
  })) || [];

  const totalConversions = funnelData.length > 0 ? funnelData[funnelData.length - 1].value : 0;
  const totalLeads = funnelData.length > 0 ? funnelData[0].value : 0;
  const totalConversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0';


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">BI do Funil</h1>
          <p className="text-muted-foreground">Dashboard visual com taxas de conversão e drop-off por etapa</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-blue-500/10"><Users className="h-6 w-6 text-blue-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Visitantes</p>
              <p className="text-2xl font-bold">{mockFunnelData[0].value.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-purple-500/10"><Target className="h-6 w-6 text-purple-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{mockFunnelData[1].value.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-green-500/10"><DollarSign className="h-6 w-6 text-green-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold">{mockFunnelData[mockFunnelData.length - 1].value.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-amber-500/10"><TrendingUp className="h-6 w-6 text-amber-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Conversão Total</p>
              <p className="text-2xl font-bold">{totalConversion}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Funil Visual</CardTitle>
          <CardDescription>Visualize as taxas de conversão e abandono entre cada etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-[500px] mx-auto space-y-0">
            {dropOffData.map((stage, i) => {
              const widthPercent = Math.max((stage.value / dropOffData[0].value) * 100, 20);
              return (
                <div key={stage.name}>
                  <div className="relative flex flex-col items-center">
                    <div
                      className="rounded-lg py-3 px-4 text-center text-white font-medium transition-all"
                      style={{ width: `${widthPercent}%`, backgroundColor: stage.fill, minWidth: '120px' }}
                    >
                      <p className="text-sm font-bold">{stage.name}</p>
                      <p className="text-xs opacity-90">{stage.value.toLocaleString()}</p>
                    </div>
                  </div>
                  {i < dropOffData.length - 1 && (
                    <div className="flex items-center justify-center gap-3 py-1.5">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />{dropOffData[i + 1].conversionRate}%
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />-{dropOffData[i + 1].dropOff}% drop
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="hsl(142 76% 36%)" name="Conversões" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conversão por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelPerformance.map(ch => (
                <div key={ch.channel} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{ch.channel}</span>
                    <span className="text-muted-foreground">{ch.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ch.rate * 5}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
