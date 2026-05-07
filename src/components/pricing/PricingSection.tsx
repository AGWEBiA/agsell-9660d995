import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, Zap, Users, Mail, MessageSquare, Bot, FileText, Loader2, ArrowRight, Brain, PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePlans, Plan } from '@/hooks/useActivePlans';
import { GuestCheckoutDialog } from './GuestCheckoutDialog';

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

interface PricingCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  onSelect: () => void;
}

function PricingCard({ plan, billingCycle, onSelect }: PricingCardProps) {
  const isPro = plan.slug === 'professional';
  const isFree = plan.price_monthly === 0;
  
  const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);
  const totalPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

  return (
    <Card className={cn(
      'relative transition-all hover:shadow-xl hover:-translate-y-1 duration-300 flex flex-col',
      isPro && 'border-primary border-2 shadow-lg',
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs whitespace-nowrap">
            <Zap className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-7 px-4">
        <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2 min-h-[40px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center px-4 flex-1 flex flex-col">
        <div className="mb-5">
          {isFree ? (
            <span className="text-4xl font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-4xl font-bold">R$ {price}</span>
              <span className="text-muted-foreground text-base">/mês</span>
            </>
          )}
        </div>

        {!isFree && billingCycle === 'yearly' && (
          <p className="text-xs text-green-600 dark:text-green-400 mb-4 font-medium">
            Cobrado R$ {totalPrice}/ano
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
            <span>IA ilimitada</span>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2 mt-auto">
          {(plan.features || []).slice(0, 5).map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-left">{FEATURE_LABELS[feature] || feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pb-6 px-4">
        <Button 
          className={cn("w-full h-11", isPro && "bg-primary hover:bg-primary/90")}
          variant={isPro ? 'default' : 'outline'}
          onClick={onSelect}
        >
          {isFree ? 'Começar' : 'Assinar Agora'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PricingSection() {
  const { plans, isLoading } = useActivePlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div id="planos" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <PieChart className="h-3 w-3 mr-1" />
            Planos & Preços
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Escolha o plano ideal para seu <span className="text-primary">negócio</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Escolha o plano ideal e escale conforme sua equipe cresce
          </p>

          <div className="inline-flex items-center gap-4 bg-muted/20 p-1 rounded-full border border-white/10">
            <button
              className={cn(
                "px-6 py-2 rounded-full transition-all text-sm",
                billingCycle === 'monthly' 
                  ? "bg-primary text-white shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setBillingCycle('monthly')}
            >
              Mensal
            </button>
            <button
              className={cn(
                "px-6 py-2 rounded-full transition-all text-sm flex items-center gap-2",
                billingCycle === 'yearly' 
                  ? "bg-primary text-white shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setBillingCycle('yearly')}
            >
              Anual
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none px-1.5 py-0">
                -17%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>

        <GuestCheckoutDialog
          plan={selectedPlan}
          billingCycle={billingCycle}
          open={showCheckout}
          onOpenChange={setShowCheckout}
        />
      </div>
    </div>
  );
}
