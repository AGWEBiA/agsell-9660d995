import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans } from '@/hooks/usePlans';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, CreditCard, Calendar, CheckCircle2, AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SubscriptionTab() {
  const { currentOrganization } = useOrganization();
  const { subscription, currentPlan, isLoading } = usePlans();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    if (!currentOrganization?.id) return;

    if (subscription?.payment_provider === 'kiwify') {
      toast.info('Para gerenciar sua assinatura Kiwify, acesse sua conta em kiwify.com.br');
      window.open('https://dashboard.kiwify.com.br', '_blank');
      return;
    }

    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { organizationId: currentOrganization.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal de gerenciamento');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
    : null;

  const isLegacy = subscription?.payment_provider === 'kiwify';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinatura Atual
          </CardTitle>
          <CardDescription>
            Gerencie os detalhes do seu plano e ciclo de faturamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plano</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{currentPlan?.name || 'Nenhum'}</p>
                {subscription?.status === 'active' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ciclo de Cobrança</p>
              <p className="text-lg font-medium capitalize">
                {subscription?.billing_cycle === 'yearly' ? 'Anual' : subscription?.billing_cycle === 'monthly' ? 'Mensal' : 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Próxima Renovação</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium">{periodEnd || 'N/A'}</p>
              </div>
            </div>
          </div>

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                Sua assinatura foi cancelada e expirará em {periodEnd}. Após esta data, o acesso aos recursos pagos será interrompido.
              </p>
            </div>
          )}

          {isLegacy && (
            <div className="bg-indigo-100/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-semibold">Ação Necessária: Migração para o Stripe</p>
              </div>
              <p className="text-sm text-indigo-900 dark:text-indigo-200 opacity-90">
                Sua assinatura atual está no Kiwify. Recomendamos a migração para o Stripe para uma melhor experiência de gestão.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white dark:bg-indigo-950 border-indigo-200 text-indigo-700"
                onClick={() => window.location.href = '/plans'}
              >
                Ver Planos no Stripe
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {subscription?.payment_provider === 'stripe' 
                ? 'Pagamentos processados com segurança via Stripe' 
                : 'Pagamentos via Kiwify (legado)'}
            </p>
            <Button 
              onClick={handleManageSubscription} 
              disabled={isLoadingPortal || !subscription}
              className={cn(isLegacy && "bg-indigo-600 hover:bg-indigo-700 text-white")}
            >
              {isLoadingPortal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isLegacy ? (
                <ExternalLink className="h-4 w-4 mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {isLegacy ? 'Acessar Kiwify para Cancelar' : 'Gerenciar Pagamento e Plano'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dúvidas sobre Faturamento?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Se você tiver alguma dúvida sobre suas faturas, queira solicitar um reembolso ou precisar de suporte com seu plano, entre em contato com nossa equipe de suporte.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.href = '/support-tickets'}>
            Abrir Chamado de Suporte
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
