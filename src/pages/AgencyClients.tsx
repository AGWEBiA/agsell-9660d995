import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Plus,
  Copy,
  Link,
  Mail,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Wrench,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  active: { label: 'Ativo', variant: 'default' },
  revoked: { label: 'Revogado', variant: 'destructive' },
};

const accessLevelLabels: Record<string, { label: string; icon: typeof Crown; description: string }> = {
  owner: { label: 'Total (Owner)', icon: Crown, description: 'Acesso completo incluindo billing' },
  operational: { label: 'Operacional', icon: Wrench, description: 'Gerencia contatos, deals, campanhas' },
  viewer: { label: 'Visualização', icon: Eye, description: 'Apenas visualizar dados' },
};

export default function AgencyClients() {
  const {
    clients,
    agencies,
    isAgencyPlan,
    isLoading,
    inviteClient,
    acceptAgencyLink,
    revokeAgencyLink,
    updateAccessLevel,
    removeClient,
  } = useAgencyClients();
  const { setCurrentOrganization } = useOrganization();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteClient.mutate({ email: inviteEmail });
    setInviteEmail('');
    setInviteDialogOpen(false);
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/agency-invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado!');
  };

  const handleAccessClient = async (clientOrg: any) => {
    if (clientOrg) {
      setCurrentOrganization(clientOrg);
      toast.success(`Acessando conta: ${clientOrg.name}`);
    }
  };

  const activeClients = clients.filter(c => c.status === 'active');
  const pendingClients = clients.filter(c => c.status === 'pending');

  const filteredClients = clients.filter(c => {
    const name = c.client_org?.name?.toLowerCase() || '';
    const email = c.invite_email?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as contas dos seus clientes a partir do seu painel
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Vincular Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Novo Cliente</DialogTitle>
              <DialogDescription>
                Envie um convite por email ou compartilhe o link de convite.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email do proprietário da conta</Label>
                <Input
                  placeholder="cliente@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeClients.length}</p>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary">
                <Mail className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingClients.length}</p>
                <p className="text-sm text-muted-foreground">Convites Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent">
                <Crown className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total de Vínculos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum cliente vinculado</h3>
              <p className="text-muted-foreground mb-4">
                Comece vinculando contas de clientes para gerenciá-las pelo seu painel.
              </p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Vincular Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const statusInfo = statusLabels[client.status] || statusLabels.pending;
            const accessInfo = accessLevelLabels[client.access_level] || accessLevelLabels.operational;
            const AccessIcon = accessInfo.icon;

            return (
              <Card key={client.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {client.client_org?.name?.[0]?.toUpperCase() || client.invite_email?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {client.client_org?.name || client.invite_email || 'Pendente'}
                          </h3>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {client.invite_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.invite_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <AccessIcon className="h-3 w-3" />
                            {accessInfo.label}
                          </span>
                          {client.client_org?.plan && (
                            <Badge variant="outline" className="text-xs">
                              Plano: {client.client_org.plan}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.status === 'pending' && client.invite_token && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInviteLink(client.invite_token!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>
                      )}
                      {client.status === 'active' && client.client_org && (
                        <Button
                          size="sm"
                          onClick={() => handleAccessClient(client.client_org)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Acessar Conta
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeClient.mutate(client.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
