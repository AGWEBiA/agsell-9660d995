import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Contact,
  Mail,
  MessageSquare,
  FileText,
  Bot,
  Zap,
  Target,
  Building2,
  CreditCard,
  Hash,
  Globe,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function SystemOverviewDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin_system_overview'],
    queryFn: async () => {
      const [
        { count: totalContacts },
        { count: totalDeals },
        { count: totalAutomations },
        { count: totalForms },
        { count: totalFormSubmissions },
        { count: totalConversations },
        { count: totalTasks },
        { count: totalAIAgents },
        { count: totalEmailCampaigns },
        { count: totalEmailDomains },
        { count: totalWhatsAppGroups },
        { count: totalUsers },
        { count: totalOrganizations },
        { count: totalTags },
        { count: totalCompanies },
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('deals').select('*', { count: 'exact', head: true }),
        supabase.from('automations').select('*', { count: 'exact', head: true }),
        supabase.from('forms').select('*', { count: 'exact', head: true }),
        supabase.from('form_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('ai_agents').select('*', { count: 'exact', head: true }),
        supabase.from('email_campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('email_domains').select('*', { count: 'exact', head: true }),
        supabase.from('whatsapp_groups').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
      ]);

      // Emails sent (sum of sent_count from campaigns)
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('sent_count, status');
      const totalEmailsSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;

      // Subscriptions by plan
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('status, plans(name)');
      const subsByPlan: Record<string, { active: number; total: number }> = {};
      subs?.forEach((s: any) => {
        const planName = s.plans?.name || 'Sem Plano';
        if (!subsByPlan[planName]) subsByPlan[planName] = { active: 0, total: 0 };
        subsByPlan[planName].total++;
        if (s.status === 'active') subsByPlan[planName].active++;
      });

      // Conversations by channel
      const { data: convos } = await supabase
        .from('conversations')
        .select('channel');
      const byChannel: Record<string, number> = {};
      convos?.forEach((c) => {
        const ch = c.channel || 'outro';
        byChannel[ch] = (byChannel[ch] || 0) + 1;
      });

      return {
        totalContacts: totalContacts || 0,
        totalDeals: totalDeals || 0,
        totalAutomations: totalAutomations || 0,
        totalForms: totalForms || 0,
        totalFormSubmissions: totalFormSubmissions || 0,
        totalConversations: totalConversations || 0,
        totalTasks: totalTasks || 0,
        totalAIAgents: totalAIAgents || 0,
        totalEmailCampaigns: totalEmailCampaigns || 0,
        totalEmailDomains: totalEmailDomains || 0,
        totalEmailsSent,
        totalWhatsAppGroups: totalWhatsAppGroups || 0,
        totalUsers: totalUsers || 0,
        totalOrganizations: totalOrganizations || 0,
        totalTags: totalTags || 0,
        totalCompanies: totalCompanies || 0,
        subsByPlan,
        byChannel,
      };
    },
    staleTime: 60000,
  });

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const subsPlanData = Object.entries(data.subsByPlan).map(([name, val]) => ({
    name,
    active: val.active,
    total: val.total,
  }));

  const channelData = Object.entries(data.byChannel).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1 - Core Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contatos Totais" value={data.totalContacts.toLocaleString('pt-BR')} icon={<Contact className="h-4 w-4" />} subtitle="Em todas as organizações" />
        <StatCard title="Usuários" value={data.totalUsers.toLocaleString('pt-BR')} icon={<Users className="h-4 w-4" />} subtitle={`${data.totalOrganizations} organizações`} />
        <StatCard title="Empresas" value={data.totalCompanies.toLocaleString('pt-BR')} icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="Negócios" value={data.totalDeals.toLocaleString('pt-BR')} icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Row 2 - Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="E-mails Enviados" value={data.totalEmailsSent.toLocaleString('pt-BR')} icon={<Mail className="h-4 w-4" />} subtitle={`${data.totalEmailCampaigns} campanhas • ${data.totalEmailDomains} domínios`} />
        <StatCard title="Conversas (Inbox)" value={data.totalConversations.toLocaleString('pt-BR')} icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard title="Grupos WhatsApp" value={data.totalWhatsAppGroups.toLocaleString('pt-BR')} icon={<Hash className="h-4 w-4" />} />
        <StatCard title="Automações" value={data.totalAutomations.toLocaleString('pt-BR')} icon={<Zap className="h-4 w-4" />} />
      </div>

      {/* Row 3 - More Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Formulários" value={data.totalForms.toLocaleString('pt-BR')} icon={<FileText className="h-4 w-4" />} subtitle={`${data.totalFormSubmissions} submissões`} />
        <StatCard title="Tarefas" value={data.totalTasks.toLocaleString('pt-BR')} icon={<Globe className="h-4 w-4" />} />
        <StatCard title="Agentes IA" value={data.totalAIAgents.toLocaleString('pt-BR')} icon={<Bot className="h-4 w-4" />} />
        <StatCard title="Tags" value={data.totalTags.toLocaleString('pt-BR')} icon={<Hash className="h-4 w-4" />} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscriptions by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinaturas por Plano
            </CardTitle>
            <CardDescription>Ativas vs total por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {subsPlanData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subsPlanData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="active" name="Ativas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversations by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversas por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {channelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {channelData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
