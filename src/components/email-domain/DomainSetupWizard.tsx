import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Globe, ArrowRight, ArrowLeft, Copy, CheckCircle, XCircle,
  RefreshCw, Loader2, Mail, Shield, Info
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'domain' | 'sender' | 'dns_txt' | 'dns_cname' | 'dns_mx';

interface DomainSetupWizardProps {
  onComplete: (data: { domain: string; from_email?: string; from_name?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado para a área de transferência!');
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'domain', label: 'Domínio', number: 1 },
    { key: 'sender', label: 'Remetente', number: 2 },
    { key: 'dns_txt', label: 'TXT', number: 3 },
    { key: 'dns_cname', label: 'CNAME', number: 4 },
    { key: 'dns_mx', label: 'MX', number: 5 },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div className={`h-px w-8 md:w-12 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.number}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DnsRecordRow({ type, name, value, purpose }: { type: string; name: string; value: string; purpose: string }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">{type}</Badge>
          <span className="text-sm font-medium text-primary">{purpose}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(value)} className="h-7">
          <Copy className="h-3 w-3 mr-1" />
          Copiar valor
        </Button>
      </div>
      <div className="grid gap-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nome / Host</p>
          <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
            <code className="text-xs flex-1 break-all">{name}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(name)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Valor</p>
          <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
            <code className="text-xs flex-1 break-all">{value}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(value)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DomainSetupWizard({ onComplete, onCancel, isPending }: DomainSetupWizardProps) {
  const [step, setStep] = useState<Step>('domain');
  const [domain, setDomain] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  const isValidDomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanDomain);

  const txtRecords = [
    {
      type: 'TXT',
      name: cleanDomain,
      value: `v=spf1 include:amazonses.com include:resend.com ~all`,
      purpose: 'SPF',
    },
    {
      type: 'TXT',
      name: `sfx._domainkey.${cleanDomain}`,
      value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZ...`,
      purpose: 'DKIM',
    },
    {
      type: 'TXT',
      name: `_dmarc.${cleanDomain}`,
      value: `v=DMARC1; p=none; sp=none; rua=mailto:suporte@${cleanDomain}; ruf=mailto:ruf@${cleanDomain}`,
      purpose: 'DMARC',
    },
  ];

  const cnameRecords = [
    {
      type: 'CNAME',
      name: `email.${cleanDomain}`,
      value: 'email2.api-mail.com',
      purpose: 'Email Routing',
    },
  ];

  const mxRecords = [
    {
      type: 'MX',
      name: cleanDomain,
      value: 'mxa.api-mail.com (prioridade 10)',
      purpose: 'MX Primário',
    },
    {
      type: 'MX',
      name: cleanDomain,
      value: 'mxb.api-mail.com (prioridade 10)',
      purpose: 'MX Secundário',
    },
  ];

  const allDnsRecords = [...txtRecords, ...cnameRecords, ...mxRecords];

  const handleSubmit = () => {
    onComplete({
      domain: cleanDomain,
      from_email: fromEmail || undefined,
      from_name: fromName || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      {step === 'domain' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Qual domínio você quer usar?</h2>
              <p className="text-sm text-muted-foreground">
                Insira o domínio do qual deseja enviar e-mails (ex: suaempresa.com.br)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain-input">Domínio</Label>
              <Input
                id="domain-input"
                placeholder="suaempresa.com.br"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="text-center text-lg h-12"
                autoFocus
              />
              {domain && !isValidDomain && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Digite um domínio válido (sem "www", "https://" ou caminhos)
                </p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
              <Button onClick={() => setStep('sender')} disabled={!isValidDomain}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'sender' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configurar remetente</h2>
              <p className="text-sm text-muted-foreground">
                Defina como seus e-mails aparecerão para os destinatários
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">E-mail remetente</Label>
                <Input
                  id="from-email"
                  placeholder={`noreply@${cleanDomain}`}
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Padrão: noreply@{cleanDomain}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">Nome do remetente</Label>
                <Input
                  id="from-name"
                  placeholder="Sua Empresa"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{fromName || 'Sua Empresa'}</p>
                  <p className="text-xs text-muted-foreground">{fromEmail || `noreply@${cleanDomain}`}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('domain')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep('dns_txt')}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS TXT Step */}
      {step === 'dns_txt' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configuração do tipo: <Badge>TXT</Badge></h2>
              <p className="text-sm text-muted-foreground">
                O registro TXT é um tipo de configuração no DNS que permite armazenar informações textuais, como verificações de propriedade, políticas de email (SPF, DKIM).
              </p>
            </div>
            <div className="space-y-3">
              {txtRecords.map((record, i) => (
                <DnsRecordRow key={i} {...record} />
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('sender')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep('dns_cname')}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS CNAME Step */}
      {step === 'dns_cname' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configuração do tipo: <Badge className="bg-green-600">CNAME</Badge></h2>
              <p className="text-sm text-muted-foreground">
                O registro CNAME no DNS permite que um domínio ou subdomínio aponte para outro domínio. Isso simplifica a gestão de subdomínios.
              </p>
            </div>
            <div className="space-y-3">
              {cnameRecords.map((record, i) => (
                <DnsRecordRow key={i} {...record} />
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('dns_txt')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep('dns_mx')}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS MX Step */}
      {step === 'dns_mx' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configuração do tipo: <Badge className="bg-orange-600">MX</Badge></h2>
              <p className="text-sm text-muted-foreground">
                O registro MX no DNS especifica servidores de email responsáveis por receber mensagens para um domínio, garantindo a entrega eficiente dos emails.
              </p>
            </div>
            <div className="space-y-3">
              {mxRecords.map((record, i) => (
                <DnsRecordRow key={i} {...record} />
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-400">Importante</p>
                <p className="text-muted-foreground">A propagação DNS pode levar até 48 horas, mas normalmente acontece em menos de 1 hora.</p>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('dns_cname')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    Concluir
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
