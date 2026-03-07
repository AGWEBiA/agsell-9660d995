import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Users, RefreshCw, Plus, Check, Loader2 } from 'lucide-react';
import { usePaidGroups, usePaidGroupsConfig } from '@/hooks/usePaidGroups';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface EvolutionGroup {
  id: string;
  subject: string;
  size: number;
  creation: number;
}

interface InstanceGroups {
  instance_name: string;
  groups: EvolutionGroup[];
}

export function PaidGroupsManager() {
  const { groups, isLoading, createGroup, deleteGroup } = usePaidGroups();
  const { config } = usePaidGroupsConfig();
  const { currentOrganization } = useOrganization();
  const [selectedGroups, setSelectedGroups] = useState<Map<string, { jid: string; subject: string; instance: string }>>(new Map());
  const [adding, setAdding] = useState(false);

  const evolutionQuery = useQuery({
    queryKey: ['evolution-groups', currentOrganization?.id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('fetch-evolution-groups', {
        body: { organization_id: currentOrganization!.id },
      });

      if (error) throw error;
      return data as { instances: InstanceGroups[] };
    },
    enabled: false, // manual trigger only
  });

  const existingJids = new Set(groups.map(g => g.group_jid));

  const toggleGroup = (jid: string, subject: string, instance: string) => {
    const next = new Map(selectedGroups);
    if (next.has(jid)) next.delete(jid);
    else next.set(jid, { jid, subject, instance });
    setSelectedGroups(next);
  };

  const handleAddSelected = async () => {
    if (selectedGroups.size === 0) return;
    setAdding(true);
    let added = 0;
    for (const [_, g] of selectedGroups) {
      try {
        await new Promise<void>((resolve, reject) => {
          createGroup.mutate(
            { name: g.subject, group_jid: g.jid, instance_name: g.instance },
            { onSuccess: () => { added++; resolve(); }, onError: reject }
          );
        });
      } catch (e) {
        console.error('Error adding group:', e);
      }
    }
    setSelectedGroups(new Map());
    setAdding(false);
    if (added > 0) toast.success(`${added} grupo(s) adicionado(s)!`);
  };

  const hasConfig = !!(config?.evolution_api_url && config?.evolution_api_key);
  const allInstances = evolutionQuery.data?.instances ?? [];
  const allAvailableGroups = allInstances.flatMap(inst =>
    inst.groups
      .filter(g => !existingJids.has(g.id))
      .map(g => ({ ...g, instance_name: inst.instance_name }))
  );

  return (
    <div className="space-y-6">
      {/* Fetch groups from Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Importar Grupos da Evolution API</CardTitle>
          <CardDescription>
            {hasConfig
              ? 'Busque os grupos disponíveis nas suas instâncias conectadas e selecione quais deseja usar.'
              : 'Configure as credenciais da Evolution API na aba "Configuração" primeiro.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => evolutionQuery.refetch()}
            disabled={!hasConfig || evolutionQuery.isFetching}
            variant="outline"
          >
            {evolutionQuery.isFetching ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Buscar Grupos</>
            )}
          </Button>

          {evolutionQuery.isError && (
            <p className="text-sm text-destructive">Erro ao buscar grupos: {(evolutionQuery.error as Error).message}</p>
          )}

          {allInstances.length > 0 && allAvailableGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">Todos os grupos já foram adicionados ou nenhum grupo encontrado.</p>
          )}

          {allAvailableGroups.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nome do Grupo</TableHead>
                      <TableHead>JID</TableHead>
                      <TableHead>Instância</TableHead>
                      <TableHead>Membros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAvailableGroups.map((g) => (
                      <TableRow key={g.id} className="cursor-pointer" onClick={() => toggleGroup(g.id, g.subject, g.instance_name)}>
                        <TableCell>
                          <Checkbox checked={selectedGroups.has(g.id)} onCheckedChange={() => toggleGroup(g.id, g.subject, g.instance_name)} />
                        </TableCell>
                        <TableCell className="font-medium">{g.subject}</TableCell>
                        <TableCell><code className="text-xs text-muted-foreground">{g.id}</code></TableCell>
                        <TableCell><Badge variant="outline">{g.instance_name}</Badge></TableCell>
                        <TableCell>{g.size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleAddSelected} disabled={selectedGroups.size === 0 || adding}>
                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Adicionar {selectedGroups.size > 0 ? `${selectedGroups.size} grupo(s)` : 'selecionados'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Existing groups */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado. Use o botão acima para importar da Evolution API.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>JID</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><code className="text-xs">{g.group_jid}</code></TableCell>
                    <TableCell>{g.instance_name || '-'}</TableCell>
                    <TableCell><Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteGroup.mutate(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
