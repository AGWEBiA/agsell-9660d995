import React, { useState, useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Check, Crown, Zap, Users, Mail, MessageSquare, Bot, FileText, Loader2, ArrowRight, Shield, CreditCard,
  BarChart3, Target, Workflow, Globe, Clock, Sparkles, Phone, Calendar, Inbox, PieChart, Tag, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import { useActivePlans, Plan } from '@/hooks/useActivePlans';

// Features do sistema
const SYSTEM_FEATURES = [
  {
    icon: Users,
    title: 'CRM Completo',
    description: 'Gerencie contatos, empresas e negociações em um só lugar com visão 360° do cliente.'
  },
  {
    icon: Target,
    title: 'Pipeline de Vendas',
    description: 'Visualize e gerencie todo seu funil de vendas com drag & drop intuitivo.'
  },
  {
    icon: Bot,
    title: 'Automações Inteligentes',
    description: 'Automatize tarefas repetitivas, follow-ups e nutrição de leads automaticamente.'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integrado',
    description: 'Envie mensagens, receba notificações e gerencie conversas diretamente no CRM.'
  },
  {
    icon: Mail,
    title: 'E-mail Marketing',
    description: 'Crie campanhas, templates personalizados e acompanhe métricas de engajamento.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards em tempo real com métricas de vendas, conversão e performance.'
  },
  {
    icon: Sparkles,
    title: 'Lead Scoring',
    description: 'Pontue leads automaticamente e foque nos contatos com maior potencial.'
  },
  {
    icon: FileText,
    title: 'Formulários Web',
    description: 'Capture leads com formulários personalizados integrados ao seu site.'
  },
  {
    icon: Calendar,
    title: 'Gestão de Tarefas',
    description: 'Organize atividades, defina prioridades e nunca perca um follow-up.'
  },
  {
    icon: Inbox,
    title: 'Inbox Unificada',
    description: 'Todas as conversas de e-mail e WhatsApp centralizadas em uma só tela.'
  },
  {
    icon: Globe,
    title: 'API & Integrações',
    description: 'Conecte com outras ferramentas via API REST ou webhooks customizados.'
  },
  {
    icon: Clock,
    title: 'Histórico Completo',
    description: 'Timeline de atividades com todo o histórico de interações com cada contato.'
  },
];


const FEATURE_LABELS: Record<string, string> = {
  crm_basico: 'CRM Básico',
  pipeline: 'Pipeline de Vendas',
  tarefas: 'Gestão de Tarefas',
  automacoes: 'Automações',
  email_marketing: 'E-mail Marketing',
  analytics: 'Analytics Avançado',
  lead_scoring: 'Lead Scoring',
  whatsapp: 'WhatsApp Business',
  integrações: 'Integrações',
  api: 'API Pública',
  white_label: 'White Label',
  suporte_prioritario: 'Suporte Prioritário',
};

function PricingCard({ 
  plan, 
  billingCycle, 
  onSelect 
}: { 
  plan: Plan; 
  billingCycle: 'monthly' | 'yearly';
  onSelect: () => void;
}) {
  const isPro = plan.slug === 'professional';
  const isEnterprise = plan.slug === 'enterprise';
  const isFree = plan.price_monthly === 0;
  
  const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);
  const totalPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

  return (
    <Card className={cn(
      'relative transition-all hover:shadow-xl hover:-translate-y-1 duration-300 flex flex-col',
      isPro && 'border-primary border-2 shadow-lg lg:scale-105',
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs whitespace-nowrap">
            <Zap className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-7 px-4 sm:px-6">
        {isEnterprise && <Crown className="h-9 w-9 mx-auto mb-2 text-yellow-500" />}
        <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm sm:text-base line-clamp-2 min-h-[40px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center px-4 sm:px-6 flex-1 flex flex-col">
        <div className="mb-5">
          {isFree ? (
            <span className="text-4xl sm:text-5xl font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-4xl sm:text-5xl font-bold">R$ {price}</span>
              <span className="text-muted-foreground text-base sm:text-lg">/mês</span>
            </>
          )}
        </div>

        {!isFree && billingCycle === 'yearly' && (
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-4 font-medium">
            Cobrado R$ {totalPrice}/ano (economize 17%)
          </p>
        )}

        <div className="space-y-2.5 text-left mb-5">
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_users === -1 ? 'Usuários ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_emails_per_month === -1 ? 'E-mails ilimitados' : `${plan.max_emails_per_month.toLocaleString()} e-mails/mês`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
            <span>WhatsApp ilimitado</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Bot className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_automations === -1 ? 'Automações ilimitadas' : `${plan.max_automations} automações`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Brain className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month.toLocaleString()} req. IA/mês`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_forms === -1 ? 'Formulários ilimitados' : `${plan.max_forms} formulários`}</span>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2 mt-auto">
          {(plan.features || []).map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-left">{FEATURE_LABELS[feature] || feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pb-6 px-4 sm:px-6">
        <Button 
          className={cn(
            "w-full h-11 sm:h-12 text-sm sm:text-base",
            isPro && "bg-primary hover:bg-primary/90"
          )}
          variant={isPro ? 'default' : 'outline'}
          onClick={onSelect}
        >
          {isFree ? 'Começar' : 'Assinar Agora'}
          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

interface CheckoutFormData {
  name: string;
  email: string;
  organizationName: string;
  couponCode: string;
  paymentProvider: 'stripe' | 'kiwify';
}

export { GuestCheckoutDialog } from '@/components/pricing/GuestCheckoutDialog';

import { PricingSection } from '@/components/pricing/PricingSection';

export default function Pricing() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Pagamento confirmado! Verifique seu e-mail para as credenciais de acesso.');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Pagamento cancelado.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEO 
        title="Preços e Planos — Comece a partir de R$ 197/mês"
        description="Escolha o plano ideal da AG Sell para sua empresa. Economize mais de R$ 1.650/mês substituindo 6 ferramentas por uma única plataforma de CRM e IA."
      />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo variant="red" size="md" showText />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="h-3 w-3 mr-1" />
          CRM & Automação de Vendas
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Transforme leads em <span className="text-primary">clientes fiéis</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Plataforma completa de CRM com automações inteligentes, WhatsApp integrado, 
          e-mail marketing e analytics para acelerar suas vendas.
        </p>
      </section>

      {/* Pricing Section Component */}
      <PricingSection />

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Recursos Poderosos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para <span className="text-primary">vender mais</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
          {SYSTEM_FEATURES.map((feature, index) => (
            <Card key={index} className="border bg-card/50 hover:bg-card hover:shadow-md transition-all">
              <CardContent className="pt-5 sm:pt-6 px-5 sm:px-6">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="container mx-auto px-4 pb-20">
        <CompetitorComparison />
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AG Sell. Todos os direitos reservados.</p>
        </div>
      </footer>

      <WhatsAppFloatingButton />
    </div>
  );
}
