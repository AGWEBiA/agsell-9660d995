import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  DollarSign,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Server,
  Zap,
  Shield,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const BRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const USD = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// Pricing constants
const RESEND_FREE_EMAILS = 3000;
const RESEND_PRICE_PER_1K = 0.80; // USD
const SES_PRICE_PER_1K = 0.10; // USD
const EMAILS_PER_LEAD_PER_MONTH = 4;
const USD_TO_BRL = 5.20;

interface Scenario {
  clients: number;
  leadsMin: number;
  leadsMax: number;
  leadsAvg: number;
}

const scenarios: Scenario[] = [
  { clients: 10, leadsMin: 1000, leadsMax: 5000, leadsAvg: 3000 },
  { clients: 30, leadsMin: 3000, leadsMax: 10000, leadsAvg: 6500 },
  { clients: 50, leadsMin: 5000, leadsMax: 20000, leadsAvg: 12500 },
  { clients: 100, leadsMin: 10000, leadsMax: 30000, leadsAvg: 20000 },
];

function calcResendCost(totalEmails: number): number {
  const billable = Math.max(0, totalEmails - RESEND_FREE_EMAILS);
  return (billable / 1000) * RESEND_PRICE_PER_1K;
}

function calcSESCost(totalEmails: number): number {
  return (totalEmails / 1000) * SES_PRICE_PER_1K;
}

function generateProjection(scenario: Scenario) {
  const rows = [scenario.leadsMin, scenario.leadsAvg, scenario.leadsMax].map((leads) => {
    const totalLeads = scenario.clients * leads;
    const totalEmails = totalLeads * EMAILS_PER_LEAD_PER_MONTH;
    const resendUSD = calcResendCost(totalEmails);
    const sesUSD = calcSESCost(totalEmails);
    const savingsUSD = resendUSD - sesUSD;
    const savingsPercent = resendUSD > 0 ? (savingsUSD / resendUSD) * 100 : 0;

    return {
      leadsPerClient: leads,
      totalLeads,
      totalEmails,
      resendUSD,
      resendBRL: resendUSD * USD_TO_BRL,
      sesUSD,
      sesBRL: sesUSD * USD_TO_BRL,
      savingsUSD,
      savingsBRL: savingsUSD * USD_TO_BRL,
      savingsPercent,
    };
  });

  return rows;
}

