import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const getting_started_articles: HelpArticle[] = [
  {
    id: 'welcome',
    categoryId: 'getting-started',
    title: 'Visão geral do AG Sell',
    icon: Star,
    description: 'Conheça a plataforma e entenda como ela pode ajudar seu negócio.',
    readTime: '5 min',
    popular: true,
    content: `O **AG Sell** é uma plataforma completa de CRM, automação de vendas e atendimento multicanal que centraliza todas as suas operações comerciais em um único lugar. Projetada para pequenas, médias empresas e agências de marketing, ela elimina a necessidade de múltiplas ferramentas desconectadas.

## O que você pode fazer com o AG Sell?

- **Gerenciar contatos e empresas** de forma organizada com CRM completo
- **Acompanhar negócios** no pipeline de vendas com quadro Kanban drag-and-drop
- **Atender clientes** via WhatsApp, E-mail, Instagram, Telegram e SMS em um inbox unificado
- **Automatizar tarefas repetitivas** com fluxos inteligentes e sequências drip
- **Capturar leads** com formulários, Growth Tools, links e QR Codes
- **Analisar métricas** e resultados com dashboards completos e relatórios do SAC
- **Usar Inteligência Artificial** para respostas automáticas, análises e agentes autônomos
- **Gamificar a equipe** com pontos, níveis, conquistas e ranking
- **Integrar ferramentas** como Hotmart, Eduzz, Kiwify e Shopify

[screenshot:Dashboard principal do AG Sell|/dashboard]

## Para quem é o AG Sell?

- **Vendedores** que precisam organizar contatos e acompanhar negócios
- **Equipes de vendas** que precisam de pipeline, tarefas e colaboração
- **Equipes de marketing** que precisam de automações, e-mail marketing e flows
- **Equipes de suporte** que precisam de inbox unificado e métricas de atendimento
- **Agências** que gerenciam múltiplos clientes com contas isoladas
- **Infoprodutores** que integram plataformas de vendas digitais

## Principais módulos

### 📇 CRM
Contatos, Empresas, Pipeline Kanban, Tags e Tarefas.

### 💬 Comunicação
SAC/Inbox unificado, WhatsApp (com QR Code e múltiplas instâncias), E-mail Marketing, Inbox de E-mail, Instagram, Telegram, SMS e Canais.

### 🚀 Marketing
Automações com 20+ ações, Flow Builder visual (estilo ManyChat), Sequências Drip, Lead Scoring, Testes A/B, Formulários de captura e Growth Tools.

### 🧠 Inteligência
Dashboard Analytics, Assistente IA contextual, Agentes de IA autônomos (com base de conhecimento RAG) e Gamificação com ranking.

### ⚙️ Configurações
Organização e equipe, Planos e assinatura, Permissões granulares, Gestão de Agência (multi-tenant), API Keys, Webhooks de entrada, Integrações e Configurações gerais (tema, LGPD).

> O AG Sell foi projetado para ser tão simples que qualquer pessoa consegue usar. Explore os módulos no menu lateral e comece pela criação dos seus primeiros contatos.

💡 **Dica**: Use a barra de busca global (**Ctrl+K** ou **⌘+K** no Mac) para encontrar qualquer funcionalidade, contato, empresa ou página rapidamente.`,
  },
  {
    id: 'first-setup',
    categoryId: 'getting-started',
    title: 'Configuração inicial',
    icon: Settings,
    description: 'Passo a passo completo para configurar sua conta, organização, equipe e plano.',
    readTime: '8 min',
    popular: true,
    content: `Depois de criar sua conta, siga estes passos para configurar o AG Sell e começar a vender.

## Passo 1: Configurando sua organização

A organização é o "espaço de trabalho" onde todos os dados do seu negócio ficam armazenados. Cada organização é isolada — ou seja, dados de uma organização não se misturam com outra.

1. Acesse **"Organização"** no menu lateral (seção Configurações)
2. Defina o **nome** da sua empresa
3. Faça upload do **logo** (recomendado: 200x200px, PNG ou JPG)
4. Configure o **slug** (endereço único da organização, ex: "minha-empresa")
5. Clique em **Salvar**

[screenshot:Página de configuração da organização|/organization]

> O logo da organização aparece no cabeçalho da plataforma e nos formulários públicos. Escolha uma imagem de boa qualidade.

## Passo 2: Convidando membros da equipe

1. Na página de **Organização**, vá até a seção de membros
2. Clique em **"Convidar membro"**
3. Insira o **e-mail** do colaborador
4. Selecione o **papel**:
   - **Owner** — Acesso total e propriedade da organização (apenas 1 por organização)
   - **Admin** — Acesso total, exceto exclusão da organização
   - **Membro** — Acesso controlado por perfis de permissão
5. O convite será enviado automaticamente por e-mail
6. O membro acessa o link e cria sua conta (ou faz login se já tiver)

> Após aceitar o convite, o membro terá acesso imediato à organização. Você pode revogar o acesso a qualquer momento.

⚠️ **Importante**: Configure os **perfis de permissão** (menu Permissões) antes de convidar membros com papel "Membro" para garantir que cada pessoa veja apenas o que precisa.

## Passo 3: Escolhendo seu plano

O AG Sell oferece planos com diferentes níveis de recursos e limites.

1. Acesse **"Planos"** no menu lateral
2. Compare os recursos de cada plano (número de contatos, envios, automações, etc.)
3. Selecione o plano ideal para seu negócio
4. Clique em **"Assinar"**
5. Complete o pagamento via **Kiwify** (Pix, Boleto ou Cartão)
6. Os recursos são liberados **imediatamente**

💡 **Dica**: Comece com o plano que atende suas necessidades atuais. Você pode fazer upgrade a qualquer momento sem perder dados.

## Passo 4: Importando seus contatos

Se você já tem uma base de contatos, importe-os em massa:

1. Acesse **"Contatos"** no menu lateral
2. Clique em **"Importar"**
3. Selecione seu arquivo **CSV**
4. Mapeie os campos do arquivo para os campos do CRM
5. Confirme e acompanhe o progresso da importação

> O CSV deve ter pelo menos o campo "Nome" (ou "first_name"). Campos como e-mail, telefone e WhatsApp são opcionais mas muito recomendados.

## Passo 5: Conectando canais de comunicação

Para começar a atender, conecte pelo menos um canal:

### WhatsApp
1. Acesse **"WhatsApp"** no menu → Clique em **"Conectar WhatsApp"** → Escaneie o QR Code

### E-mail
1. Acesse **"Domínio E-mail"** → Adicione seu domínio → Configure DNS

### Instagram
1. Acesse **"Instagram"** → Conecte via Facebook/Instagram

## Checklist de configuração

- ✅ Organização criada com nome e logo
- ✅ Membros da equipe convidados
- ✅ Plano selecionado e assinatura ativa
- ✅ Contatos importados (se já tiver base)
- ✅ Pelo menos um canal de comunicação conectado
- ✅ Permissões configuradas para a equipe
- ✅ Primeira automação criada (ex: boas-vindas)

💡 **Dica**: O sistema possui um assistente de **Onboarding** que guia você pelos primeiros passos. Siga as etapas sugeridas para uma configuração completa.`,
  },
  {
    id: 'navigation',
    categoryId: 'getting-started',
    title: 'Navegando pelo sistema',
    icon: LayoutDashboard,
    description: 'Entenda a interface completa: sidebar, busca global, notificações, temas e atalhos.',
    readTime: '4 min',
    content: `A interface do AG Sell é organizada para facilitar a navegação e maximizar a produtividade.

## Menu lateral (Sidebar)

O menu lateral é a principal forma de navegação. Ele é dividido em seções:

### 📊 Visão Geral
- **Dashboard** — Métricas resumidas do seu negócio (deals, contatos, receita, tarefas)
- **Tarefas** — Gerenciamento de atividades com calendário e prioridades

### 📇 CRM
- **Contatos** — Base de leads e clientes
- **Empresas** — Cadastro de organizações (B2B)
- **Pipeline** — Kanban de funil de vendas
- **Tags** — Etiquetas para segmentação

### 💬 Comunicação
- **SAC** — Inbox unificado multicanal
- **WhatsApp** — Conexão e campanhas
- **E-mail** — Campanhas de e-mail marketing
- **Inbox E-mail** — Caixa de entrada de e-mails
- **Instagram** — Automações e DMs
- **Canais** — Telegram, SMS e Shopify

### 🚀 Marketing
- **Automações** — Fluxos automatizados
- **Flow Builder** — Construtor visual de funis
- **Sequências** — Drip campaigns
- **Lead Scoring** — Pontuação de leads
- **Testes A/B** — Comparação de variantes
- **Formulários** — Captura de leads
- **Growth Tools** — Links, QR Codes e widgets

### 🧠 Inteligência
- **Analytics** — Dashboards e relatórios
- **Assistente IA** — Chat inteligente contextual
- **Agentes IA** — Bots autônomos com RAG
- **Gamificação** — Pontos, níveis e ranking

### ⚙️ Configurações
- Organização, Planos, Permissões, Agência, API Keys, Webhooks, Integrações e Settings

[screenshot:Menu lateral do AG Sell|/dashboard]

> O sidebar pode ser **recolhido** clicando no botão de toggle para ganhar mais espaço na tela.

## Busca global (Ctrl+K)

Pressione **Ctrl+K** (ou **⌘+K** no Mac) para abrir a busca global. Funcionalidades:

- **Buscar contatos** pelo nome, e-mail ou telefone
- **Buscar empresas** pelo nome ou domínio
- **Navegar para páginas** digitando o nome (ex: "pipeline", "automações")
- **Encontrar funcionalidades** rapidamente sem navegar pelo menu

A busca é contextual e prioriza resultados mais relevantes.

## Notificações

O ícone de **sino** (🔔) no cabeçalho mostra suas notificações em tempo real:

- 💬 Novas mensagens no inbox
- ✅ Tarefas vencidas ou próximas do prazo
- 📊 Atualizações do sistema
- 🔔 Alertas de automações

Clique na notificação para ir diretamente ao item relacionado.

## Tema claro e escuro

O AG Sell suporta **tema claro** e **tema escuro**:

1. Clique no ícone de **lua/sol** no cabeçalho
2. Alterne entre os temas
3. A preferência é salva automaticamente no seu navegador

## Seletor de organização (Agências)

Se você usa o modo **Agência**, um seletor aparece no topo do sidebar permitindo alternar entre as organizações dos seus clientes instantaneamente.

## Responsividade

O AG Sell funciona em **desktop**, **tablet** e **celular**. Em telas menores:
- O sidebar se transforma em um menu hamburger
- Os painéis se empilham verticalmente
- Ações principais continuam acessíveis

💡 **Dica**: Memorize o atalho **Ctrl+K** — ele é a forma mais rápida de chegar a qualquer lugar do sistema.`,
  },
  {
    id: 'dashboard-overview',
    categoryId: 'getting-started',
    title: 'Dashboard: seu painel de controle',
    icon: LayoutDashboard,
    description: 'Entenda todas as métricas, gráficos e indicadores do dashboard principal.',
    readTime: '4 min',
    content: `O Dashboard é a primeira tela que você vê ao acessar o AG Sell. Ele apresenta um panorama completo do seu negócio.

## Métricas principais (cards)

Na parte superior, você encontra cards com métricas-chave:

- **Total de Contatos** — Quantos contatos estão cadastrados no CRM
- **Deals Ativos** — Negócios em andamento no pipeline
- **Receita do Período** — Valor total dos deals ganhos no período selecionado
- **Tarefas Pendentes** — Quantidade de tarefas em aberto

Cada card mostra a variação percentual em relação ao período anterior (seta verde para crescimento, vermelha para queda).

[screenshot:Dashboard principal do AG Sell|/dashboard]

## Gráficos e visualizações

### Evolução de receita
Gráfico de linha mostrando a receita mensal ao longo do tempo, permitindo identificar tendências de crescimento.

### Distribuição do pipeline
Gráfico de barras mostrando quantos deals estão em cada etapa do funil, ajudando a identificar gargalos.

### Atividades recentes
Lista das últimas atividades realizadas pela equipe: novos contatos, deals movidos, mensagens enviadas, tarefas concluídas.

## Filtros de período

Use os filtros no topo para ajustar o período visualizado:

- **Hoje** — Dados do dia atual
- **Esta semana** — Últimos 7 dias
- **Este mês** — Mês corrente
- **Este trimestre** — Últimos 3 meses
- **Este ano** — Ano corrente
- **Personalizado** — Defina datas específicas

## Dicas para usar o Dashboard

- 📊 Consulte o dashboard **diariamente** para acompanhar a evolução do negócio
- 🎯 Use as métricas para definir **metas semanais** para a equipe
- 🔍 Se um indicador cair, investigue indo ao módulo específico (ex: Pipeline para deals)
- 📈 Compare períodos para identificar **sazonalidades** e tendências

💡 **Dica**: O Dashboard é atualizado em tempo real. Qualquer ação feita por um membro da equipe reflete imediatamente nos números.`,
  },
];
