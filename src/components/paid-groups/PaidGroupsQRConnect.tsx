import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QrCode, CheckCircle2, RefreshCw, Loader2, Smartphone, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface PaidGroupsQRConnectProps {
  hasConfig: boolean;
}

export function PaidGroupsQRConnect({ hasConfig }: PaidGroupsQRConnectProps) {
  const { currentOrganization } = useOrganization();
  const [instanceName, setInstanceName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'qrcode' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [polling, setPolling] = useState(false);

  const invokeQR = useCallback(async (action: 'create' | 'connect' | 'status') => {
    if (!instanceName.trim()) {
      toast.error('Informe o nome da instância');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    setQrCode(null);
    setPairingCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: {
          organization_id: currentOrganization?.id,
          instance_name: instanceName.trim(),
          action,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        setStatus('error');
        setErrorMsg(data?.error || 'Erro desconhecido');
        return;
      }

      if (data.action === 'connected' || data.state === 'open') {
        setStatus('connected');
        toast.success('Instância já está conectada!');
        return;
      }

      if (data.qrcode) {
        const src = data.qrcode.startsWith('data:') ? data.qrcode : `data:image/png;base64,${data.qrcode}`;
        setQrCode(src);
        setPairingCode(data.pairingCode || null);
        setStatus('qrcode');
        setPolling(true);
      } else if (data.code) {
        setPairingCode(data.code);
        setStatus('qrcode');
        setPolling(true);
      } else {
        setStatus('error');
        setErrorMsg('QR Code não retornado pela API');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erro ao conectar');
    }
  }, [instanceName, currentOrganization?.id]);

  // Poll status while QR is showing
  useEffect(() => {
    if (!polling || !instanceName.trim()) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('evolution-qrcode', {
          body: {
            organization_id: currentOrganization?.id,
            instance_name: instanceName.trim(),
            action: 'status',
          },
        });

        const state = data?.data?.instance?.state || data?.data?.state;
        if (state === 'open' || state === 'connected') {
          setStatus('connected');
          setPolling(false);
          setQrCode(null);
          toast.success('WhatsApp conectado com sucesso!');
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, instanceName, currentOrganization?.id]);

  // Stop polling after 2 min
  useEffect(() => {
    if (!polling) return;
    const timeout = setTimeout(() => {
      setPolling(false);
      if (status === 'qrcode') {
        setStatus('error');
        setErrorMsg('Tempo esgotado. Tente gerar o QR novamente.');
      }
    }, 120000);
    return () => clearTimeout(timeout);
  }, [polling, status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Conectar Instância via QR Code
        </CardTitle>
        <CardDescription>
          Conecte seu WhatsApp escaneando o QR Code para gerenciar os grupos pagos automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasConfig && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Configure as credenciais da Evolution API na aba "Configuração" antes de conectar.
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label>Nome da Instância</Label>
            <Input
              placeholder="ex: minha-instancia"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={!hasConfig || status === 'loading'}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => invokeQR('create')}
            disabled={!hasConfig || !instanceName.trim() || status === 'loading'}
          >
            {status === 'loading' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conectando...</>
            ) : (
              <><QrCode className="h-4 w-4 mr-2" /> Gerar QR Code</>
            )}
          </Button>
          {status === 'qrcode' && (
            <Button variant="outline" onClick={() => invokeQR('connect')}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar QR
            </Button>
          )}
          {instanceName.trim() && hasConfig && (
            <Button variant="ghost" onClick={() => invokeQR('status')}>
              <Wifi className="h-4 w-4 mr-2" /> Verificar Status
            </Button>
          )}
        </div>

        {/* QR Code Display */}
        {status === 'qrcode' && qrCode && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative border-2 border-primary/20 rounded-xl p-2 bg-background">
              <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56 rounded-lg" />
              {polling && (
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Aguardando...
                </div>
              )}
            </div>
            {pairingCode && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Código de pareamento:</p>
                <code className="text-lg font-bold tracking-widest text-primary">{pairingCode}</code>
              </div>
            )}
            <div className="text-sm text-muted-foreground text-center max-w-sm">
              <p className="font-medium mb-1">Como escanear:</p>
              <ol className="text-left space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no celular</li>
                <li>Vá em <strong>Configurações → Dispositivos Conectados</strong></li>
                <li>Toque em <strong>"Conectar um dispositivo"</strong></li>
                <li>Escaneie o QR Code acima</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connected */}
        {status === 'connected' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">Instância Conectada!</p>
              <p className="text-sm text-muted-foreground">
                A instância <strong>{instanceName}</strong> está online. Agora você pode importar grupos na aba "Grupos".
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <WifiOff className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
