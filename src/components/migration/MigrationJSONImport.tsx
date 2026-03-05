import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileJson, CheckCircle2, AlertCircle, Loader2, Mail, Zap, GitBranch, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  platformName: string;
}

const sampleAutomation = JSON.stringify({
  automations: [{
    name: "Boas-vindas Novo Lead",
    trigger_type: "contact_created",
    actions: [
      { type: "send_email", delay_minutes: 0, config: { subject: "Bem-vindo!", template: "<h1>Olá {{nome}}</h1>" } },
      { type: "add_tag", delay_minutes: 1440, config: { tag: "engajado" } },
      { type: "send_email", delay_minutes: 4320, config: { subject: "Como podemos ajudar?", template: "<p>Gostaríamos de saber...</p>" } },
    ]
  }]
}, null, 2);

const sampleEmailTemplates = JSON.stringify({
  templates: [{
    name: "Newsletter Semanal",
    subject: "Novidades da semana",
    html: "<html><body><h1>Olá {{nome}}</h1><p>Confira as novidades...</p></body></html>"
  }]
}, null, 2);

const sampleSequences = JSON.stringify({
  sequences: [{
    name: "Funil de Vendas - 7 dias",
    steps: [
      { day: 0, subject: "Dia 1 - Introdução", html: "<p>Olá {{nome}}, bem-vindo!</p>", channel: "email" },
      { day: 2, subject: "Dia 3 - Valor", html: "<p>Aqui está algo especial...</p>", channel: "email" },
      { day: 7, subject: "Dia 7 - Oferta", html: "<p>Temos uma proposta...</p>", channel: "email" },
    ]
  }]
}, null, 2);

const sampleFunnels = JSON.stringify({
  funnels: [{
    name: "Funil de Lançamento",
    steps: [
      { name: "Captura", type: "email", delay_days: 0, subject: "Você foi selecionado!", html: "<h1>Parabéns {{nome}}</h1><p>Você entrou no nosso grupo exclusivo.</p>" },
      { name: "Nutrição 1", type: "email", delay_days: 2, subject: "Dica exclusiva para você", html: "<p>Aqui vai uma dica que vai mudar seu jogo...</p>" },
      { name: "Nutrição 2", type: "email", delay_days: 5, subject: "Caso de sucesso", html: "<p>Veja como o João conseguiu resultados...</p>" },
      { name: "Oferta", type: "email", delay_days: 7, subject: "Última chance!", html: "<p>A oferta encerra hoje às 23:59...</p>" },
    ]
  }]
}, null, 2);