const implementationSteps = {
  resend: [
    {
      title: '1. Criar conta no Resend',
      description: 'Acesse resend.com e crie uma conta gratuita. O plano free inclui 3.000 e-mails/mês.',
      details: [
        'Acesse https://resend.com e clique em "Get Started"',
        'Verifique seu e-mail e acesse o dashboard',
        'O plano gratuito já permite testar a integração',
      ],
    },
    {
      title: '2. Verificar domínio de envio',
      description: 'Configure e verifique seu domínio para enviar e-mails com endereço próprio.',
      details: [
        'No dashboard Resend, vá em "Domains" → "Add Domain"',
        'Adicione seu domínio (ex: agsell.com)',
        'Configure os registros DNS (MX, TXT, DKIM) no seu provedor de DNS',
        'Aguarde a verificação (geralmente 5-30 minutos)',
      ],
    },
    {
      title: '3. Gerar API Key',
      description: 'Crie uma chave de API para autenticação.',
      details: [
        'No dashboard Resend, vá em "API Keys" → "Create API Key"',
        'Dê um nome descritivo (ex: "AG Sell Production")',
        'Selecione permissões "Sending access" para o domínio verificado',
        'Copie e guarde a chave gerada (ela só aparece uma vez)',
      ],
    },
    {
      title: '4. Configurar integração no AG Sell',
      description: 'Adicione as credenciais na plataforma.',
      details: [
        'Acesse Integrações → E-mail → Resend',
        'Cole a API Key gerada',
        'Configure o e-mail remetente (deve usar o domínio verificado)',
        'Teste enviando um e-mail de teste',
      ],
    },
    {
      title: '5. Monitorar envios',
      description: 'Acompanhe métricas e entregas.',
      details: [
        'O dashboard do Resend mostra entregas, aberturas e bounces',
        'Configure alertas para falhas de envio',
        'Monitore a reputação do domínio',
        'Revise limites do plano e faça upgrade conforme necessário',
      ],
    },
  ],
  ses: [
    {
      title: '1. Criar conta AWS',
      description: 'Se ainda não possui, crie uma conta na Amazon Web Services.',
      details: [
        'Acesse https://aws.amazon.com e crie uma conta',
        'Complete a verificação de identidade e dados de pagamento',
        'O SES tem um período sandbox inicial para testes',
      ],
    },
    {
      title: '2. Solicitar saída do Sandbox',
      description: 'Por padrão, o SES opera em modo sandbox com limitações.',
      details: [
        'No Console AWS, vá para SES → Account Dashboard',
        'Clique em "Request Production Access"',
        'Preencha o formulário explicando seu caso de uso (CRM, marketing automation)',
        'Informe volume esperado e práticas anti-spam',
        'A aprovação geralmente leva 24-48h',
      ],
    },
    {
      title: '3. Verificar domínio e configurar DKIM/SPF',
      description: 'Configure autenticação de e-mail para máxima entregabilidade.',
      details: [
        'Em SES → Verified Identities → Create Identity',
        'Selecione "Domain" e insira seu domínio',
        'Configure os registros DKIM (3 registros CNAME) no DNS',
        'Adicione registro SPF (TXT) ao DNS',
        'Configure DMARC para proteção adicional',
        'Aguarde propagação DNS (até 72h, geralmente < 24h)',
      ],
    },
    {
      title: '4. Criar credenciais IAM',
      description: 'Crie um usuário IAM com permissões restritas ao SES.',
      details: [
        'No Console AWS, vá para IAM → Users → Create User',
        'Nome sugerido: "agsell-ses-sender"',
        'Anexe a política "AmazonSESFullAccess" (ou crie uma mais restritiva)',
        'Gere Access Key ID e Secret Access Key',
        'Guarde as credenciais com segurança (aparecem uma vez)',
      ],
    },
    {
      title: '5. Selecionar região AWS',
      description: 'Escolha a região mais próxima dos seus destinatários.',
      details: [
        'Regiões recomendadas para Brasil: us-east-1 (Virginia) ou sa-east-1 (São Paulo)',
        'sa-east-1 tem menor latência para destinatários no Brasil',
        'us-east-1 tem mais IPs de saída e maior throughput',
        'Considere custo vs latência na escolha',
      ],
    },
    {
      title: '6. Configurar integração no AG Sell',
      description: 'Adicione as credenciais AWS na plataforma.',
      details: [
        'Acesse Integrações → E-mail → Amazon SES',
        'Insira o Access Key ID e Secret Access Key',
        'Selecione a região AWS configurada',
        'Configure o e-mail remetente (deve usar o domínio verificado)',
        'Teste enviando um e-mail de teste',
      ],
    },
    {
      title: '7. Configurar monitoramento',
      description: 'Implemente monitoramento para manter alta entregabilidade.',
      details: [
        'Configure SNS Notifications para bounces e complaints no console SES',
        'Mantenha taxa de bounce abaixo de 5%',
        'Mantenha taxa de complaint abaixo de 0.1%',
        'Use o SES Dashboard para acompanhar reputação',
        'Configure alarmes CloudWatch para métricas críticas',
      ],
    },
  ],
};

