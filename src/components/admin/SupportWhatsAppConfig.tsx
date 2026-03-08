import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Headphones, Save, Loader2, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SupportWhatsAppConfig {
  phone_number: string;
  instance_id?: string;
  instance_name?: string;
  message?: string;
}

export function SupportWhatsAppConfig() {
  const queryClient = useQueryClient();

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['platform_settings', 'support_whatsapp'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'support_whatsapp')
        .maybeSingle();
      return (data?.value as unknown as SupportWhatsAppConfig) || null;
    },
  });

  // Fetch ALL WhatsApp instances across all orgs (admin view)
  const { data: allInstances = [] } = useQuery({
    queryKey: ['admin_all_whatsapp_instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('id, name, config, organization_id, is_active, organizations(name)')
        .in('integration_type', ['evolution_api', 'whatsapp_business'])
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        phone: (i.config as Record<string, string>)?.phone_number || (i.config as Record<string, string>)?.instance_name || '',
        org_name: i.organizations?.name || '',
      }));
    },
  });

  const [phone, setPhone] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (config) {
      setPhone(config.phone_number || '');
      setSelectedInstance(config.instance_id || '');
      setMessage(config.message || 'Olá, preciso de ajuda com a AG Sell');
    } else {
      setMessage('Olá, preciso de ajuda com a AG Sell');
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const instance = allInstances.find(i => i.id === selectedInstance);
      const value: SupportWhatsAppConfig = {
        phone_number: phone,
        instance_id: selectedInstance || undefined,
        instance_name: instance?.name || undefined,
        message: message || 'Olá, preciso de ajuda com a AG Sell',
      };

      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'support_whatsapp')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: value as unknown as Record<string, never>, updated_at: new Date().toISOString() })
          .eq('key', 'support_whatsapp');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ key: 'support_whatsapp', value: value as unknown as Record<string, never> });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_settings', 'support_whatsapp'] });
      toast.success('WhatsApp de suporte configurado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSelectInstance = (instanceId: string) => {
    setSelectedInstance(instanceId);
    const instance = allInstances.find(i => i.id === instanceId);
    if (instance?.phone) {
      setPhone(instance.phone);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Headphones className="h-4 w-4 text-primary" />
          WhatsApp de Suporte (Página de Vendas)
        </CardTitle>
        <CardDescription className="text-xs">
          Configure qual número WhatsApp aparece no botão de atendimento da landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select from existing instances */}
        {allInstances.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Selecionar Instância</Label>
            <Select value={selectedInstance} onValueChange={handleSelectInstance}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Escolha uma instância conectada..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Informar número manualmente</SelectItem>
                {allInstances.map(inst => (
                  <SelectItem key={inst.id} value={inst.id}>
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      {inst.name}
                      {inst.phone && <span className="text-muted-foreground text-xs">({inst.phone})</span>}
                      <Badge variant="outline" className="text-[9px] ml-1">{inst.org_name}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phone number */}
        <div className="space-y-2">
          <Label className="text-sm">Número WhatsApp *</Label>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="5511999999999 (com DDI + DDD)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="h-9"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Formato internacional sem espaços ou traços (ex: 5511999999999)
          </p>
        </div>

        {/* Default message */}
        <div className="space-y-2">
          <Label className="text-sm">Mensagem Padrão</Label>
          <Input
            placeholder="Olá, preciso de ajuda com a AG Sell"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Preview */}
        {phone && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Preview do link:</p>
            <p className="text-xs font-mono break-all">
              https://wa.me/{phone}?text={encodeURIComponent(message)}
            </p>
          </div>
        )}

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!phone.trim() || saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
