import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, Check, Settings, ExternalLink, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'email' | 'payment' | 'infoproduct' | 'analytics' | 'crm';
  status: 'connected' | 'disconnected';
  configFields?: { key: string; label: string; type: string; placeholder: string }[];
};

const availableIntegrations: Integration[] = [
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envio de emails transacionais e marketing',
    icon: '📧',
    category: 'email',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'SG.xxxx...' },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email API moderna para desenvolvedores',
    icon: '✉️',
    category: 'email',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 're_xxxx...' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagamentos e assinaturas recorrentes',
    icon: '💳',
    category: 'payment',
    status: 'disconnected',
    configFields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_xxxx...' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_xxxx...' },
    ],
  },
  {
    id: 'hotmart',
    name: 'Hotmart',
    description: 'Plataforma de infoprodutos',
    icon: '🔥',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Seu Client ID' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Seu Client Secret' },
    ],
  },
  {
    id: 'kiwify',
    name: 'Kiwify',
    description: 'Vendas de produtos digitais',
    icon: '🥝',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key' },
    ],
  },
  {
    id: 'eduzz',
    name: 'Eduzz',
    description: 'Plataforma de cursos e produtos digitais',
    icon: '📚',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key' },
      { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'Sua Public Key' },
    ],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Análise de tráfego e comportamento',
    icon: '📊',
    category: 'analytics',
    status: 'disconnected',
    configFields: [
      { key: 'measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    ],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    description: 'Rastreamento de conversões Facebook/Instagram',
    icon: '📈',
    category: 'analytics',
    status: 'disconnected',
    configFields: [
      { key: 'pixel_id', label: 'Pixel ID', type: 'text', placeholder: 'Seu Pixel ID' },
    ],
  },
];

const categoryLabels: Record<string, string> = {
  email: 'Email',
  payment: 'Pagamentos',
  infoproduct: 'Infoprodutos',
  analytics: 'Analytics',
  crm: 'CRM',
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState(availableIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConnect = () => {
    if (!selectedIntegration) return;

    // Validate all fields are filled
    const allFieldsFilled = selectedIntegration.configFields?.every(f => configValues[f.key]?.trim());
    if (!allFieldsFilled) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Update integration status
    setIntegrations(prev => prev.map(i => 
      i.id === selectedIntegration.id ? { ...i, status: 'connected' as const } : i
    ));

    toast.success(`${selectedIntegration.name} conectado com sucesso!`);
    setIsDialogOpen(false);
    setConfigValues({});
    setSelectedIntegration(null);
  };

  const handleDisconnect = (integration: Integration) => {
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id ? { ...i, status: 'disconnected' as const } : i
    ));
    toast.success(`${integration.name} desconectado`);
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigValues({});
    setIsDialogOpen(true);
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  // Group by category
  const groupedIntegrations = integrations.reduce((acc, int) => {
    if (!acc[int.category]) acc[int.category] = [];
    acc[int.category].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">Conecte suas ferramentas favoritas</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {connectedCount} conectadas
        </Badge>
      </div>

      {Object.entries(groupedIntegrations).map(([category, ints]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold">{categoryLabels[category]}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ints.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{integration.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                      {integration.status === 'connected' ? (
                        <><Check className="h-3 w-3 mr-1" /> Conectado</>
                      ) : (
                        'Desconectado'
                      )}
                    </Badge>
                    {integration.status === 'connected' ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openConfigDialog(integration)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDisconnect(integration)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openConfigDialog(integration)}>
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Config Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedIntegration?.icon}</span>
              {selectedIntegration?.status === 'connected' ? 'Configurar' : 'Conectar'} {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntegration?.configFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ''}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConnect}>
              {selectedIntegration?.status === 'connected' ? 'Salvar' : 'Conectar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
