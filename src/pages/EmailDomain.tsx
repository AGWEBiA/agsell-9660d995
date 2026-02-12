import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Copy,
  Shield,
  Mail,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useEmailDomains } from '@/hooks/useEmailDomains';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
      );
    case 'verifying':
      return (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Verificando
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Falhou
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
  }
}

function DnsCheckIcon({ verified }: { verified: boolean }) {
  return verified ? (
    <CheckCircle className="h-4 w-4 text-green-600" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" />
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

export default function EmailDomain() {
  const { domains, isLoading, addDomain, verifyDomain, deleteDomain } = useEmailDomains();
  const [open, setOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newDomain.trim()) return;
    addDomain.mutate(
      { domain: newDomain.trim().toLowerCase(), from_email: fromEmail || undefined, from_name: fromName || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setNewDomain('');
          setFromEmail('');
          setFromName('');
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Domínio de E-mail
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure seu domínio personalizado para envio de e-mails com máxima entregabilidade
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Domínio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Domínio de E-mail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Domínio</Label>
                <Input
                  placeholder="suaempresa.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite apenas o domínio, sem "www" ou "https://"
                </p>
              </div>
              <div>
                <Label>E-mail Remetente</Label>
                <Input
                  placeholder={`noreply@${newDomain || 'seudominio.com'}`}
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Nome do Remetente</Label>
                <Input
                  placeholder="Sua Empresa"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newDomain.trim() || addDomain.isPending}>
                {addDomain.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Como funciona?</p>
              <p className="text-muted-foreground mt-1">
                Para enviar e-mails usando seu próprio domínio (ex: <code className="bg-muted px-1 rounded">contato@suaempresa.com</code>),
                você precisa configurar registros DNS que autorizam nossos servidores a enviar em seu nome.
                Isso garante melhor entregabilidade e evita que seus e-mails caiam no spam.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domains List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum domínio configurado</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Adicione seu domínio de e-mail para começar a enviar mensagens com seu endereço personalizado.
            </p>
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Domínio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain: any) => (
            <Card key={domain.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {domain.domain}
                    </CardTitle>
                    <CardDescription>
                      {domain.from_email && (
                        <span className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" />
                          {domain.from_name ? `${domain.from_name} <${domain.from_email}>` : domain.from_email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={domain.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyDomain.mutate(domain.id)}
                      disabled={verifyDomain.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${verifyDomain.isPending ? 'animate-spin' : ''}`} />
                      Verificar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ao remover o domínio <strong>{domain.domain}</strong>, os e-mails passarão a ser enviados pelo domínio padrão da plataforma.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDomain.mutate(domain.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* DNS Status Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'SPF', verified: domain.spf_verified, icon: Shield },
                    { label: 'DKIM', verified: domain.dkim_verified, icon: Shield },
                    { label: 'DMARC', verified: domain.dmarc_verified, icon: Shield },
                    { label: 'MX', verified: domain.mx_verified, icon: Mail },
                  ].map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        check.verified
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <DnsCheckIcon verified={check.verified} />
                      <span className="text-sm font-medium">{check.label}</span>
                    </div>
                  ))}
                </div>

                {domain.verification_error && domain.status !== 'verified' && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {domain.verification_error}
                  </div>
                )}

                {/* DNS Records */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                    className="text-primary"
                  >
                    {expandedDomain === domain.id ? 'Ocultar registros DNS' : 'Ver registros DNS necessários'}
                  </Button>

                  {expandedDomain === domain.id && (
                    <div className="mt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Finalidade</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(domain.dns_records || []).map((record: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Badge variant="outline">{record.type}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs max-w-[200px] truncate">
                                {record.name}
                              </TableCell>
                              <TableCell className="font-mono text-xs max-w-[300px] truncate">
                                {record.value}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{record.purpose}</span>
                                <p className="text-xs text-muted-foreground">{record.description}</p>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.value)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">📋 Instruções:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Acesse o painel de administração do seu provedor de DNS (ex: Cloudflare, GoDaddy, Registro.br)</li>
                          <li>Adicione cada registro listado acima na zona DNS do domínio <code className="bg-background px-1 rounded">{domain.domain}</code></li>
                          <li>Aguarde a propagação DNS (pode levar até 48 horas, normalmente menos de 1 hora)</li>
                          <li>Clique em "Verificar" para confirmar a configuração</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>

                {domain.last_verified_at && (
                  <p className="text-xs text-muted-foreground">
                    Última verificação: {new Date(domain.last_verified_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
