import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useWhatsAppGroups, WhatsAppGroupMessage } from '@/hooks/useWhatsAppGroups';
import { WhatsAppMultiInstanceSelector } from './WhatsAppMultiInstanceSelector';

export function WhatsAppGroupMessages({ currentInstanceId }: { currentInstanceId?: string | null }) {
  const {
    groups,
    groupMessages,
    isLoadingMessages,
    createGroupMessage,
    updateGroupMessage,
    deleteGroupMessage,
  } = useWhatsAppGroups();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>(
    currentInstanceId ? [currentInstanceId] : []
  );
  const [newMessage, setNewMessage] = useState<{
    name: string;
    content: string;
    message_type: string;
    trigger_event: string;
    is_active: boolean;
    target_groups: string[];
  }>({
    name: '',
    content: '',
    message_type: 'text',
    trigger_event: 'manual',
    is_active: true,
    target_groups: [],
  });

  const handleCreateMessage = () => {
    createGroupMessage(newMessage);
    setIsCreateDialogOpen(false);
    setNewMessage({
      name: '',
      content: '',
      message_type: 'text',
      trigger_event: 'manual',
      is_active: true,
      target_groups: [],
    });
  };

  const getTriggerBadge = (trigger: string | null) => {
    const triggers: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      on_join: {
        icon: <UserPlus className="h-3 w-3" />,
        label: 'Ao Entrar',
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      },
      on_leave: {
        icon: <UserMinus className="h-3 w-3" />,
        label: 'Ao Sair',
        color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
      scheduled: {
        icon: <Clock className="h-3 w-3" />,
        label: 'Agendada',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      },
      manual: {
        icon: <Zap className="h-3 w-3" />,
        label: 'Manual',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      },
    };
    const config = triggers[trigger || 'manual'];
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mensagens Automáticas</h2>
          <p className="text-muted-foreground">
            Configure mensagens automáticas para grupos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Mensagem Automática</DialogTitle>
              <DialogDescription>
                Configure uma mensagem para ser enviada automaticamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="messageName">Nome</Label>
                <Input
                  id="messageName"
                  placeholder="Ex: Boas-vindas ao Grupo"
                  value={newMessage.name}
                  onChange={(e) => setNewMessage({ ...newMessage, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerEvent">Gatilho</Label>
                <Select
                  value={newMessage.trigger_event}
                  onValueChange={(value) =>
                    setNewMessage({ ...newMessage, trigger_event: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_join">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-green-600" />
                        Quando alguém entrar
                      </div>
                    </SelectItem>
                    <SelectItem value="on_leave">
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-red-600" />
                        Quando alguém sair
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Agendada
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Envio Manual
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instance selector */}
              <WhatsAppMultiInstanceSelector
                selectedIds={selectedInstanceIds}
                onChange={setSelectedInstanceIds}
                label="Instâncias para automação"
                currentInstanceId={currentInstanceId}
              />

              <div className="space-y-2">
                <Label htmlFor="messageContent">Conteúdo da Mensagem</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Digite sua mensagem... Use {{nome}} para o nome do membro"
                  className="min-h-24"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{{nome}}'}, {'{{grupo}}'}, {'{{data}}'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Ativa</Label>
                <Switch
                  id="isActive"
                  checked={newMessage.is_active}
                  onCheckedChange={(checked) =>
                    setNewMessage({ ...newMessage, is_active: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateMessage}
                disabled={!newMessage.name || !newMessage.content}
              >
                Criar Mensagem
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages List */}
      {isLoadingMessages ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma mensagem configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie mensagens automáticas para seus grupos
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Mensagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {message.name}
                    </CardTitle>
                    <div className="mt-2 flex items-center gap-2">
                      {getTriggerBadge(message.trigger_event)}
                      {message.target_groups && message.target_groups.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {message.target_groups.length} grupo(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={message.is_active}
                      onCheckedChange={(checked) =>
                        updateGroupMessage({ id: message.id, is_active: checked })
                      }
                    />
                    <Badge variant={message.is_active ? 'default' : 'outline'} className="text-xs">
                      {message.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (confirm('Deseja realmente excluir esta mensagem?')) {
                          deleteGroupMessage(message.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 bg-muted p-3 rounded-lg">
                  {message.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
