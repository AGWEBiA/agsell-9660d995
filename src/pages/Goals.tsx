import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Target, Trash2, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Goals() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', description: '', goal_type: 'event', target_count: 100, target_event: '' });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversion_goals')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: any) => {
      const { data, error } = await supabase
        .from('conversion_goals')
        .insert({ ...goal, organization_id: orgId, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada!');
      setShowCreate(false);
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conversion_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta excluída!');
    },
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Metas & Conversões</h1>
          <p className="text-muted-foreground">Defina metas e acompanhe conversões em tempo real</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Meta de Conversão</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} placeholder="Ex: 1000 leads em março" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes da meta" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={newGoal.goal_type} onValueChange={v => setNewGoal(p => ({ ...p, goal_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Evento (ex: page_view, signup)</SelectItem>
                    <SelectItem value="contacts">Novos Contatos</SelectItem>
                    <SelectItem value="deals">Deals Fechados</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newGoal.goal_type === 'event' && (
                <div>
                  <label className="text-sm font-medium text-foreground">Nome do Evento</label>
                  <Input value={newGoal.target_event} onChange={e => setNewGoal(p => ({ ...p, target_event: e.target.value }))} placeholder="signup" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground">Meta (quantidade)</label>
                <Input type="number" value={newGoal.target_count} onChange={e => setNewGoal(p => ({ ...p, target_count: parseInt(e.target.value) || 0 }))} />
              </div>
              <Button onClick={() => createGoal.mutate(newGoal)} disabled={!newGoal.name || createGoal.isPending} className="w-full">
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><Target className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Metas Ativas</p>
              <p className="text-2xl font-bold text-foreground">{activeGoals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><CheckCircle className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Metas Concluídas</p>
              <p className="text-2xl font-bold text-foreground">{completedGoals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10"><TrendingUp className="h-6 w-6 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Conversões</p>
              <p className="text-2xl font-bold text-foreground">{goals.reduce((s, g) => s + (g.current_count || 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map(goal => {
          const progress = goal.target_count > 0 ? Math.min(100, Math.round((goal.current_count / goal.target_count) * 100)) : 0;
          return (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-foreground">{goal.name}</h3>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>{goal.status === 'active' ? 'Ativa' : 'Concluída'}</Badge>
                      <Badge variant="outline">{goal.goal_type}</Badge>
                    </div>
                    {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(goal.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{goal.current_count} / {goal.target_count}</span>
                    <span className="font-semibold text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                {goal.deadline && (
                  <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Prazo: {format(new Date(goal.deadline), 'dd/MM/yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Target className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma meta definida</h3>
              <p className="text-muted-foreground">Crie metas para acompanhar conversões e resultados da sua equipe.</p>
              <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Criar Meta</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
