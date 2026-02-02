import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Settings, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WhatsApp() {
  // This would integrate with a WhatsApp Business API provider
  const connections = [
    // Empty for now - user needs to configure WhatsApp integration
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie suas conexões WhatsApp Business</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Integração WhatsApp Business API</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Para enviar e receber mensagens de WhatsApp em escala, você precisa configurar uma conta WhatsApp Business API.
                Isso permite automações, templates de mensagem e atendimento multiusuário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Conexões Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Templates Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma conexão configurada</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Configure uma conexão WhatsApp Business API para começar a enviar e receber mensagens automaticamente.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Configurar WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Connection cards would go here */}
        </div>
      )}

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
          <CardDescription>Siga os passos para integrar o WhatsApp Business API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Criar conta Meta Business</p>
                <p className="text-sm text-muted-foreground">
                  Acesse business.facebook.com e crie uma conta empresarial verificada.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Solicitar acesso à API</p>
                <p className="text-sm text-muted-foreground">
                  Solicite acesso ao WhatsApp Business Platform através do Meta Developer Portal.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Conectar à plataforma</p>
                <p className="text-sm text-muted-foreground">
                  Use as credenciais da API para conectar sua conta aqui no AG Sell.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
