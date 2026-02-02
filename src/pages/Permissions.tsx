import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions, MODULE_LABELS, ACTION_LABELS, AppModule, AppAction, Permission, PermissionProfile } from '@/hooks/usePermissions';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { Shield, Users, Plus, Settings, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  viewer: 'Visualizador',
};

const ALL_MODULES: AppModule[] = [
  'contacts', 'companies', 'pipeline', 'tasks', 'inbox', 'email',
  'whatsapp', 'automations', 'lead_scoring', 'forms', 'analytics',
  'integrations', 'settings', 'organization'
];

const ALL_ACTIONS: AppAction[] = ['view', 'create', 'edit', 'delete', 'export', 'import', 'manage'];

function ProfileEditor({ 
  profile, 
  onSave, 
  onCancel 
}: { 
  profile?: PermissionProfile; 
  onSave: (data: { name: string; slug: string; description: string; permissions: Permission[] }) => void; 
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [permissions, setPermissions] = useState<Permission[]>(profile?.permissions || []);

  const togglePermission = (module: AppModule, action: AppAction) => {
    const exists = permissions.some(p => p.module === module && p.action === action);
    if (exists) {
      setPermissions(permissions.filter(p => !(p.module === module && p.action === action)));
    } else {
      setPermissions([...permissions, { module, action }]);
    }
  };

  const hasPermission = (module: AppModule, action: AppAction) => {
    return permissions.some(p => 
      (p.module === module && p.action === action) ||
      (p.module === module && p.action === 'manage')
    );
  };

  const toggleManage = (module: AppModule) => {
    const hasManage = permissions.some(p => p.module === module && p.action === 'manage');
    if (hasManage) {
      setPermissions(permissions.filter(p => p.module !== module));
    } else {
      // Remove individual permissions and add manage
      setPermissions([
        ...permissions.filter(p => p.module !== module),
        { module, action: 'manage' }
      ]);
    }
  };

  const handleSave = () => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    onSave({ name, slug, description, permissions });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome do Perfil</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Gerente de Vendas"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva as responsabilidades deste perfil"
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Permissões por Módulo</Label>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Módulo</TableHead>
                <TableHead className="text-center">Gerenciar</TableHead>
                {['view', 'create', 'edit', 'delete'].map(action => (
                  <TableHead key={action} className="text-center text-xs">
                    {ACTION_LABELS[action as AppAction]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_MODULES.map(module => {
                const hasManage = permissions.some(p => p.module === module && p.action === 'manage');
                return (
                  <TableRow key={module}>
                    <TableCell className="font-medium">{MODULE_LABELS[module]}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={hasManage} 
                        onCheckedChange={() => toggleManage(module)}
                      />
                    </TableCell>
                    {(['view', 'create', 'edit', 'delete'] as AppAction[]).map(action => (
                      <TableCell key={action} className="text-center">
                        <Checkbox 
                          checked={hasPermission(module, action)} 
                          disabled={hasManage}
                          onCheckedChange={() => togglePermission(module, action)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!name}>Salvar Perfil</Button>
      </div>
    </div>
  );
}

export default function Permissions() {
  const { profiles, assignProfile, createProfile, isLoading } = usePermissions();
  const { members } = useOrganizationMembers();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PermissionProfile | null>(null);

  const handleCreateProfile = (data: { name: string; slug: string; description: string; permissions: Permission[] }) => {
    createProfile.mutate(data, {
      onSuccess: () => setShowCreateDialog(false),
    });
  };

  const handleAssignProfile = (memberId: string, profileId: string | null) => {
    assignProfile.mutate({ memberId, profileId: profileId === 'none' ? null : profileId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const systemProfiles = profiles.filter(p => p.is_system);
  const customProfiles = profiles.filter(p => !p.is_system);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissões</h1>
          <p className="text-muted-foreground">Gerencie perfis de acesso e atribua aos membros</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Perfil de Permissão</DialogTitle>
              <DialogDescription>
                Defina um novo perfil com permissões personalizadas
              </DialogDescription>
            </DialogHeader>
            <ProfileEditor 
              onSave={handleCreateProfile} 
              onCancel={() => setShowCreateDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="profiles">
            <Shield className="h-4 w-4 mr-2" />
            Perfis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Organização</CardTitle>
              <CardDescription>Atribua perfis de permissão aos membros</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Perfil de Permissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {member.profiles?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.profiles?.full_name || 'Usuário'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(ROLE_COLORS[member.role])}>
                          {ROLE_LABELS[member.role] || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={(member as any).permission_profile_id || 'none'}
                          onValueChange={(value) => handleAssignProfile(member.id, value)}
                          disabled={member.role === 'owner'}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecionar perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Padrão da função</span>
                            </SelectItem>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name}
                                {profile.is_system && (
                                  <Lock className="h-3 w-3 ml-2 inline text-muted-foreground" />
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.role === 'owner' && (
                          <span className="text-xs text-muted-foreground">
                            Acesso total
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="mt-4 space-y-4">
          {/* System Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Perfis do Sistema
              </CardTitle>
              <CardDescription>Perfis pré-definidos que não podem ser editados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemProfiles.map((profile) => (
                  <Card key={profile.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {profile.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {profile.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {profile.permissions.slice(0, 5).map((perm, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {MODULE_LABELS[perm.module as AppModule]}
                          </Badge>
                        ))}
                        {profile.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.permissions.length - 5}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Perfis Personalizados
              </CardTitle>
              <CardDescription>Perfis criados por você</CardDescription>
            </CardHeader>
            <CardContent>
              {customProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum perfil personalizado criado</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Perfil
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {customProfiles.map((profile) => (
                    <Card key={profile.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            {profile.name}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => setEditingProfile(profile)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {profile.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {profile.permissions.slice(0, 5).map((perm, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {MODULE_LABELS[perm.module as AppModule]}
                            </Badge>
                          ))}
                          {profile.permissions.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.permissions.length - 5}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