export function MigrationJSONImport({ platformName }: Props) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ type: string; success: number; errors: number } | null>(null);
  const [activeType, setActiveType] = useState('automations');

  const loadSample = (type: string) => {
    switch (type) {
      case 'automations': setJsonText(sampleAutomation); break;
      case 'templates': setJsonText(sampleEmailTemplates); break;
      case 'sequences': setJsonText(sampleSequences); break;
      case 'funnels': setJsonText(sampleFunnels); break;
    }
  };

  const handleImport = async () => {
    if (!user || !jsonText.trim()) return;
    setImporting(true);
    try {
      const data = JSON.parse(jsonText);
      let successCount = 0;
      let errorCount = 0;

      if (activeType === 'automations' && data.automations) {
        for (const auto of data.automations) {
          const { error } = await supabase.from('automations').insert({
            name: auto.name || 'Automação Importada',
            trigger_type: auto.trigger_type || 'contact_created',
            actions: auto.actions || [],
            trigger_config: auto.trigger_config || {},
            user_id: user.id,
            organization_id: currentOrganization?.id || null,
            is_active: false,
          });
          if (error) errorCount++; else successCount++;
        }
        queryClient.invalidateQueries({ queryKey: ['automations'] });
      }

      if (activeType === 'templates' && data.templates) {
        for (const tpl of data.templates) {
          const { error } = await supabase.from('email_campaigns').insert({
            name: tpl.name || 'Template Importado',
            subject: tpl.subject || tpl.name,
            content: tpl.html || tpl.content || '',
            status: 'draft',
            user_id: user.id,
            organization_id: currentOrganization?.id || null,
          });
          if (error) errorCount++; else successCount++;
        }
        queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      }

      if (activeType === 'sequences' && data.sequences) {
        for (const seq of data.sequences) {
          const { data: seqRow, error: seqError } = await supabase.from('sequences').insert({
            name: seq.name || 'Sequência Importada',
            channel: 'email',
            status: 'draft',
            created_by: user.id,
            organization_id: currentOrganization?.id || '',
          }).select('id').single();

          if (seqError || !seqRow) { errorCount++; continue; }

          if (seq.steps?.length) {
            for (let i = 0; i < seq.steps.length; i++) {
              const step = seq.steps[i];
              await supabase.from('sequence_steps').insert({
                sequence_id: seqRow.id,
                step_order: i + 1,
                delay_days: step.day || 0,
                channel: step.channel || 'email',
                subject: step.subject || '',
                content: step.html || step.content || '',
              });
            }
          }
          successCount++;
        }
        queryClient.invalidateQueries({ queryKey: ['sequences'] });
      }

      if (activeType === 'funnels' && data.funnels) {
        for (const funnel of data.funnels) {
          // Funis visuais → extraímos o conteúdo dos e-mails como sequência
          const { data: seqRow, error: seqError } = await supabase.from('sequences').insert({
            name: funnel.name || 'Funil Importado',
            channel: 'email',
            status: 'draft',
            created_by: user.id,
            organization_id: currentOrganization?.id || '',
          }).select('id').single();

          if (seqError || !seqRow) { errorCount++; continue; }

          const steps = funnel.steps || funnel.nodes || funnel.emails || [];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            // Aceita múltiplos formatos de funil
            const subject = step.subject || step.email_subject || step.name || `Etapa ${i + 1}`;
            const html = step.html || step.body || step.content || step.email_body || '';
            const delayDays = step.delay_days ?? step.wait_days ?? step.day ?? (i * 2);
            
            await supabase.from('sequence_steps').insert({
              sequence_id: seqRow.id,
              step_order: i + 1,
              delay_days: delayDays,
              channel: step.channel || step.type || 'email',
              subject,
              content: html,
            });
          }

          // Também salva cada e-mail do funil como template draft
          for (const step of steps) {
            const html = step.html || step.body || step.content || step.email_body || '';
            if (html) {
              await supabase.from('email_campaigns').insert({
                name: `[${funnel.name}] ${step.name || step.subject || 'E-mail'}`,
                subject: step.subject || step.email_subject || step.name || '',
                content: html,
                status: 'draft',
                user_id: user.id,
                organization_id: currentOrganization?.id || null,
              });
            }
          }
          successCount++;
        }
        queryClient.invalidateQueries({ queryKey: ['sequences'] });
        queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      }

      setResult({ type: activeType, success: successCount, errors: errorCount });
      toast.success(`${successCount} item(ns) importado(s)!`);
    } catch (err: any) {
      toast.error('JSON inválido: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Importar Estruturas via JSON
        </CardTitle>
        <CardDescription>
          Importe automações, templates de e-mail e sequências de {platformName} usando um formato JSON padronizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeType} onValueChange={v => { setActiveType(v); setResult(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="automations" className="flex-1">
              <Zap className="h-4 w-4 mr-1" /> Automações
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">
              <Mail className="h-4 w-4 mr-1" /> Templates
            </TabsTrigger>
            <TabsTrigger value="sequences" className="flex-1">
              <GitBranch className="h-4 w-4 mr-1" /> Sequências
            </TabsTrigger>
            <TabsTrigger value="funnels" className="flex-1">
              <Workflow className="h-4 w-4 mr-1" /> Funis
            </TabsTrigger>
          </TabsList>

          {['automations', 'templates', 'sequences', 'funnels'].map(type => (
            <TabsContent key={type} value={type}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadSample(type)}>
                    Carregar exemplo
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const text = await f.text(); setJsonText(text); }
                    }} />
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="h-3 w-3 mr-1" /> Upload JSON</span>
                    </Button>
                  </label>
                </div>

                <Textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  placeholder={`Cole seu JSON de ${type === 'automations' ? 'automações' : type === 'templates' ? 'templates' : type === 'funnels' ? 'funis' : 'sequências'} aqui...`}
                  className="font-mono text-xs min-h-[250px]"
                />

                <Button onClick={handleImport} disabled={importing || !jsonText.trim()} className="w-full">
                  {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</> : 'Importar'}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {result && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
            {result.errors === 0 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
            <div>
              <p className="font-medium">{result.success} {result.type === 'automations' ? 'automação(ões)' : result.type === 'templates' ? 'template(s)' : result.type === 'funnels' ? 'funil(is)' : 'sequência(s)'} importada(s)</p>
              {result.errors > 0 && <p className="text-sm text-muted-foreground">{result.errors} erro(s)</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
