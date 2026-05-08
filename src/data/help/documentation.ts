import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const documentation_articles: HelpArticle[] = [
  {
    id: 'technical-manual-article',
    categoryId: 'documentation',
    title: 'Manual Técnico do Sistema',
    icon: BookOpen,
    description: 'Visão geral da arquitetura, stack tecnológica e módulos funcionais do AG Sell.',
    content: `O **AG Sell** é uma plataforma SaaS de alta performance construída sobre uma arquitetura moderna e escalável.

## 1. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Supabase (Lovable Cloud) |
| **Banco de Dados** | PostgreSQL |
| **IA** | Lovable AI Gateway (Gemini 3 Flash / GPT-4) |
| **Pagamentos** | Kiwify |

## 2. Módulos Principais

- **CRM**: Gestão de contatos, empresas e pipeline Kanban.
- **SAC Omnichannel**: Inbox unificado para WhatsApp, Instagram e E-mail.
- **Automação**: Motor de fluxos visuais (Flow Builder) e sequências drip.
- **IA Generativa**: Assistente de chat e agentes autônomos com RAG.

## 3. Segurança e Performance

- Autenticação via Supabase Auth com JWT.
- Row Level Security (RLS) para isolamento total de dados entre organizações.
- Edge Functions (Deno) para processamento serverless de alta latência.

Para detalhes completos sobre tabelas, endpoints e arquitetura, consulte o (/manual-tecnico).`,
  },
  {
    id: 'api-docs-article',
    categoryId: 'documentation',
    title: 'Documentação da API REST',
    icon: Code2,
    description: 'Guia de integração via API para desenvolvedores externos e sistemas de terceiros.',
    content: `A API do AG Sell permite que você conecte o CRM a qualquer outro sistema de forma programática.

## Autenticação

Todas as requisições devem incluir o header \`X-API-Key\`, que pode ser gerado em (/api-keys).

## Endpoints Principais

- \`GET /v1/contacts\`: Lista seus contatos.
- \`POST /v1/messages\`: Envia mensagens via WhatsApp ou E-mail.
- \`POST /v1/automations/{id}/trigger\`: Dispara um fluxo de automação.

## Webhooks

Você pode assinar eventos como \`contact.created\` ou \`deal.won\` para receber notificações em tempo real na sua URL de callback.

Consulte a documentação completa e interativa em (/api-docs).`,
  },
];
