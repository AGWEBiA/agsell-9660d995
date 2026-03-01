import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Send, Phone, ShoppingBag, Plus, Bot, Smartphone, Store, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Telegram hooks
function useTelegramBots() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  return useQuery({
    queryKey: ['telegram_bots', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('telegram_bots').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });
}

function useCreateTelegramBot() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (bot: { bot_username: string }) => {
      const { data, error } = await supabase.from('telegram_bots').insert({ ...bot, organization_id: currentOrganization!.id, created_by: user!.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['telegram_bots'] }); toast({ title: 'Bot Telegram adicionado' }); },
    onError: (e: Error) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });
}

// SMS hooks
function useSmsConfigs() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  return useQuery({
    queryKey: ['sms_configs', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sms_configs').select('*').eq('organization_id', orgId!);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });
}

function useCreateSmsConfig() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (config: { provider: string; from_number: string }) => {
      const { data, error } = await supabase.from('sms_configs').insert({ ...config, organization_id: currentOrganization!.id, created_by: user!.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms_configs'] }); toast({ title: 'SMS configurado' }); },
    onError: (e: Error) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });
}

// Shopify hooks
function useShopifyIntegrations() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  return useQuery({
    queryKey: ['shopify_integrations', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('shopify_integrations').select('*').eq('organization_id', orgId!);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });
}

function useCreateShopifyIntegration() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (config: { shop_domain: string }) => {
      const { data, error } = await supabase.from('shopify_integrations').insert({ ...config, organization_id: currentOrganization!.id, created_by: user!.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopify_integrations'] }); toast({ title: 'Shopify conectado' }); },
    onError: (e: Error) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });
}

export default function Channels() {
  const [telegramForm, setTelegramForm] = useState({ bot_username: '' });
  const [smsForm, setSmsForm] = useState({ provider: 'twilio', from_number: '' });
  const [shopifyForm, setShopifyForm] = useState({ shop_domain: '' });
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const { data: bots = [], isLoading: loadingBots } = useTelegramBots();
  const createBot = useCreateTelegramBot();
  const { data: smsConfigs = [], isLoading: loadingSms } = useSmsConfigs();
  const createSms = useCreateSmsConfig();
  const { data: shopifyIntegrations = [], isLoading: loadingShopify } = useShopifyIntegrations();
  const createShopify = useCreateShopifyIntegration();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Send className="h-8 w-8 text-primary" />
          Canais
        </h1>
        <p className="text-muted-foreground">Configure Telegram, SMS e Shopify</p>
      </div>

      <Tabs defaultValue="telegram" className="space-y-6">
        <TabsList>
          <TabsTrigger value="telegram" className="gap-2"><Bot className="h-4 w-4" />Telegram</TabsTrigger>
          <TabsTrigger value="sms" className="gap-2"><Smartphone className="h-4 w-4" />SMS</TabsTrigger>
          <TabsTrigger value="shopify" className="gap-2"><Store className="h-4 w-4" />Shopify</TabsTrigger>
        </TabsList>

        {/* Telegram */}
        <TabsContent value="telegram" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para usar o Telegram, você precisará criar um bot via @BotFather e configurar o token nas configurações do sistema.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Dialog open={openDialog === 'telegram'} onOpenChange={v => setOpenDialog(v ? 'telegram' : null)}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Adicionar Bot</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Bot Telegram</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Username do Bot (sem @)</Label>
                    <Input value={telegramForm.bot_username} onChange={e => setTelegramForm({ bot_username: e.target.value })} placeholder="meu_bot" />
                  </div>
                  <Button className="w-full" disabled={createBot.isPending} onClick={() => {
                    createBot.mutate(telegramForm, { onSuccess: () => { setOpenDialog(null); setTelegramForm({ bot_username: '' }); } });
                  }}>
                    {createBot.isPending ? 'Adicionando...' : 'Adicionar Bot'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingBots ? <Skeleton className="h-32" /> : bots.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum bot Telegram configurado</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bots.map((bot: any) => (
                <Card key={bot.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-5 w-5" />@{bot.bot_username || 'sem nome'}
                      </CardTitle>
                      <Badge variant={bot.is_active ? 'default' : 'secondary'}>{bot.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Webhook: {bot.webhook_configured ? '✅ Configurado' : '⚠️ Pendente'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Integre com Twilio ou Vonage para enviar SMS. Configure a API key nas configurações do sistema.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Dialog open={openDialog === 'sms'} onOpenChange={v => setOpenDialog(v ? 'sms' : null)}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Configurar SMS</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Configurar SMS</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Provedor</Label>
                    <select className="w-full rounded-md border p-2 text-sm bg-background" value={smsForm.provider} onChange={e => setSmsForm(f => ({ ...f, provider: e.target.value }))}>
                      <option value="twilio">Twilio</option>
                      <option value="vonage">Vonage</option>
                    </select>
                  </div>
                  <div>
                    <Label>Número de origem</Label>
                    <Input value={smsForm.from_number} onChange={e => setSmsForm(f => ({ ...f, from_number: e.target.value }))} placeholder="+5511999999999" />
                  </div>
                  <Button className="w-full" disabled={createSms.isPending} onClick={() => {
                    createSms.mutate(smsForm, { onSuccess: () => { setOpenDialog(null); setSmsForm({ provider: 'twilio', from_number: '' }); } });
                  }}>
                    {createSms.isPending ? 'Configurando...' : 'Salvar Configuração'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingSms ? <Skeleton className="h-32" /> : smsConfigs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">SMS não configurado</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {smsConfigs.map((config: any) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-5 w-5" />{config.provider.toUpperCase()}
                      </CardTitle>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>{config.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">De: {config.from_number || 'Não configurado'}</p>
                    <p className="text-sm text-muted-foreground">{config.messages_sent} mensagens enviadas</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shopify */}
        <TabsContent value="shopify" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conecte sua loja Shopify para receber triggers de carrinho abandonado, compra concluída e novos pedidos.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Dialog open={openDialog === 'shopify'} onOpenChange={v => setOpenDialog(v ? 'shopify' : null)}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Conectar Loja</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Conectar Shopify</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Domínio da loja</Label>
                    <Input value={shopifyForm.shop_domain} onChange={e => setShopifyForm({ shop_domain: e.target.value })} placeholder="minha-loja.myshopify.com" />
                  </div>
                  <Button className="w-full" disabled={createShopify.isPending} onClick={() => {
                    createShopify.mutate(shopifyForm, { onSuccess: () => { setOpenDialog(null); setShopifyForm({ shop_domain: '' }); } });
                  }}>
                    {createShopify.isPending ? 'Conectando...' : 'Conectar Loja'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingShopify ? <Skeleton className="h-32" /> : shopifyIntegrations.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma loja Shopify conectada</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {shopifyIntegrations.map((shop: any) => (
                <Card key={shop.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />{shop.shop_domain}
                      </CardTitle>
                      <Badge variant={shop.is_active ? 'default' : 'secondary'}>{shop.is_active ? 'Ativa' : 'Inativa'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{shop.orders_synced} pedidos sincronizados</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
