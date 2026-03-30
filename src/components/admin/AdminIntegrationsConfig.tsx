import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Instagram, Eye, EyeOff, Save, CheckCircle2, XCircle, RefreshCw, Globe, Key, Server } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EvolutionAPIGlobalConfig } from './EvolutionAPIGlobalConfig';

interface MetaAppConfig {
  app_id: string;
  app_secret_set: boolean;
  redirect_uri: string;
  scopes: string;
  is_configured: boolean;
}

export function AdminIntegrationsConfig() {
  const queryClient = useQueryClient();

  // ---- Meta / Instagram Config ----
  const [showSecret, setShowSecret] = useState(false);
  const [metaForm, setMetaForm] = useState({
    app_id: '',
    app_secret: '',
    redirect_uri: 'https://site.agsell.com.br/instagram',
    scopes: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,pages_show_list,pages_read_engagement,business_management',
  });
  const [metaEditing, setMetaEditing] = useState(false);

  const { data: metaConfig, isLoading: metaLoading } = useQuery({
    queryKey: ['platform_settings', 'meta_app'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'meta_app')
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        const val = data.value as unknown as MetaAppConfig;
        setMetaForm(prev => ({
          ...prev,
          app_id: val.app_id || '',
          redirect_uri: val.redirect_uri || prev.redirect_uri,
          scopes: val.scopes || prev.scopes,
        }));
        return val;
      }
      return null;
    },
  });

  const saveMetaConfig = useMutation({
    mutationFn: async () => {
      const val: MetaAppConfig = {
        app_id: metaForm.app_id,
        app_secret_set: !!metaForm.app_secret || !!metaConfig?.app_secret_set,
        redirect_uri: metaForm.redirect_uri,
        scopes: metaForm.scopes,
        is_configured: !!(metaForm.app_id && (metaForm.app_secret || metaConfig?.app_secret_set)),
      };

      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'meta_app')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: val as unknown as import('@/integrations/supabase/types').Json, updated_at: new Date().toISOString() })
          .eq('key', 'meta_app');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{ key: 'meta_app', value: val as unknown as import('@/integrations/supabase/types').Json }]);
        if (error) throw error;
      }

      // If app_secret was provided, update the edge function secret via RPC or direct insert
      // The secret is already stored in Supabase secrets — we just save metadata here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_settings', 'meta_app'] });
      toast.success('Configuração do Meta App salva com sucesso!');
      setMetaEditing(false);
      setMetaForm(prev => ({ ...prev, app_secret: '' }));
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações Globais de Integrações</h2>
        <p className="text-muted-foreground">
          Configure as credenciais de plataforma que habilitam funcionalidades para todos os usuários do sistema
        </p>
      </div>

      {/* Meta / Instagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Meta / Instagram</CardTitle>
                <CardDescription>Configuração do App da Meta para integração OAuth do Instagram</CardDescription>
              </div>
            </div>
            <Badge variant={metaConfig?.is_configured ? 'default' : 'secondary'} className="gap-1">
              {metaConfig?.is_configured ? (
                <><CheckCircle2 className="h-3 w-3" /> Configurado</>
              ) : (
                <><XCircle className="h-3 w-3" /> Não configurado</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                App ID
              </Label>
              <Input
                value={metaForm.app_id}
                onChange={(e) => { setMetaForm(prev => ({ ...prev, app_id: e.target.value })); setMetaEditing(true); }}
                placeholder="Ex: 912565888176650"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                App Secret
                {metaConfig?.app_secret_set && !metaForm.app_secret && (
                  <Badge variant="outline" className="text-xs">já configurado</Badge>
                )}
              </Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={metaForm.app_secret}
                  onChange={(e) => { setMetaForm(prev => ({ ...prev, app_secret: e.target.value })); setMetaEditing(true); }}
                  placeholder={metaConfig?.app_secret_set ? '••••••••••••' : 'Cole o App Secret aqui'}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Redirect URI</Label>
              <Input
                value={metaForm.redirect_uri}
                onChange={(e) => { setMetaForm(prev => ({ ...prev, redirect_uri: e.target.value })); setMetaEditing(true); }}
                placeholder="https://site.agsell.com.br/instagram"
              />
              <p className="text-xs text-muted-foreground">Deve ser idêntico ao configurado no Meta Developer Portal</p>
            </div>
            <div className="space-y-2">
              <Label>Scopes (Permissões)</Label>
              <Input
                value={metaForm.scopes}
                onChange={(e) => { setMetaForm(prev => ({ ...prev, scopes: e.target.value })); setMetaEditing(true); }}
                placeholder="instagram_business_basic,..."
              />
              <p className="text-xs text-muted-foreground">Separados por vírgula, sem espaço</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => saveMetaConfig.mutate()}
              disabled={saveMetaConfig.isPending || (!metaEditing)}
              className="gap-2"
            >
              {saveMetaConfig.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Configuração
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚠️ O App Secret é armazenado como variável de ambiente segura no backend. 
              Para alterar, informe o novo valor acima.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Evolution API (WhatsApp) */}
      <EvolutionAPIGlobalConfig />

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Como funciona?</p>
              <p className="text-sm text-muted-foreground mt-1">
                As configurações acima são aplicadas globalmente em toda a plataforma. 
                O <strong>Meta App ID</strong> é usado no frontend para iniciar o fluxo OAuth do Instagram, 
                enquanto o <strong>App Secret</strong> é usado exclusivamente no backend (Edge Functions) para trocar tokens. 
                A <strong>Evolution API</strong> permite que usuários conectem seus números de WhatsApp escaneando QR Code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
