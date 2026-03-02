import {
  Zap, MessageSquare, Mail, Instagram, Send,
  Heart, Eye, UserPlus, MessageCircle, Sparkles,
  Tag, Star, Bell, Clock, CheckSquare, GitBranch,
  Timer, Flame, MailCheck, Filter,
} from 'lucide-react';

export interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'timer' | 'warmup';
  subtype: string;
  label: string;
  config: Record<string, unknown>;
  children?: string[];
  conditionTrue?: string;
  conditionFalse?: string;
}

export const triggerOptions = [
  { id: 'instagram_comment', label: 'Comentário no Post', icon: Heart, channel: 'instagram', color: 'from-pink-500 to-purple-500', description: 'Quando alguém comenta em qualquer post' },
  { id: 'instagram_specific_post', label: 'Post Específico', icon: Instagram, channel: 'instagram', color: 'from-purple-500 to-pink-500', description: 'Quando alguém comenta em um post específico' },
  { id: 'instagram_dm', label: 'DM Recebida', icon: MessageCircle, channel: 'instagram', color: 'from-purple-500 to-orange-400', description: 'Quando alguém envia uma DM' },
  { id: 'instagram_story_reply', label: 'Resposta ao Story', icon: Eye, channel: 'instagram', color: 'from-pink-400 to-orange-400', description: 'Quando alguém responde ou reage ao seu story' },
  { id: 'instagram_story_specific', label: 'Story Específico', icon: Eye, channel: 'instagram', color: 'from-orange-400 to-pink-500', description: 'Gatilho para um story específico (por URL ou ID)' },
  { id: 'instagram_new_follower', label: 'Novo Seguidor', icon: UserPlus, channel: 'instagram', color: 'from-purple-400 to-pink-400', description: 'Quando alguém começa a seguir você' },
  { id: 'whatsapp_received', label: 'Mensagem WhatsApp', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-500 to-emerald-500', description: 'Quando receber uma mensagem no WhatsApp' },
  { id: 'whatsapp_keyword', label: 'Palavra-chave WhatsApp', icon: Sparkles, channel: 'whatsapp', color: 'from-emerald-500 to-teal-500', description: 'Quando mensagem contém palavra-chave' },
  { id: 'whatsapp_automation', label: 'Automação WhatsApp', icon: Zap, channel: 'whatsapp', color: 'from-teal-500 to-green-500', description: 'Quando uma automação WhatsApp específica é acionada' },
  { id: 'whatsapp_message_source', label: 'Mensagem de Origem', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-400 to-teal-400', description: 'Quando mensagem vem de uma origem específica' },
  { id: 'contact_created', label: 'Contato Criado', icon: UserPlus, channel: 'crm', color: 'from-blue-500 to-indigo-500', description: 'Quando um novo contato é adicionado' },
  { id: 'contact_source', label: 'Fonte do Contato', icon: UserPlus, channel: 'crm', color: 'from-indigo-400 to-blue-400', description: 'Quando contato vem de uma fonte específica' },
  { id: 'form_submitted', label: 'Formulário Enviado', icon: CheckSquare, channel: 'crm', color: 'from-indigo-500 to-blue-500', description: 'Quando um formulário específico é preenchido' },
];

export const actionOptions = [
  { id: 'send_dm', label: 'Enviar DM', icon: Send, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { id: 'reply_comment', label: 'Responder Comentário', icon: Heart, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'send_email_marketing', label: 'Email Marketing', icon: Mail, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { id: 'send_email_performance', label: 'Email Performance', icon: MailCheck, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'send_email', label: 'Enviar E-mail', icon: Mail, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'timer', label: 'Timer', icon: Timer, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { id: 'warmup', label: 'Aquecimento', icon: Flame, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'tag_filter', label: 'Filtro de Tag', icon: Filter, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  { id: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { id: 'update_score', label: 'Atualizar Score', icon: Star, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { id: 'send_notification', label: 'Notificar Equipe', icon: Bell, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { id: 'create_task', label: 'Criar Tarefa', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { id: 'wait', label: 'Aguardar (Intervalo)', icon: Clock, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

export const conditionOptions = [
  { id: 'if_tag', label: 'Se tem Tag', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_keyword', label: 'Se contém palavra', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_score', label: 'Se score ≥', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

export const triggerTypeMap: Record<string, string> = {
  instagram_comment: 'instagram_comment',
  instagram_specific_post: 'instagram_comment',
  instagram_dm: 'instagram_dm',
  instagram_story_reply: 'instagram_comment',
  instagram_story_specific: 'instagram_comment',
  instagram_new_follower: 'contact_created',
  whatsapp_received: 'whatsapp_received',
  whatsapp_keyword: 'whatsapp_received',
  whatsapp_automation: 'whatsapp_received',
  whatsapp_message_source: 'whatsapp_received',
  contact_created: 'contact_created',
  contact_source: 'contact_created',
  form_submitted: 'form_submitted',
};

export const TEMPLATE_VARIABLES = [
  { key: '{{nome}}', label: 'Nome completo' },
  { key: '{{primeiro_nome}}', label: 'Primeiro nome' },
  { key: '{{email}}', label: 'E-mail' },
  { key: '{{telefone}}', label: 'Telefone' },
  { key: '{{whatsapp}}', label: 'WhatsApp' },
];

export const WEEKDAYS = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];
