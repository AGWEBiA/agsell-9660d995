import React, { useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import { PricingSection } from '@/components/pricing/PricingSection';

// Features do sistema
const SYSTEM_FEATURES = [
  {
    icon: Zap,
    title: 'CRM Completo',
    description: 'Gerencie contatos, empresas e negociações em um só lugar com visão 360° do cliente.'
  },
  {
    icon: Zap,
    title: 'Pipeline de Vendas',
    description: 'Visualize e gerencie todo seu funil de vendas com drag & drop intuitivo.'
  },
  {
    icon: Zap,
    title: 'Automações Inteligentes',
    description: 'Automatize tarefas repetitivas, follow-ups e nutrição de leads automaticamente.'
  },
  {
    icon: Zap,
    title: 'WhatsApp Integrado',
    description: 'Envie mensagens, receba notificações e gerencie conversas diretamente no CRM.'
  },
  {
    icon: Zap,
    title: 'E-mail Marketing',
    description: 'Crie campanhas, templates personalizados e acompanhe métricas de engajamento.'
  },
  {
    icon: Zap,
    title: 'Analytics Avançado',
    description: 'Dashboards em tempo real com métricas de vendas, conversão e performance.'
  },
  {
    icon: Zap,
    title: 'Lead Scoring',
    description: 'Pontue leads automaticamente e foque nos contatos com maior potencial.'
  },
  {
    icon: Zap,
    title: 'Formulários Web',
    description: 'Capture leads com formulários personalizados integrados ao seu site.'
  },
];


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
