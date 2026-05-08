import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow
} from 'lucide-react';
import { AUTOMATION_GUIDE_CATEGORY } from '../automationGuide';
import { HelpCategory } from '@/types/help';

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    icon: Rocket,
    description: 'Comece a usar o AG Sell em poucos minutos. Configure sua conta, organização e primeiros contatos.',
  },
  {
    id: 'crm',
    title: 'CRM e Contatos',
    icon: Users,
    description: 'Gerencie contatos, empresas, pipeline de vendas, tags e tarefas para organizar seu negócio.',
  },
  {
    id: 'communication',
    title: 'Comunicação',
    icon: MessageSquare,
    description: 'Inbox unificado, WhatsApp, E-mail Marketing, Instagram, Telegram, SMS e Shopify em um só lugar.',
  },
  {
    id: 'marketing',
    title: 'Marketing e Automação',
    icon: Zap,
    description: 'Automações, Flow Builder, Sequências, Lead Scoring, Testes A/B, Formulários e Growth Tools.',
  },
  {
    id: 'intelligence',
    title: 'Inteligência e Analytics',
    icon: BarChart3,
    description: 'Dashboards, Assistente IA, Agentes IA, Gamificação, Site Tracking, Atribuição, Sentimento, Relatórios e Metas.',
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    description: 'Organização, planos, permissões, agência, API Keys, webhooks e integrações.',
  },
  {
    id: 'documentation',
    title: 'Documentação Técnica',
    icon: FileText,
    description: 'Manual técnico do sistema, documentação da API e guias de referência para desenvolvedores.',
  },
  AUTOMATION_GUIDE_CATEGORY,
];
