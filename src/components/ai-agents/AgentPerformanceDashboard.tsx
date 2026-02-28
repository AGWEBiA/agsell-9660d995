import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Star, UserCheck, Clock, TrendingUp, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AgentPerformanceDashboard() {
  const { currentOrganization } = useOrganization();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['ai_agents_perf', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name, is_active, channels, model')
        .eq('organization_id', currentOrganization.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: conversations = [], isLoading: loadingConvos } = useQuery({
    queryKey: ['ai_agent_conversations_perf', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || agents.length === 0) return [];
      const agentIds = agents.map(a => a.id);
      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .select('*')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && agents.length > 0,
  });

  const isLoading = loadingAgents || loadingConvos;

  // Compute metrics
  const totalConversations = conversations.length;
  const completedConversations = conversations.filter(c => c.status === 'completed' || c.ended_at);
  const transferredToHuman = conversations.filter(c => c.transferred_to_human);
  const withRating = conversations.filter(c => c.satisfaction_rating != null);
  const avgSatisfaction = withRating.length > 0
    ? (withRating.reduce((s, c) => s + (c.satisfaction_rating || 0), 0) / withRating.length).toFixed(1)
    : '—';
  const resolutionRate = totalConversations > 0
    ? Math.round(((completedConversations.length - transferredToHuman.length) / totalConversations) * 100)
    : 0;

  // Per-agent chart data
  const chartData = agents.map(agent => {
    const agentConvos = conversations.filter(c => c.agent_id === agent.id);
    const agentRated = agentConvos.filter(c => c.satisfaction_rating != null);
    return {
      name: agent.name.length > 12 ? agent.name.slice(0, 12) + '…' : agent.name,
      conversas: agentConvos.length,
      satisfacao: agentRated.length > 0
        ? +(agentRated.reduce((s, c) => s + (c.satisfaction_rating || 0), 0) / agentRated.length).toFixed(1)
        : 0,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance dos Agentes
        </h3>
        <p className="text-sm text-muted-foreground">Métricas consolidadas de todos os agentes de IA</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">{agents.length} agentes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction}<span className="text-sm text-muted-foreground">/5</span></div>
            <p className="text-xs text-muted-foreground">{withRating.length} avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">Sem transferência humana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferidos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferredToHuman.length}</div>
            <p className="text-xs text-muted-foreground">Para atendentes humanos</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversas por Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="conversas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-agent breakdown */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {agents.map(agent => {
          const agentConvos = conversations.filter(c => c.agent_id === agent.id);
          const rated = agentConvos.filter(c => c.satisfaction_rating != null);
          const avgR = rated.length > 0
            ? (rated.reduce((s, c) => s + (c.satisfaction_rating || 0), 0) / rated.length).toFixed(1)
            : '—';
          const transferred = agentConvos.filter(c => c.transferred_to_human).length;

          return (
            <Card key={agent.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{agentConvos.length}</p>
                    <p className="text-[10px] text-muted-foreground">Conversas</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{avgR}</p>
                    <p className="text-[10px] text-muted-foreground">Satisfação</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{transferred}</p>
                    <p className="text-[10px] text-muted-foreground">Transf.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
