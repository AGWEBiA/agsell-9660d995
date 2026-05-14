import { AlertTriangle, CreditCard, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { usePlans } from '@/hooks/usePlans';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SubscriptionExpired() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isPastDue } = useSubscriptionStatus();
  const { currentPlan, subscription } = usePlans();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    if (!currentPlan) {
      navigate('/plans');
      return;
    }

    const billingCycle = subscription?.billing_cycle ?? 'monthly';
    const planAny = currentPlan as any;
    const kiwifyUrl =
      billingCycle === 'yearly'
        ? planAny.kiwify_checkout_url_yearly || planAny.kiwify_checkout_url
        : planAny.kiwify_checkout_url || planAny.kiwify_checkout_url_yearly;

    if (kiwifyUrl) {
      window.location.href = kiwifyUrl;
      return;
    }

    // Fallback: try generating a Kiwify checkout via edge function
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-kiwify-checkout', {
        body: {
          planId: currentPlan.id,
          billingCycle,
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          organizationName: currentOrganization?.name || '',
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Sem URL de checkout');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível abrir o checkout. Redirecionando para os planos.');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {isPastDue ? 'Pagamento Atrasado' : 'Assinatura Expirada'}
          </CardTitle>
          <CardDescription className="text-base">
            {isPastDue
              ? 'O pagamento da sua assinatura não foi confirmado pelo gateway de pagamento. Atualize sua forma de pagamento para continuar.'
              : 'Sua assinatura não foi renovada e o acesso ao sistema está temporariamente bloqueado.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Seu plano</p>
              <p className="font-semibold">{currentPlan.name}</p>
              <p className="text-sm text-muted-foreground">
                R$ {(subscription?.billing_cycle === 'yearly' ? currentPlan.price_yearly : currentPlan.price_monthly)?.toFixed(0)}
                /{subscription?.billing_cycle === 'yearly' ? 'ano' : 'mês'}
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Para continuar utilizando o AG Sell, renove sua assinatura ou entre em contato com o suporte.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRenew} className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Renovar Assinatura
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full gap-2" disabled={loading}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
