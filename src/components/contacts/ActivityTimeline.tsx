import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  FileText,
  DollarSign,
  UserPlus,
  Edit,
  Tag,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useActivities, Activity } from '@/hooks/useActivities';

interface ActivityTimelineProps {
  contactId?: string;
  dealId?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  email_sent: <Mail className="h-4 w-4" />,
  email_received: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  deal_created: <DollarSign className="h-4 w-4" />,
  deal_won: <CheckCircle className="h-4 w-4" />,
  deal_lost: <XCircle className="h-4 w-4" />,
  contact_created: <UserPlus className="h-4 w-4" />,
  status_change: <Edit className="h-4 w-4" />,
  tag_added: <Tag className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  email_sent: 'bg-blue-500',
  email_received: 'bg-blue-400',
  call: 'bg-green-500',
  whatsapp: 'bg-emerald-500',
  meeting: 'bg-purple-500',
  note: 'bg-gray-500',
  deal_created: 'bg-amber-500',
  deal_won: 'bg-green-600',
  deal_lost: 'bg-red-500',
  contact_created: 'bg-primary',
  status_change: 'bg-orange-500',
  tag_added: 'bg-pink-500',
  automation: 'bg-violet-500',
};

export function ActivityTimeline({ contactId, dealId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useActivities(contactId, dealId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[300px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma atividade registrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Activities */}
        <div className="space-y-6">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />;
  const color = activityColors[activity.activity_type] || 'bg-gray-500';

  return (
    <div className="flex gap-3 relative">
      {/* Icon */}
      <div
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white ${color}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{activity.title}</p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        {activity.description && (
          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
        )}

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(activity.metadata).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
