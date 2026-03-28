import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Download, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignData {
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: unknown[];
}

interface CampaignCodeShareProps {
  campaign?: CampaignData;
  onImport: (campaign: CampaignData) => void;
}

export function CampaignCodeShare({ campaign, onImport }: CampaignCodeShareProps) {
  const [importCode, setImportCode] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportCode = campaign
    ? btoa(unescape(encodeURIComponent(JSON.stringify({
        v: 1,
        name: campaign.name,
        trigger_type: campaign.trigger_type,
        trigger_config: campaign.trigger_config,
        actions: campaign.actions,
      }))))
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importCode.trim()))));
      if (!decoded.name || !decoded.trigger_type || !decoded.actions) {
        throw new Error('Formato inválido');
      }
      onImport({
        name: decoded.name,
        trigger_type: decoded.trigger_type,
        trigger_config: decoded.trigger_config || {},
        actions: decoded.actions,
      });
      setImportCode('');
      setIsImportOpen(false);
      toast.success(`Campanha "${decoded.name}" importada com sucesso!`);
    } catch {
      toast.error('Código inválido. Verifique e tente novamente.');
    }
  };

  return (
    <div className="flex gap-2">
      {campaign && (
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Campanha</DialogTitle>
              <DialogDescription>
                Copie o código abaixo e compartilhe para clonar esta campanha em outra conta.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Código da Campanha</Label>
              <Textarea
                readOnly
                value={exportCode}
                className="min-h-32 font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar Código
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Campanha</DialogTitle>
            <DialogDescription>
              Cole o código de uma campanha compartilhada para cloná-la aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Código da Campanha</Label>
            <Textarea
              placeholder="Cole o código aqui..."
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="min-h-32 font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!importCode.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
