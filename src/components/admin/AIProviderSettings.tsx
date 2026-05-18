import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaskedConfig {
  openai_configured: boolean;
  gemini_configured: boolean;
  openai_masked: string | null;
  gemini_masked: string | null;
  default_provider: 'openai' | 'gemini';
  fallback_enabled: boolean;
}

export function AIProviderSettings() {
  const queryClient = useQueryClient();
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [testing, setTesting] = useState<'openai' | 'gemini' | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string; latency?: number; model?: string }>>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['ai_providers_config'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ai_providers_config_masked' as never);
      if (error) throw error;
      return data as unknown as MaskedConfig;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      _openai_api_key?: string;
      _gemini_api_key?: string;
      _default_provider?: string;
      _fallback_enabled?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('update_ai_providers_config' as never, payload as never);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_providers_config'] });
      toast.success('Configuração salva!');
      setOpenaiKey('');
      setGeminiKey('');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });

  const handleTest = async (provider: 'openai' | 'gemini') => {
    setTesting(provider);
    setTestResult((prev) => ({ ...prev, [provider]: { ok: false, msg: 'Testando...' } }));
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-config', {
        body: { provider },
      });
      if (error) throw error;
      if (data?.success) {
        setTestResult((prev) => ({
          ...prev,
          [provider]: { ok: true, msg: data.response || 'OK', latency: data.latency_ms, model: data.model },
        }));
        toast.success(`${provider.toUpperCase()} OK (${data.latency_ms}ms via ${data.model})`);
      } else {
        setTestResult((prev) => ({ ...prev, [provider]: { ok: false, msg: data?.error || 'Falhou' } }));
        toast.error(`${provider.toUpperCase()} falhou: ${data?.error || 'desconhecido'}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestResult((prev) => ({ ...prev, [provider]: { ok: false, msg } }));
      toast.error('Erro: ' + msg);
    } finally {
      setTesting(null);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando configuração...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Provedores de IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure as chaves de API da OpenAI e/ou Google Gemini. Todas as funcionalidades de IA da plataforma
          (chat, sentimento, lead scoring, sugestões, etc.) usam essas chaves automaticamente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* OpenAI Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> OpenAI
              </span>
              {config?.openai_configured ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" /> Não configurado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Modelos: gpt-4o, gpt-4o-mini.{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                Obter chave <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config?.openai_masked && (
              <div className="text-xs text-muted-foreground">
                Chave atual: <code className="bg-muted px-1 rounded">{config.openai_masked}</code>
              </div>
            )}
            <div>
              <Label htmlFor="openai-key">{config?.openai_configured ? 'Substituir chave' : 'Nova chave'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="openai-key"
                  type={showOpenai ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={() => setShowOpenai((v) => !v)}>
                  {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => updateMutation.mutate({ _openai_api_key: openaiKey })}
                disabled={!openaiKey || updateMutation.isPending}
                className="flex-1"
              >
                Salvar OpenAI
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTest('openai')}
                disabled={!config?.openai_configured || testing === 'openai'}
              >
                {testing === 'openai' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
            {testResult.openai && (
              <div className={`text-xs p-2 rounded ${testResult.openai.ok ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                {testResult.openai.ok ? '✓' : '✗'} {testResult.openai.msg}
                {testResult.openai.latency && ` (${testResult.openai.latency}ms)`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gemini Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Google Gemini
              </span>
              {config?.gemini_configured ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" /> Não configurado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Modelos: gemini-2.5-flash, gemini-2.5-pro.{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                Obter chave <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config?.gemini_masked && (
              <div className="text-xs text-muted-foreground">
                Chave atual: <code className="bg-muted px-1 rounded">{config.gemini_masked}</code>
              </div>
            )}
            <div>
              <Label htmlFor="gemini-key">{config?.gemini_configured ? 'Substituir chave' : 'Nova chave'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="gemini-key"
                  type={showGemini ? 'text' : 'password'}
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={() => setShowGemini((v) => !v)}>
                  {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => updateMutation.mutate({ _gemini_api_key: geminiKey })}
                disabled={!geminiKey || updateMutation.isPending}
                className="flex-1"
              >
                Salvar Gemini
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTest('gemini')}
                disabled={!config?.gemini_configured || testing === 'gemini'}
              >
                {testing === 'gemini' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
            {testResult.gemini && (
              <div className={`text-xs p-2 rounded ${testResult.gemini.ok ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                {testResult.gemini.ok ? '✓' : '✗'} {testResult.gemini.msg}
                {testResult.gemini.latency && ` (${testResult.gemini.latency}ms)`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Roteamento */}
      <Card>
        <CardHeader>
          <CardTitle>Roteamento</CardTitle>
          <CardDescription>Qual provedor usar como padrão e se o sistema deve tentar o outro automaticamente em caso de falha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Provedor padrão</Label>
            <RadioGroup
              value={config?.default_provider || 'openai'}
              onValueChange={(v) => updateMutation.mutate({ _default_provider: v })}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="openai" id="r-openai" />
                <Label htmlFor="r-openai" className="cursor-pointer">OpenAI</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="gemini" id="r-gemini" />
                <Label htmlFor="r-gemini" className="cursor-pointer">Gemini</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="fallback" className="cursor-pointer">Fallback automático</Label>
              <p className="text-xs text-muted-foreground">Se o provedor padrão falhar (5xx/429/timeout), tenta o outro automaticamente.</p>
            </div>
            <Switch
              id="fallback"
              checked={config?.fallback_enabled ?? true}
              onCheckedChange={(v) => updateMutation.mutate({ _fallback_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modelos por tarefa */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de modelos por tarefa</CardTitle>
          <CardDescription>Modelos escolhidos automaticamente conforme o tipo de tarefa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-3 gap-4 font-medium pb-2 border-b">
              <span>Tarefa</span><span>OpenAI</span><span>Gemini</span>
            </div>
            <div className="grid grid-cols-3 gap-4"><span className="text-muted-foreground">Rápido (chat, copy)</span><code>gpt-4o-mini</code><code>gemini-2.5-flash</code></div>
            <div className="grid grid-cols-3 gap-4"><span className="text-muted-foreground">Raciocínio (deal, decisão)</span><code>gpt-4o</code><code>gemini-2.5-pro</code></div>
            <div className="grid grid-cols-3 gap-4"><span className="text-muted-foreground">Nano (sentimento, scoring)</span><code>gpt-4o-mini</code><code>gemini-2.5-flash-lite</code></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
