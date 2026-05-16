import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, Shield, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plan } from '@/hooks/useActivePlans';

interface CheckoutFormData {
  name: string;
  email: string;
  organizationName: string;
  couponCode: string;
  paymentProvider: 'stripe' | 'kiwify';
}

interface GuestCheckoutDialogProps {
  plan: Plan | null;
  billingCycle: 'monthly' | 'yearly';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestCheckoutDialog({ 
  plan, 
  billingCycle,
  open, 
  onOpenChange 
}: GuestCheckoutDialogProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    organizationName: '',
    couponCode: '',
    paymentProvider: 'stripe',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);

  if (!plan) return null;

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const isFree = plan.price_monthly === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.organizationName) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      if (formData.paymentProvider === 'kiwify') {
        const { data, error } = await supabase.functions.invoke('create-kiwify-checkout', {
          body: {
            planId: plan.id,
            billingCycle,
            name: formData.name,
            email: formData.email,
            organizationName: formData.organizationName,
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
          toast.info('Você será redirecionado para a Kiwify para completar o pagamento.');
          onOpenChange(false);
        } else {
          throw new Error(data?.error || 'Erro ao gerar link Kiwify');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('guest-checkout', {
          body: {
            planId: plan.id,
            billingCycle,
            name: formData.name,
            email: formData.email,
            organizationName: formData.organizationName,
            couponCode: formData.couponCode || undefined,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else if (data?.success) {
          toast.success('Conta criada! Verifique seu e-mail para as credenciais de acesso.');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isFree ? 'Criar Conta Gratuita' : `Assinar ${plan.name}`}
          </DialogTitle>
          <DialogDescription>
            {isFree 
              ? 'Preencha seus dados para criar sua conta gratuita' 
              : 'Preencha seus dados para continuar com o pagamento'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-name">Seu Nome</Label>
            <Input
              id="checkout-name"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-email">E-mail</Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="joao@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-organizationName">Nome da Empresa</Label>
            <Input
              id="checkout-organizationName"
              placeholder="Minha Empresa LTDA"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              required
            />
          </div>

          {!isFree && (
            <>
              {!showCouponField ? (
                <button 
                  type="button" 
                  onClick={() => setShowCouponField(true)}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Tag className="h-3 w-3" />
                  Tenho um cupom
                </button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="checkout-coupon">Cupom</Label>
                  <Input
                    id="checkout-coupon"
                    placeholder="CODIGO"
                    value={formData.couponCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  />
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{plan.name}</span>
                  <span className="font-bold">
                    R$ {price}/{billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {billingCycle === 'yearly' 
                    ? 'Cobrança anual com 17% de desconto' 
                    : 'Cobrança mensal recorrente'
                  }
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            {isFree 
              ? 'Seus dados estão protegidos' 
              : 'Pagamento seguro processado pelo Stripe'
            }
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFree ? 'Criar Conta' : 'Continuar para Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
