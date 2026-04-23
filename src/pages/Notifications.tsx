import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  DollarSign,
  AlertTriangle,
  Calendar,
  Zap,
  Mail,
  MessageSquare,
  WifiOff,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';

const notificationIcons: Record<string, React.ReactNode> = {
  new_lead: <UserPlus className="h-5 w-5 text-blue-500" />,
  deal_won: <DollarSign className="h-5 w-5 text-green-500" />,
  deal_lost: <DollarSign className="h-5 w-5 text-red-500" />,
  task_due: <Calendar className="h-5 w-5 text-orange-500" />,
  task_overdue: <AlertTriangle className="h-5 w-5 text-destructive" />,
  automation: <Zap className="h-5 w-5 text-purple-500" />,
  email: <Mail className="h-5 w-5 text-blue-500" />,
  whatsapp: <MessageSquare className="h-5 w-5 text-emerald-500" />,
  whatsapp_disconnected: <WifiOff className="h-5 w-5 text-destructive" />,
  system: <Bell className="h-5 w-5 text-muted-foreground" />,
};

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="container max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card className="p-12 text-center text-muted-foreground">Carregando...</Card>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Você não possui notificações</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                !n.is_read ? 'bg-muted/30 border-primary/30' : ''
              }`}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {notificationIcons[n.type] || notificationIcons.system}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead.mutate(n.id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification.mutate(n.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