export function EmailCostProjection() {
  const [activeScenario, setActiveScenario] = useState(0);

  const chartData = scenarios.map((s) => {
    const totalEmails = s.clients * s.leadsAvg * EMAILS_PER_LEAD_PER_MONTH;
    return {
      name: `${s.clients} clientes`,
      Resend: Math.round(calcResendCost(totalEmails) * USD_TO_BRL),
      'Amazon SES': Math.round(calcSESCost(totalEmails) * USD_TO_BRL),
    };
  });

  const currentProjection = generateProjection(scenarios[activeScenario]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Projeção de Custos — E-mail
        </h2>
        <p className="text-muted-foreground mt-1">
          Comparativo Resend vs Amazon SES • Base: {EMAILS_PER_LEAD_PER_MONTH} e-mails/lead/mês • Câmbio: R$ {USD_TO_BRL.toFixed(2)}
        </p>
      </div>

      {/* Provider comparison cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Resend
              </CardTitle>
              <Badge variant="outline">DX Superior</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço por 1K e-mails</span>
              <span className="font-medium">{USD(RESEND_PRICE_PER_1K)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mails grátis/mês</span>
              <span className="font-medium">{RESEND_FREE_EMAILS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Setup</span>
              <span className="font-medium text-green-600">~30 min</span>
            </div>
            <div className="pt-2 space-y-1">
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />API simples e moderna</p>
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />SDK nativo, webhooks fáceis</p>
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />Dashboard intuitivo</p>
              <p className="flex items-center gap-1.5 text-yellow-600"><AlertTriangle className="h-3.5 w-3.5" />Custo alto em escala</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-2/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-chart-2" />
                Amazon SES
              </CardTitle>
              <Badge variant="outline" className="border-chart-2/30 text-chart-2">Custo-Eficiente</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço por 1K e-mails</span>
              <span className="font-medium">{USD(SES_PRICE_PER_1K)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mails grátis/mês</span>
              <span className="font-medium">62.000 (via EC2)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Setup</span>
              <span className="font-medium text-yellow-600">~2-4h + aprovação</span>
            </div>
            <div className="pt-2 space-y-1">
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />~8x mais barato que Resend</p>
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />Infraestrutura enterprise-grade</p>
              <p className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-3.5 w-3.5" />Escala ilimitada</p>
              <p className="flex items-center gap-1.5 text-yellow-600"><AlertTriangle className="h-3.5 w-3.5" />Setup mais complexo (AWS)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparativo de Custo Mensal (R$) — Média de leads
          </CardTitle>
          <CardDescription>
            Valores em reais considerando média de leads por cliente em cada cenário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => BRL(value)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Resend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Amazon SES" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção Detalhada por Cenário</CardTitle>
          <CardDescription>Selecione um cenário para ver os custos estimados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveScenario(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeScenario === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s.clients} clientes
              </button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{scenarios[activeScenario].clients} clientes</span>
            {' '}com {scenarios[activeScenario].leadsMin.toLocaleString()} a {scenarios[activeScenario].leadsMax.toLocaleString()} leads cada
          </div>

          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leads/Cliente</TableHead>
                  <TableHead className="text-right">Total Leads</TableHead>
                  <TableHead className="text-right">E-mails/mês</TableHead>
                  <TableHead className="text-right">Resend (R$)</TableHead>
                  <TableHead className="text-right">SES (R$)</TableHead>
                  <TableHead className="text-right">Economia</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProjection.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.leadsPerClient.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.totalLeads.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.totalEmails.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{BRL(row.resendBRL)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{BRL(row.sesBRL)}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-green-600">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {BRL(row.savingsBRL)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-green-600">
                        {row.savingsPercent.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Annual projection */}
          <div className="grid gap-3 md:grid-cols-2 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Custo Anual Resend (média)</p>
                <p className="text-xl font-bold text-foreground">
                  {BRL(currentProjection[1].resendBRL * 12)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Custo Anual Amazon SES (média)</p>
                <p className="text-xl font-bold text-green-600">
                  {BRL(currentProjection[1].sesBRL * 12)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Economia anual: {BRL(currentProjection[1].savingsBRL * 12)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Implementation guides */}
      <Tabs defaultValue="resend">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Guia de Implementação
          </h3>
          <TabsList>
            <TabsTrigger value="resend">Resend</TabsTrigger>
            <TabsTrigger value="ses">Amazon SES</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resend" className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Recomendado para: MVP e operações até 50K leads</p>
                  <p className="text-sm text-muted-foreground">Setup rápido, DX superior, ideal para validação e crescimento inicial.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {implementationSteps.resend.map((step, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  {step.title.replace(/^\d+\.\s/, '')}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.details.map((detail, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ses" className="space-y-4">
          <Card className="bg-chart-2/5 border-chart-2/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-chart-2 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Recomendado para: Operações com 50K+ leads ou foco em economia</p>
                  <p className="text-sm text-muted-foreground">Máxima economia, infraestrutura enterprise, ideal para escala.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Tempo estimado: 2-4 horas + até 48h para aprovação de produção</p>
                  <p className="text-sm text-muted-foreground">A AWS precisa aprovar a saída do sandbox antes de enviar e-mails em produção.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {implementationSteps.ses.map((step, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  {step.title.replace(/^\d+\.\s/, '')}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.details.map((detail, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
