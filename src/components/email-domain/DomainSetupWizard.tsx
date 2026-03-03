import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Globe, ArrowRight, ArrowLeft, CheckCircle, XCircle,
  Loader2, Mail, Info
} from 'lucide-react';

type Step = 'domain' | 'sender';

interface DomainSetupWizardProps {
  onComplete: (data: { domain: string; from_email?: string; from_name?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'domain', label: 'Domínio', number: 1 },
    { key: 'sender', label: 'Remetente', number: 2 },
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

export default function DomainSetupWizard({ onComplete, onCancel, isPending }: DomainSetupWizardProps) {
  const [step, setStep] = useState<Step>('domain');
  const [domain, setDomain] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  const isValidDomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanDomain);

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
                <Input id="from-email" placeholder={`noreply@${cleanDomain}`} value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground">Padrão: noreply@{cleanDomain}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">Nome do remetente</Label>
                <Input id="from-name" placeholder="Sua Empresa" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
            </div>
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

            {/* Info about next steps */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Após cadastrar o domínio, o sistema irá registrá-lo automaticamente no provedor de e-mail e exibir os <strong>registros DNS reais</strong> que você precisará configurar no seu provedor de hospedagem.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('domain')}>
                <ArrowLeft className="h-4 w-4 mr-2" />Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cadastrar Domínio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
