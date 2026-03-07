import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Users, MessageSquare, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanWhatsAppGroup {
  id: string;
  name: string;
  group_jid: string;
  instance_name: string;
  is_active: boolean;
  created_at: string;
  plan_whatsapp_group_links?: { plan_id: string }[];
}

interface Plan {
  id: string;
  name: string;
  is_active: boolean;
}

export function PlanWhatsAppGroupsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PlanWhatsAppGroup | null>(null);
  const [form, setForm] = useState({ name: '', group_jid: '', instance_name: '', selectedPlans: [] as string[] });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['plan-whatsapp-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_whatsapp_groups')
        .select('*, plan_whatsapp_group_links(plan_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PlanWhatsAppGroup[];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['all-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const { data: memberCounts = {} } = useQuery({
    queryKey: ['plan-whatsapp-member-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_whatsapp_members')
        .select('group_id')
        .eq('status', 'active');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((m: { group_id: string }) => {
        counts[m.group_id] = (counts[m.group_id] || 0) + 1;
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGroup) {
        // Update group
        const { error } = await supabase
          .from('plan_whatsapp_groups')
          .update({ name: form.name, group_jid: form.group_jid, instance_name: form.instance_name })
          .eq('id', editingGroup.id);
        if (error) throw error;

        // Rebuild plan links
        await supabase.from('plan_whatsapp_group_links').delete().eq('group_id', editingGroup.id);
        if (form.selectedPlans.length > 0) {
          const { error: linkError } = await supabase
            .from('plan_whatsapp_group_links')
            .insert(form.selectedPlans.map(plan_id => ({ group_id: editingGroup.id, plan_id })));
          if (linkError) throw linkError;
        }
      } else {
        // Create group
        const { data: newGroup, error } = await supabase
          .from('plan_whatsapp_groups')
          .insert({ name: form.name, group_jid: form.group_jid, instance_name: form.instance_name })
          .select()
          .single();
        if (error) throw error;

        if (form.selectedPlans.length > 0) {
          const { error: linkError } = await supabase
            .from('plan_whatsapp_group_links')
            .insert(form.selectedPlans.map(plan_id => ({ group_id: (newGroup as { id: string }).id, plan_id })));
          if (linkError) throw linkError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-whatsapp-groups'] });
      toast.success(editingGroup ? 'Grupo atualizado!' : 'Grupo criado!');
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('plan_whatsapp_groups')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-whatsapp-groups'] });
      toast.success('Status atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plan_whatsapp_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-whatsapp-groups'] });
      toast.success('Grupo removido!');
    },
  });

  const openCreate = () => {
    setEditingGroup(null);
    setForm({ name: '', group_jid: '', instance_name: '', selectedPlans: [] });
    setDialogOpen(true);
  };

  const openEdit = (group: PlanWhatsAppGroup) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      group_jid: group.group_jid,
      instance_name: group.instance_name,
      selectedPlans: group.plan_whatsapp_group_links?.map(l => l.plan_id) || [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
  };

  const togglePlan = (planId: string) => {
    setForm(prev => ({
      ...prev,
      selectedPlans: prev.selectedPlans.includes(planId)
        ? prev.selectedPlans.filter(id => id !== planId)
        : [...prev.selectedPlans, planId],
    }));
  };

  const getPlanNames = (group: PlanWhatsAppGroup) => {
    const planIds = group.plan_whatsapp_group_links?.map(l => l.plan_id) || [];
    return plans.filter(p => planIds.includes(p.id)).map(p => p.name);
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Grupos WhatsApp por Plano
            </CardTitle>
            <CardDescription>
              Gerencie grupos de WhatsApp vinculados a planos de assinatura. Usuários são adicionados/removidos automaticamente.
            </CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Novo Grupo
          </Button>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum grupo configurado. Crie um grupo e vincule a um plano.
            </p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>JID do Grupo</TableHead>
                    <TableHead>Instância</TableHead>
                    <TableHead>Planos</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                        {group.group_jid || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{group.instance_name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getPlanNames(group).map(name => (
                            <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                          ))}
                          {getPlanNames(group).length === 0 && (
                            <span className="text-xs text-muted-foreground">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Users className="h-3 w-3" /> {memberCounts[group.id] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={group.is_active}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: group.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Remover este grupo?')) deleteMutation.mutate(group.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo WhatsApp'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Comunidade Starter"
              />
            </div>
            <div className="space-y-2">
              <Label>JID do Grupo (WhatsApp)</Label>
              <Input
                value={form.group_jid}
                onChange={(e) => setForm(prev => ({ ...prev, group_jid: e.target.value }))}
                placeholder="Ex: 120363123456789@g.us"
              />
              <p className="text-xs text-muted-foreground">
                O JID é o identificador do grupo na Evolution API.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nome da Instância</Label>
              <Input
                value={form.instance_name}
                onChange={(e) => setForm(prev => ({ ...prev, instance_name: e.target.value }))}
                placeholder="Nome da instância na Evolution API"
              />
            </div>
            <div className="space-y-2">
              <Label>Planos Vinculados</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.selectedPlans.includes(plan.id)}
                      onCheckedChange={() => togglePlan(plan.id)}
                    />
                    <span className="text-sm">{plan.name}</span>
                  </div>
                ))}
                {plans.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum plano disponível</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
