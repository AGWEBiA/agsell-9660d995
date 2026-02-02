import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Tag,
  Star,
  Bell,
  Clock,
  MessageSquare,
  UserPlus,
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
} from 'lucide-react';

export type ActionType = 
  | 'send_email'
  | 'add_tag'
  | 'remove_tag'
  | 'update_score'
  | 'send_notification'
  | 'wait'
  | 'send_whatsapp'
  | 'create_task'
  | 'move_deal_stage';

export type Action = {
  id: string;
  type: ActionType;
  config: Record<string, unknown>;
};

const actionTypes = [
  { value: 'send_email', label: 'Enviar Email', icon: Mail, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
  { value: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
  { value: 'update_score', label: 'Atualizar Lead Score', icon: Star, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
  { value: 'send_notification', label: 'Enviar Notificação', icon: Bell, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' },
  { value: 'wait', label: 'Aguardar', icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  { value: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
  { value: 'create_task', label: 'Criar Tarefa', icon: UserPlus, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
];

interface AutomationActionsEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
}

export function AutomationActionsEditor({ actions, onChange }: AutomationActionsEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [newActionType, setNewActionType] = useState<ActionType | ''>('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});

  const handleAddAction = () => {
    if (!newActionType) return;

    const newAction: Action = {
      id: crypto.randomUUID(),
      type: newActionType,
      config: actionConfig,
    };

    onChange([...actions, newAction]);
    setIsDialogOpen(false);
    setNewActionType('');
    setActionConfig({});
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setNewActionType(action.type);
    setActionConfig(action.config);
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAction || !newActionType) return;

    const updatedActions = actions.map((a) =>
      a.id === editingAction.id
        ? { ...a, type: newActionType, config: actionConfig }
        : a
    );

    onChange(updatedActions);
    setIsDialogOpen(false);
    setEditingAction(null);
    setNewActionType('');
    setActionConfig({});
  };

  const handleRemoveAction = (actionId: string) => {
    onChange(actions.filter((a) => a.id !== actionId));
  };

  const renderConfigFields = () => {
    switch (newActionType) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template de Email</Label>
              <Select
                value={(actionConfig.template_id as string) || ''}
                onValueChange={(v) => setActionConfig({ ...actionConfig, template_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                placeholder="Assunto do email"
                value={(actionConfig.subject as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Conteúdo do email..."
                rows={4}
                value={(actionConfig.content as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, content: e.target.value })}
              />
            </div>
          </div>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div className="space-y-2">
            <Label>Nome da Tag</Label>
            <Input
              placeholder="Ex: Lead Quente"
              value={(actionConfig.tag_name as string) || ''}
              onChange={(e) => setActionConfig({ ...actionConfig, tag_name: e.target.value })}
            />
          </div>
        );

      case 'update_score':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select
                value={(actionConfig.operation as string) || 'add'}
                onValueChange={(v) => setActionConfig({ ...actionConfig, operation: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adicionar pontos</SelectItem>
                  <SelectItem value="subtract">Subtrair pontos</SelectItem>
                  <SelectItem value="set">Definir valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pontos</Label>
              <Input
                type="number"
                placeholder="10"
                value={(actionConfig.points as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, points: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Título da notificação"
                value={(actionConfig.title as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Mensagem da notificação..."
                rows={3}
                value={(actionConfig.message as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
              />
            </div>
          </div>
        );

      case 'wait':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tempo de Espera</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="1"
                  className="w-24"
                  value={(actionConfig.duration as string) || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, duration: parseInt(e.target.value) || 0 })}
                />
                <Select
                  value={(actionConfig.unit as string) || 'hours'}
                  onValueChange={(v) => setActionConfig({ ...actionConfig, unit: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'send_whatsapp':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template de Mensagem</Label>
              <Select
                value={(actionConfig.template as string) || ''}
                onValueChange={(v) => setActionConfig({ ...actionConfig, template: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Mensagem de Boas-vindas</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá {{nome}}, seja bem-vindo..."
                rows={4}
                value={(actionConfig.message as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
              />
            </div>
          </div>
        );

      case 'create_task':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Tarefa</Label>
              <Input
                placeholder="Ex: Fazer follow-up com lead"
                value={(actionConfig.title as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo (dias)</Label>
              <Input
                type="number"
                placeholder="3"
                value={(actionConfig.due_days as string) || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, due_days: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={(actionConfig.priority as string) || 'medium'}
                onValueChange={(v) => setActionConfig({ ...actionConfig, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getActionTypeInfo = (type: ActionType) => {
    return actionTypes.find((t) => t.value === type);
  };

  const getActionSummary = (action: Action): string => {
    switch (action.type) {
      case 'send_email':
        return action.config.subject ? `"${String(action.config.subject)}"` : 'Email configurado';
      case 'add_tag':
        return action.config.tag_name ? `Tag: ${String(action.config.tag_name)}` : 'Adicionar tag';
      case 'remove_tag':
        return action.config.tag_name ? `Tag: ${String(action.config.tag_name)}` : 'Remover tag';
      case 'update_score':
        return `${action.config.operation === 'add' ? '+' : action.config.operation === 'subtract' ? '-' : '='} ${action.config.points || 0} pontos`;
      case 'send_notification':
        return action.config.title ? String(action.config.title) : 'Notificação';
      case 'wait':
        return `${action.config.duration || 0} ${action.config.unit === 'minutes' ? 'min' : action.config.unit === 'hours' ? 'h' : 'd'}`;
      case 'send_whatsapp':
        return 'Mensagem WhatsApp';
      case 'create_task':
        return action.config.title ? String(action.config.title) : 'Nova tarefa';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Ações da Automação</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingAction(null);
            setNewActionType('');
            setActionConfig({});
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Ação
        </Button>
      </div>

      {actions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma ação configurada. Clique em "Adicionar Ação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => {
            const typeInfo = getActionTypeInfo(action.type);
            if (!typeInfo) return null;
            const Icon = typeInfo.icon;

            return (
              <Card key={action.id} className="group hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      {index > 0 && <ArrowRight className="h-3 w-3" />}
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${typeInfo.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{typeInfo.label}</p>
                      <p className="text-xs text-muted-foreground">{getActionSummary(action)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEditAction(action)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? 'Editar Ação' : 'Nova Ação'}
            </DialogTitle>
            <DialogDescription>
              Configure a ação que será executada na automação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select
                value={newActionType}
                onValueChange={(v) => {
                  setNewActionType(v as ActionType);
                  setActionConfig({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {newActionType && renderConfigFields()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={editingAction ? handleSaveEdit : handleAddAction}>
              {editingAction ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
