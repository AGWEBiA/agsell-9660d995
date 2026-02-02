import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  Plus,
  MoreHorizontal,
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-amber-500" />,
  admin: <Shield className="h-4 w-4 text-blue-500" />,
  member: <User className="h-4 w-4 text-green-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-500" />,
};

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  viewer: 'Visualizador',
};

export default function Organization() {
  const { user } = useAuth();
  const {
    organizations,
    currentOrganization,
    currentRole,
    loading,
    setCurrentOrganization,
    createOrganization,
  } = useOrganization();
  
  const {
    members,
    invites,
    isLoading: membersLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvite,
  } = useOrganizationMembers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Nome da organização é obrigatório');
      return;
    }

    const slug = newOrgSlug || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { error } = await createOrganization(newOrgName, slug);

    if (!error) {
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgSlug('');
      toast.success('Organização criada com sucesso!');
    } else {
      toast.error('Erro ao criar organização: ' + error.message);
    }
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setIsInviteDialogOpen(false);
          setInviteEmail('');
          setInviteRole('member');
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organização</h1>
          <p className="text-muted-foreground">Gerencie sua equipe e configurações</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
              <DialogDescription>
                Crie uma nova organização para gerenciar sua equipe e projetos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome da Organização</Label>
                <Input
                  id="org-name"
                  placeholder="Minha Empresa"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug (URL amigável)</Label>
                <Input
                  id="org-slug"
                  placeholder="minha-empresa"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                />
                <p className="text-xs text-muted-foreground">
                  Será gerado automaticamente se não for preenchido
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrganization}>
                Criar Organização
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Selector */}
      {organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Suas Organizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  variant={currentOrganization?.id === org.id ? 'default' : 'outline'}
                  onClick={() => setCurrentOrganization(org)}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {org.name}
                  {currentOrganization?.id === org.id && (
                    <Check className="h-4 w-4 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Organization State */}
      {!currentOrganization && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma organização encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira organização para começar a gerenciar sua equipe.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Organização
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Organization Management */}
      {currentOrganization && (
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{members.length}</p>
                      <p className="text-sm text-muted-foreground">Membros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                      <Mail className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{invites.length}</p>
                      <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold capitalize">{currentRole}</p>
                      <p className="text-sm text-muted-foreground">Sua Função</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Membros da Equipe</CardTitle>
                  <CardDescription>
                    Gerencie os membros da sua organização
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Convidar Membro</DialogTitle>
                        <DialogDescription>
                          Envie um convite por email para adicionar um novo membro à equipe.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="colaborador@empresa.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Função</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleInviteMember} disabled={inviteMember.isPending}>
                          {inviteMember.isPending ? 'Enviando...' : 'Enviar Convite'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profiles?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.profiles?.full_name || 'Usuário'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Entrou em {new Date(member.joined_at || member.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {roleIcons[member.role]}
                            {roleLabels[member.role]}
                          </Badge>
                          {isAdmin && member.role !== 'owner' && member.user_id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateMemberRole.mutate({
                                      memberId: member.id,
                                      role: 'admin',
                                    })
                                  }
                                >
                                  Tornar Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateMemberRole.mutate({
                                      memberId: member.id,
                                      role: 'member',
                                    })
                                  }
                                >
                                  Tornar Membro
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateMemberRole.mutate({
                                      memberId: member.id,
                                      role: 'viewer',
                                    })
                                  }
                                >
                                  Tornar Visualizador
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => removeMember.mutate(member.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pending Invites */}
                    {invites.length > 0 && (
                      <>
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground mb-4">
                            Convites Pendentes
                          </h4>
                          {invites.map((invite) => (
                            <div
                              key={invite.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                                  <Mail className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{invite.email}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary">
                                  {roleLabels[invite.role]}
                                </Badge>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => cancelInvite.mutate(invite.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Organização</CardTitle>
                <CardDescription>
                  Informações gerais da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={currentOrganization.name} disabled={!isAdmin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={currentOrganization.slug} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {currentOrganization.plan === 'free' ? 'Gratuito' : currentOrganization.plan}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Criada em</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentOrganization.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
