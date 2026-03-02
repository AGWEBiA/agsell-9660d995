import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  Link2,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConnection {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'connecting';
  type: 'qr' | 'api';
  lastSync?: string;
}

interface WhatsAppQRConnectProps {
  onConnect?: (connection: WhatsAppConnection) => void;
}

export function WhatsAppQRConnect({ onConnect }: WhatsAppQRConnectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<'qr' | 'api'>('qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected' | 'error'>('idle');
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const connectionStatusRef = useRef(connectionStatus);

  // Keep ref in sync with state
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // API connection fields
  const [apiConfig, setApiConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: '',
  });

  // Simulate QR code generation
  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    setConnectionStatus('waiting');

    // Simulate API call to generate QR
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a placeholder QR code (in production, this would come from the WhatsApp Web API)
    const qrData = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="40" height="40" fill="black"/>
        <rect x="140" y="20" width="40" height="40" fill="black"/>
        <rect x="20" y="140" width="40" height="40" fill="black"/>
        <rect x="70" y="20" width="10" height="10" fill="black"/>
        <rect x="90" y="20" width="10" height="10" fill="black"/>
        <rect x="110" y="20" width="10" height="10" fill="black"/>
        <rect x="70" y="40" width="10" height="10" fill="black"/>
        <rect x="90" y="40" width="10" height="10" fill="black"/>
        <rect x="110" y="40" width="10" height="10" fill="black"/>
        <rect x="70" y="60" width="10" height="10" fill="black"/>
        <rect x="90" y="60" width="10" height="10" fill="black"/>
        <rect x="110" y="60" width="10" height="10" fill="black"/>
        <rect x="80" y="80" width="40" height="40" fill="black"/>
        <text x="100" y="180" text-anchor="middle" font-size="12" fill="black">AG Sell WhatsApp</text>
      </svg>
    `)}`;

    setQrCode(qrData);
    setIsGeneratingQR(false);

    // Simulate waiting for scan (in production, this would be a websocket connection)
    setTimeout(() => {
      if (connectionStatusRef.current === 'waiting') {
        // Simulate successful connection
        const newConnection: WhatsAppConnection = {
          id: crypto.randomUUID(),
          name: 'Meu WhatsApp',
          phone: '+55 11 99999-9999',
          status: 'connected',
          type: 'qr',
          lastSync: new Date().toISOString(),
        };
        setConnections((prev) => [...prev, newConnection]);
        setConnectionStatus('connected');
        onConnect?.(newConnection);
        toast.success('WhatsApp conectado com sucesso!');
      }
    }, 8000);
  };

  const handleAPIConnect = () => {
    if (!apiConfig.accessToken || !apiConfig.phoneNumberId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const newConnection: WhatsAppConnection = {
      id: crypto.randomUUID(),
      name: 'WhatsApp Business API',
      phone: apiConfig.phoneNumberId,
      status: 'connected',
      type: 'api',
      lastSync: new Date().toISOString(),
    };

    setConnections((prev) => [...prev, newConnection]);
    onConnect?.(newConnection);
    toast.success('WhatsApp Business API conectado!');
    setIsDialogOpen(false);
    setApiConfig({ accessToken: '', phoneNumberId: '', businessAccountId: '', webhookVerifyToken: '' });
  };

  const refreshQRCode = () => {
    setQrCode(null);
    setConnectionStatus('idle');
    generateQRCode();
  };

  const disconnectWhatsApp = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    toast.success('WhatsApp desconectado');
  };

  return (
    <>
      {/* Connections List */}
      <div className="space-y-4">
        {connections.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      connection.status === 'connected'
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <Smartphone className={`h-6 w-6 ${
                        connection.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{connection.name}</p>
                      <p className="text-sm text-muted-foreground">{connection.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'}>
                        {connection.status === 'connected' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {connection.type === 'qr' ? 'QR Code' : 'API'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectWhatsApp(connection.id)}
                    >
                      Desconectar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Connection Options */}
        <Card>
          <CardHeader>
            <CardTitle>Conectar WhatsApp</CardTitle>
            <CardDescription>
              Escolha como você deseja conectar seu WhatsApp ao AG Sell
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-0 pb-4">
            {/* WhatsApp Oficial */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
              onClick={() => { setConnectionType('api'); setIsDialogOpen(true); }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 shrink-0">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">WhatsApp Oficial</p>
                <p className="text-xs text-muted-foreground">Use a API oficial do WhatsApp para oferecer um atendimento rápido e eficiente para seus clientes.</p>
              </div>
            </button>

            {/* WhatsApp com Coexistência */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
              onClick={() => { setConnectionType('api'); setIsDialogOpen(true); }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 shrink-0">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  WhatsApp com Coexistência
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Beta</Badge>
                </p>
                <p className="text-xs text-muted-foreground">Mantenha seu WhatsApp Business App ativo no seu celular e utilize simultaneamente o mesmo número na API oficial.</p>
              </div>
            </button>

            {/* Conexão com Z-Api */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
              onClick={() => { setConnectionType('qr'); setIsDialogOpen(true); }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900 shrink-0">
                <Link2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Conexão com Z-Api</p>
                <p className="text-xs text-muted-foreground">Integre o WhatsApp às suas automações e atendimentos com a Z-API.</p>
              </div>
            </button>

            {/* WhatsApp QR Code */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
              onClick={() => { setConnectionType('qr'); setIsDialogOpen(true); }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
                <QrCode className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Conecte o AG Sell escaneando o QR Code de conexão diretamente no seu WhatsApp.</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {connectionType === 'qr' ? 'Conectar via QR Code' : 'Conectar via API'}
            </DialogTitle>
            <DialogDescription>
              {connectionType === 'qr'
                ? 'Escaneie o QR Code com seu WhatsApp para conectar'
                : 'Configure as credenciais da API do WhatsApp Business'}
            </DialogDescription>
          </DialogHeader>

          {connectionType === 'qr' ? (
            <div className="py-6">
              {connectionStatus === 'connected' ? (
                <div className="text-center">
                  <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Conectado com Sucesso!</h3>
                  <p className="text-muted-foreground">
                    Seu WhatsApp foi conectado ao AG Sell
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  {qrCode ? (
                    <>
                      <div className="relative inline-block">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-48 h-48 mx-auto border rounded-lg"
                        />
                        {connectionStatus === 'waiting' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        1. Abra o WhatsApp no seu celular<br />
                        2. Vá em Configurações &gt; Dispositivos Conectados<br />
                        3. Toque em "Conectar um Dispositivo"<br />
                        4. Escaneie este QR Code
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={refreshQRCode}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar QR Code
                      </Button>
                    </>
                  ) : (
                    <Button onClick={generateQRCode} disabled={isGeneratingQR}>
                      {isGeneratingQR ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={apiConfig.accessToken}
                  onChange={(e) => setApiConfig({ ...apiConfig, accessToken: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345"
                  value={apiConfig.phoneNumberId}
                  onChange={(e) => setApiConfig({ ...apiConfig, phoneNumberId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345"
                  value={apiConfig.businessAccountId}
                  onChange={(e) => setApiConfig({ ...apiConfig, businessAccountId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
                <Input
                  id="webhookVerifyToken"
                  placeholder="my-verify-token"
                  value={apiConfig.webhookVerifyToken}
                  onChange={(e) => setApiConfig({ ...apiConfig, webhookVerifyToken: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {connectionStatus === 'connected' ? 'Fechar' : 'Cancelar'}
            </Button>
            {connectionType === 'api' && (
              <Button onClick={handleAPIConnect}>
                Conectar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
