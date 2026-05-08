import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const intelligence_articles: HelpArticle[] = [
  {
    id: 'support-agent',
    categoryId: 'intelligence',
    title: 'Agente de Suporte AG Sell',
    icon: Bot,
    description: 'Tire dúvidas sobre a plataforma 24/7 com o chat flutuante de IA com base nos artigos da Central de Ajuda.',
    readTime: '3 min',
    popular: true,
    content: `O **Agente de Suporte AG Sell** é um assistente de IA disponível em todas as páginas do dashboard. Ele responde perguntas sobre como usar a plataforma com base na Central de Ajuda oficial.

## Onde encontrar

Procure pelo botão flutuante com ícone de **balão de mensagem** no canto inferior direito da tela. Ele está disponível em qualquer página enquanto você estiver logado.

## O que ele resolve

- "Como conectar o WhatsApp?"
- "Como criar uma automação de boas-vindas?"
- "Onde configuro meu plano e limites?"
- "Como exporto contatos para CSV?"
- Qualquer outra dúvida sobre funcionalidades da plataforma

## Como funciona

- Usa **Gemini 3 Flash** via Lovable AI Gateway
- Responde com base nos artigos atuais da **Central de Ajuda** (RAG)
- Conhece seu **plano**, **organização** e **nome de usuário** para personalizar respostas
- Quando sugere uma página, exibe um **link clicável** que leva direto para o módulo (ex: \`/whatsapp\`)
- O histórico fica salvo na sua sessão para consulta posterior

## Atalhos da janela do chat

- **Nova conversa** (ícone de rotação) — limpa o contexto e começa do zero
- **Expandir/Minimizar** — alterna entre tamanho compacto e amplo
- **Fechar (X)** — esconde a janela; o botão flutuante volta

## Quick actions

Na primeira mensagem, o chat sugere perguntas frequentes que você pode clicar para enviar diretamente:

- Como conectar o WhatsApp?
- Como criar uma automação?
- Tenho um bug para reportar
- Como configurar meu plano?

## Quando abrir um ticket humano

O agente resolve a maioria das dúvidas operacionais. Para casos que envolvem:

- **Bugs** que impedem o uso
- **Solicitações de reembolso** ou cobrança
- **Pedidos de feature** customizada
- **Investigação de dados** específicos da sua conta

Use o link **"abra um ticket"** no rodapé do chat ou acesse diretamente \`/support-center\`.

⚠️ **Limites**: Em casos de alto volume, o agente pode retornar erro \`429\` (limite de requisições) ou \`402\` (créditos de IA insuficientes). Aguarde alguns instantes ou contate o admin da organização.

💡 **Dica**: Quanto mais específica for a pergunta, melhor a resposta. Em vez de "WhatsApp não funciona", prefira "Meu QR Code expira antes de eu escanear, o que faço?".`,
  },
  {
    id: 'ai-agents-builder',
    categoryId: 'intelligence',
    title: 'Agentes de IA (Chatbot Builder)',
    icon: Brain,
    description: 'Crie bots autônomos para WhatsApp, Instagram e outros canais com base de conhecimento e templates prontos.',
    readTime: '8 min',
    popular: true,
    content: `Os **Agentes de IA** permitem criar bots que conversam com seus leads e clientes 24/7 nos canais conectados, com personalidade, base de conhecimento e regras configuráveis.

Acesse em **Agentes IA** (\`/ai-agents\`) ou no **Chatbot Builder** (\`/chatbot-builder\`).

## Quando usar um Agente de IA

- **Atendimento de primeiro nível** — qualificar leads antes de passar para um humano
- **FAQ automático** — responder dúvidas frequentes sobre produtos e serviços
- **Agendamento e captação** — coletar dados, marcar reuniões, enviar links
- **Suporte fora do horário** — manter o atendimento ativo 24/7

## Configuração do agente

### Identidade
- **Nome** — como o agente será apresentado
- **Avatar** — imagem (opcional)
- **Descrição** — finalidade do agente
- **Mensagem de boas-vindas** — primeira fala do agente
- **Mensagem de fallback** — usada quando o agente não souber responder

### Modelo de IA
- **Modelo** — Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-5 Mini, etc.
- **Temperatura** — criatividade (0 = determinístico, 1 = criativo)
- **Max tokens** — tamanho máximo da resposta
- **System prompt** — instruções de personalidade e comportamento

### Canais
Selecione em quais canais o agente atende:
- WhatsApp
- Instagram DM
- E-mail
- Site (widget)

## Base de conhecimento (RAG)

Adicione documentos para que o agente responda com informações da sua empresa:

- **Texto livre** — cole políticas, FAQs, descrições de produto
- **URL** — o sistema extrai o conteúdo de uma página pública
- **Arquivo** — PDF, DOCX (com extração automática de texto)

> Cada bloco de conhecimento é armazenado em \`ai_agent_knowledge\` e usado como contexto nas respostas do agente.

## Templates prontos

Acesse a aba **Templates** para usar agentes pré-configurados por vertical:

- **Imobiliária** — qualifica interesse, agenda visita
- **Infoproduto** — tira dúvidas sobre o curso, oferece desconto
- **Clínica** — agenda consulta, envia preparo do exame
- **E-commerce** — rastreia pedidos, recomenda produtos

Cada template já vem com system prompt, mensagem de boas-vindas e canais sugeridos.

## Dashboard de performance

Em **Performance**, acompanhe:

- **Conversas iniciadas** vs concluídas
- **Taxa de transferência humana** — quantas vezes o agente passou para um atendente
- **Satisfação média** (CSAT) das conversas
- **Tempo médio de resposta**

Use estas métricas para ajustar o **system prompt** e a **base de conhecimento**.

## Diferença entre Agente de IA e Agente de Suporte

| Recurso | Agente de IA | Agente de Suporte AG Sell |
|---------|--------------|---------------------------|
| Para quem | Seus leads/clientes | Você (usuário da plataforma) |
| Onde | WhatsApp, Instagram, etc. | Botão flutuante no dashboard |
| Customização | Total (modelo, prompt, canais) | Configurado pela AG Sell |
| Base | Sua base de conhecimento | Central de Ajuda da AG Sell |

⚠️ **Importante**: O agente respeita os limites de créditos de IA do seu plano. Acompanhe o consumo no Dashboard.

💡 **Dica**: Comece com **temperatura 0.3** e ajuste para cima se as respostas ficarem muito repetitivas. Para suporte, prefira respostas curtas e diretas; para vendas, permita mais criatividade.`,
  },
  {
    id: 'analytics',
    categoryId: 'intelligence',
    title: 'Analytics e relatórios',
    icon: BarChart3,
    description: 'Guia completo: dashboards de vendas, pipeline, equipe, filtros e como usar os dados.',
    readTime: '6 min',
    content: `O módulo de Analytics oferece dashboards completos para análise do seu negócio, com métricas de vendas, pipeline e performance da equipe.

[presentation:analytics]

## Visão geral do Analytics

[screenshot:Dashboard de Analytics|/analytics]

O Analytics é dividido em seções de métricas:

## Métricas de vendas

### Receita
- **Receita total** — Soma dos valores de deals ganhos
- **Receita por período** — Mensal, trimestral, anual
- **Evolução** — Gráfico de linha mostrando tendência
- **Comparação** — Período atual vs anterior (% de crescimento)

### Conversão
- **Taxa de conversão geral** — Deals ganhos ÷ Deals criados
- **Taxa por etapa** — Conversão entre cada fase do pipeline
- **Funil de conversão** — Visualização da perda em cada etapa

### Ticket médio
- **Valor médio por deal** — Receita total ÷ Número de deals ganhos
- **Evolução do ticket** — Tendência ao longo do tempo

## Métricas de pipeline

### Distribuição por etapa
- **Gráfico de barras** — Quantidade de deals em cada coluna
- **Valor por etapa** — Soma dos valores em cada fase
- **Tempo médio** — Quanto tempo deals permanecem em cada etapa

### Gargalos
- **Etapas com mais deals parados** — Identifique onde as negociações travam
- **Deals antigos** — Negociações paradas há muito tempo
- **Taxa de perda por etapa** — Onde deals são mais frequentemente perdidos

## Métricas de equipe

### Performance individual
- **Deals por membro** — Quantidade de negócios atribuídos e ganhos
- **Receita por membro** — Valor gerado por cada vendedor
- **Ranking** — Classificação dos top performers
- **Atividades** — Quantidade de ações realizadas (mensagens, tarefas, etc.)

### Tempo de resposta
- **Média da equipe** — Tempo médio de resposta às mensagens
- **Por membro** — Comparação individual
- **Evolução** — Tendência ao longo do tempo

## Filtros disponíveis

Filtre todas as métricas por:

- **Período** — Hoje, esta semana, este mês, trimestre, ano, personalizado
- **Membro da equipe** — Performance individual
- **Etapa do pipeline** — Foco em uma fase específica
- **Tags** — Segmentos específicos de contatos
- **Canal** — Métricas por canal de comunicação

## Como usar os dados

### Reuniões semanais
1. Abra o Analytics com filtro "Esta semana"
2. Revise receita e deals ganhos
3. Identifique deals parados no pipeline
4. Compare performance da equipe
5. Defina ações para a próxima semana

### Diagnóstico de problemas
- **Receita caindo?** → Analise a taxa de conversão por etapa
- **Muitos leads frios?** → Revise as fontes e Lead Scoring
- **Pipeline parado?** → Identifique a etapa gargalo
- **Equipe desigual?** → Redistribua leads e ofereça treinamento

### Previsão de receita
- Use o valor total do pipeline × probabilidade média para prever receita
- Analise a taxa de conversão histórica para projeções mais precisas

## Boas práticas

- 📊 **Consulte semanalmente** — Dados só geram valor se usados
- 🎯 **Defina metas baseadas em dados** — Use histórico para metas realistas
- 🔍 **Investigue anomalias** — Picos ou quedas merecem atenção
- 📈 **Compare períodos** — Identifique sazonalidades e tendências
- 👥 **Compartilhe com a equipe** — Transparência motiva performance

💡 **Dica**: Acompanhe o Analytics semanalmente para identificar tendências e ajustar sua estratégia antes que problemas se agravem.`,
  },
  {
    id: 'ai-assistant',
    categoryId: 'intelligence',
    title: 'Assistente IA',
    icon: Bot,
    description: 'Guia completo: chat com IA contextual, tipos de perguntas, análises e sugestões.',
    readTime: '4 min',
    content: `O Assistente IA é um chat inteligente integrado ao seu CRM que pode responder perguntas, gerar textos e fornecer insights baseados nos dados do seu negócio.

[presentation:ai-assistant]

## O que ele pode fazer

### 📊 Análise de dados
- Resumir métricas do período (receita, deals, contatos)
- Identificar tendências de vendas
- Comparar performance entre períodos
- Apontar gargalos no pipeline

### 💡 Sugestões estratégicas
- Sugerir próximos passos para deals específicos
- Recomendar ações para leads frios
- Propor estratégias de follow-up
- Indicar melhores horários para contato

### ✍️ Geração de conteúdo
- Redigir e-mails de follow-up personalizados
- Criar textos para campanhas de WhatsApp
- Gerar respostas para mensagens de clientes
- Criar descrições para formulários e landing pages

### 📋 Resumos e relatórios
- Resumir atividades da semana/mês
- Listar tarefas pendentes importantes
- Destacar deals que precisam de atenção
- Resumir interações com um contato específico

[screenshot:Chat com o Assistente IA|/ai-assistant]

## Como usar

1. Acesse **"Assistente IA"** no menu lateral
2. Digite sua pergunta ou pedido no campo de chat
3. A IA processa sua solicitação e responde
4. Continue a conversa para aprofundar ou refinar

## Exemplos de perguntas úteis

### Vendas
- "Quais deals estão parados há mais de 7 dias?"
- "Qual foi minha taxa de conversão este mês?"
- "Quanto de receita geramos na última semana?"
- "Quais são os top 5 deals por valor?"

### Conteúdo
- "Sugira um e-mail de follow-up para o lead que pediu proposta"
- "Escreva uma mensagem de boas-vindas para novos contatos do Instagram"
- "Crie um texto de recuperação para leads inativos há 30 dias"
- "Redija uma resposta educada para a reclamação do cliente"

### Estratégia
- "Qual canal gera mais conversões?"
- "Resuma as atividades da equipe esta semana"
- "Que automações poderiam ajudar a aumentar conversões?"
- "Sugira melhorias para o processo de vendas"

## Contexto do CRM

> O Assistente tem acesso ao contexto do seu CRM para fornecer respostas relevantes e personalizadas. Ele conhece seus contatos, deals, automações e métricas.

## Modelos de IA disponíveis

O Assistente utiliza modelos de IA de última geração, incluindo:
- Modelos Google Gemini para análise multimodal
- Modelos OpenAI GPT para geração de texto

## Boas práticas

- 🎯 **Seja específico** — "Quais deals de valor acima de R$5.000 estão na etapa Proposta?" > "Como estão as vendas?"
- 📝 **Peça em partes** — Para solicitações complexas, divida em perguntas menores
- ✅ **Revise as respostas** — A IA pode errar, especialmente com dados numéricos
- 🔄 **Itere** — Refine pedidos na mesma conversa para resultados melhores

💡 **Dica**: Use o Assistente IA como "segundo cérebro" para análises rápidas e geração de conteúdo. Ele economiza tempo em tarefas que levariam minutos ou horas manualmente.`,
  },
  {
    id: 'ai-agents',
    categoryId: 'intelligence',
    title: 'Agentes de IA',
    icon: Brain,
    description: 'Guia completo: criar agentes autônomos, base de conhecimento (RAG), canais e métricas.',
    readTime: '7 min',
    content: `Agentes de IA são assistentes virtuais autônomos que podem atender seus clientes automaticamente em múltiplos canais, usando Inteligência Artificial com base de conhecimento personalizada.

[video:🎬 Tutorial: Configurando Agentes de IA|/videos/tutorial-agentes-ia.mp4]

## Diferença entre Assistente IA e Agentes IA

| Aspecto | Assistente IA | Agentes IA |
|---------|--------------|------------|
| Público | Equipe interna | Clientes/leads |
| Acesso | Via menu do AG Sell | Via WhatsApp, E-mail, Chat |
| Conhecimento | Dados do CRM | Base de conhecimento personalizada |
| Interação | Você pergunta | O cliente pergunta |

## Criando um agente

1. Acesse **"Agentes IA"** no menu lateral
2. Clique em **"Novo Agente"**
3. Configure:
   - **Nome** — Nome do agente (ex: "Ana - Atendente Virtual")
   - **Descrição** — Breve descrição do propósito
   - **Avatar** — Imagem de perfil do agente (opcional)

[screenshot:Página de Agentes de IA|/ai-agents]

### Configuração da IA

4. **Modelo de IA** — Selecione o modelo:
   - Modelos mais rápidos para respostas simples
   - Modelos mais potentes para raciocínio complexo
5. **Prompt de sistema** — Define a personalidade e regras do agente:
   - Quem ele é e como deve se comportar
   - Tom de voz (formal, informal, amigável)
   - O que pode e não pode responder
   - Instruções para situações específicas
6. **Temperatura** — Controle de criatividade (0 = previsível, 1 = criativo)
7. **Mensagem de boas-vindas** — Primeira mensagem quando alguém inicia conversa
8. **Mensagem de fallback** — Quando o agente não sabe responder

### Exemplo de prompt de sistema

> Você é Ana, assistente virtual da Empresa X. Seu papel é: responder dúvidas sobre produtos e serviços, ajudar com informações de preços e planos, agendar reuniões com a equipe de vendas e resolver dúvidas frequentes. Regras: seja sempre educada e profissional, se não souber a resposta transfira para um humano, nunca invente informações sobre produtos, responda em português do Brasil.

## Base de conhecimento (RAG)

Alimente o agente com informações do seu negócio:

1. Na aba **"Conhecimento"** do agente
2. Clique em **"Adicionar Documento"**
3. Configure:
   - **Título** — Nome do documento
   - **Tipo** — FAQ, Documento, Política, Tutorial
   - **Conteúdo** — Cole o texto com as informações
4. O agente usará esse conteúdo como referência para responder

### O que incluir na base de conhecimento
- **FAQ** — Perguntas frequentes e respostas
- **Produtos/Serviços** — Descrições, preços, características
- **Políticas** — Trocas, devoluções, garantia
- **Tutoriais** — Como usar produtos ou serviços
- **Informações da empresa** — Horário, localização, contato

> O RAG (Retrieval Augmented Generation) permite que o agente busque informações relevantes na base de conhecimento antes de responder, garantindo respostas precisas e baseadas em fatos.

## Canais de atuação

Defina onde o agente deve atuar:

- **WhatsApp** — Responde mensagens recebidas automaticamente
- **E-mail** — Responde e-mails com base no conhecimento
- **Chat do site** — Via widget integrado

Selecione um ou mais canais na configuração do agente.

## Transferência para humano

Configure quando o agente deve transferir para um atendente humano:

- Quando não souber responder (fallback)
- Quando o cliente solicitar explicitamente
- Quando detectar frustração ou urgência
- Para assuntos que exigem decisão humana (ex: negociação)

A transferência aparece no **Inbox** para a equipe continuar o atendimento.

## Métricas do agente

Acompanhe a performance do agente:

- **Total de conversas** — Quantas interações o agente teve
- **Taxa de satisfação** — Baseada em feedback dos contatos
- **Transferências para humanos** — Quantas vezes precisou escalar
- **Tempo médio de resposta** — Velocidade de resposta do agente
- **Taxa de resolução** — Percentual de questões resolvidas sem humano

## Boas práticas

- 📚 **Alimente a base de conhecimento** — Quanto mais conteúdo relevante, melhores as respostas
- 🧪 **Teste exaustivamente** — Simule conversas antes de ativar em produção
- 📝 **Refine o prompt** — Ajuste o tom e as regras baseado em conversas reais
- 🔄 **Atualize periodicamente** — Mantenha a base de conhecimento atual
- 📊 **Monitore métricas** — Altas taxas de transferência indicam lacunas no conhecimento
- 🎯 **Comece simples** — Um agente de FAQ é mais fácil de configurar e já gera valor

💡 **Dica**: Comece com um agente de FAQ que responde dúvidas comuns. Isso libera sua equipe para atendimentos mais complexos e reduz o tempo de resposta.`,
  },
  {
    id: 'gamification',
    categoryId: 'intelligence',
    title: 'Gamificação',
    icon: Trophy,
    description: 'Guia completo: sistema de pontos, níveis, ranking, conquistas e como motivar a equipe.',
    readTime: '4 min',
    content: `A Gamificação transforma atividades de vendas em um jogo motivacional, incentivando a equipe a bater metas e manter o CRM atualizado.

[presentation:gamification]

## Como funciona

Cada ação no sistema gera **pontos de experiência (XP)**:

### Pontuação por ação
- 📇 Criar contato: **+10 XP**
- 🏢 Criar empresa: **+15 XP**
- 💰 Criar deal: **+20 XP**
- 🏆 Fechar deal (ganho): **+50 XP**
- ✅ Completar tarefa: **+20 XP**
- ✉️ Enviar campanha de e-mail: **+30 XP**
- 💬 Enviar mensagem no inbox: **+5 XP**
- 🤖 Criar automação: **+25 XP**
- 📝 Criar formulário: **+15 XP**

> Os XP são acumulados individualmente por membro da equipe.

## Níveis

Conforme acumula XP, você progride por níveis:

- 🥉 **Bronze** — 0 a 499 XP
- 🥈 **Prata** — 500 a 1.499 XP
- 🥇 **Ouro** — 1.500 a 3.999 XP
- 💎 **Diamante** — 4.000+ XP

Cada nível traz um **badge visual** exibido no perfil do membro.

## Ranking

Compare o desempenho com os colegas:

- 🏅 **Ranking semanal** — Reset toda semana para nova competição
- 📊 **Ranking mensal** — Visão de longo prazo
- 🏆 **Top performers** — Destaque visual para os primeiros colocados
- 📈 **Evolução** — Gráfico de XP ao longo do tempo

[screenshot:Módulo de Gamificação|/gamification]

## Conquistas (Achievements)

Desbloqueie conquistas especiais por marcos alcançados:

- 🎯 **"Primeiro Deal"** — Feche seu primeiro negócio
- 🚀 **"Máquina de Vendas"** — Feche 10 deals em um mês
- 💬 **"Comunicador"** — Envie 100 mensagens no inbox
- 📧 **"Email Master"** — Crie 5 campanhas de e-mail
- 🤖 **"Automator"** — Crie 3 automações
- 📇 **"Networking"** — Cadastre 50 contatos
- ⚡ **"Velocista"** — Responda 10 mensagens em menos de 2 minutos

## Widget de gamificação

O widget de gamificação aparece no dashboard mostrando:
- Seu **nível atual** e progresso para o próximo
- **XP total** acumulado
- **Posição no ranking**
- **Última conquista** desbloqueada
- **Barra de progresso** até o próximo nível

## Benefícios para a gestão

- 📊 **Visibilidade** — Veja quem está mais ativo no CRM
- 🎯 **Motivação** — Competição saudável entre a equipe
- 📈 **Adoção** — Incentiva o uso completo da plataforma
- 🏆 **Reconhecimento** — Destaque para top performers

## Boas práticas

- 🏅 **Celebre conquistas** — Reconheça publicamente os top performers
- 🔄 **Mantenha a competição** — Rankings semanais mantêm o engajamento
- 🎯 **Combine com metas** — XP complementa, não substitui metas de vendas
- 📊 **Use como indicador** — Baixo XP pode indicar baixo uso da ferramenta

💡 **Dica**: A gamificação é mais eficaz quando toda a equipe participa. Encoraje todos a usar o CRM diariamente e acompanhem o ranking juntos.`,
  },
  {
    id: 'site-tracking',
    categoryId: 'intelligence',
    title: 'Rastreamento de Site',
    icon: Globe,
    description: 'Monitore visitantes do seu site com snippet JS e visualize sessões.',
    readTime: '7 min',
    content: `O **Site Tracking** monitora visitantes do seu site em tempo real com um snippet JavaScript.

[presentation:site-tracking]

## Instalação
1. Acesse **Site Tracking** → copie o snippet JS
2. Cole no \`<head>\` do seu site
3. O rastreamento inicia automaticamente

## O que é rastreado
- Visualizações de página (URL, título, referrer)
- Sessões (início, duração, páginas/sessão)
- Dispositivos (Desktop, Mobile, Tablet)
- Origem (Direto, Orgânico, Social, Pago)

## Dashboard
- Visitantes únicos, sessões, páginas/sessão, tempo médio
- Distribuição por dispositivo (gráfico pizza)
- Páginas mais visitadas (ranking)

## Integração com CRM
Quando o visitante é identificado via formulário, as sessões são vinculadas ao perfil do contato para uso em Lead Scoring e automações.

💡 **Dica**: Combine com Lead Scoring para pontuar leads que visitam páginas de preço.`,
  },
  {
    id: 'attribution',
    categoryId: 'intelligence',
    title: 'Atribuição de Receita',
    icon: Target,
    description: 'Rastreie a jornada do cliente e atribua receita a canais e campanhas.',
    readTime: '6 min',
    content: `O módulo de **Atribuição** rastreia a jornada completa e atribui receita aos canais que contribuíram para a conversão.

[presentation:attribution]

## Modelos
| Modelo | Descrição |
|--------|-----------|
| **Primeiro toque** | 100% ao primeiro canal |
| **Último toque** | 100% ao último canal |
| **Linear** | Distribui igualmente entre todos |

## Dashboard
- Receita por canal (barras), touchpoints recentes, canal top, ROI por canal

## Como funciona
1. Cada interação cria um touchpoint
2. Quando deal é ganho, receita é distribuída conforme modelo
3. Dashboard consolida a visão

💡 **Dica**: Use linear para visão equilibrada. Primeiro toque mostra o que atrai, último mostra o que converte.`,
  },
  {
    id: 'ai-builder',
    categoryId: 'intelligence',
    title: 'AI Builder',
    icon: Brain,
    description: 'Gere e-mails, automações e copy com IA. Inclui Brand Kit e segmentação inteligente.',
    readTime: '8 min',
    content: `O **AI Builder** gera conteúdo e estratégia com inteligência artificial.

## Geração de Conteúdo
- **E-mails HTML** — Descreva o objetivo, IA cria o e-mail
- **Fluxos de automação** — Descreva a estratégia, receba o fluxo
- **Copy para WhatsApp** — Mensagens persuasivas

## AI Brand Kit
1. Cole a URL do site da marca
2. IA extrai: cores, fontes e tom de comunicação
3. Use para consistência visual em e-mails e landing pages

## Segmentos Sugeridos por IA
1. Clique em "Gerar Sugestões"
2. IA analisa padrões de engajamento e comportamento
3. Receba sugestões como "Leads quentes sem follow-up"
4. Aplique como filtro no CRM

💡 **Dica**: Gere séries de e-mails de onboarding — "série de 5 e-mails de boas-vindas para SaaS" e receba tudo pronto.`,
  },
  {
    id: 'predictive-sending',
    categoryId: 'intelligence',
    title: 'Envio Preditivo',
    icon: Search,
    description: 'IA determina o melhor horário para enviar mensagens a cada contato.',
    readTime: '5 min',
    content: `O **Envio Preditivo** usa IA para determinar o melhor horário de envio para cada contato.

## Como funciona
1. IA analisa histórico de interações
2. Identifica padrões de horários com maior engajamento
3. Cria perfil de envio (timezone, canal preferido, horário ideal)
4. Aplica automaticamente em campanhas e automações

## Dashboard
- Perfis analisados, melhoria estimada, horário mais popular
- Distribuição por horário e canal preferido

💡 **Dica**: Deixe coletar 2+ semanas de dados antes de confiar nas predições.`,
  },
  {
    id: 'sentiment-analysis',
    categoryId: 'intelligence',
    title: 'Análise de Sentimento',
    icon: Brain,
    description: 'IA classifica o sentimento das conversas e identifica padrões.',
    readTime: '5 min',
    content: `A **Análise de Sentimento** classifica automaticamente o tom das mensagens recebidas.

## Classificações
- **Positivo** — Tom satisfeito, elogioso
- **Neutro** — Informativo, sem carga emocional
- **Negativo** — Insatisfeito, reclamação, urgência

## Dashboard
- Distribuição de sentimentos (gráfico)
- Palavras-chave mais frequentes
- Tendências temporais

## Uso prático
- Priorize atendimentos negativos
- Identifique tendências de insatisfação
- Automatize escalação de mensagens negativas

💡 **Dica**: Combine com CSAT para visão completa. Sentimento = tempo real, CSAT = pós-atendimento.`,
  },
  {
    id: 'sales-routing',
    categoryId: 'intelligence',
    title: 'Roteamento de Vendas',
    icon: SlidersHorizontal,
    description: 'Distribua leads automaticamente entre vendedores com regras inteligentes.',
    readTime: '5 min',
    content: `O **Sales Routing** distribui leads automaticamente entre vendedores.

## Estratégias
| Estratégia | Descrição |
|-----------|-----------|
| **Round Robin** | Alternando entre vendedores |
| **Por Carga** | Vendedor com menos leads ativos |
| **Por Território** | Baseado na região do contato |
| **Por Especialidade** | Conforme tags ou produto |

## Configuração
1. Acesse Sales Routing → "Nova Regra"
2. Defina nome, estratégia e membros elegíveis
3. Configure limites (máx. concurrent)
4. Ative

💡 **Dica**: Round Robin para equipes homogêneas, por carga para equipes com níveis diferentes.`,
  },
  {
    id: 'goals',
    categoryId: 'intelligence',
    title: 'Metas e Conversões',
    icon: Target,
    description: 'Defina metas de vendas e acompanhe progresso em tempo real.',
    readTime: '5 min',
    content: `O módulo de **Metas** permite definir objetivos e acompanhar progresso.

[presentation:goals]

## Tipos
| Tipo | Exemplo |
|------|---------|
| **Receita** | R$ 100.000 em vendas no mês |
| **Contagem** | 500 novos leads no trimestre |
| **Evento** | 1.000 page views na landing page |

## Criar meta
1. Acesse Metas → "Nova Meta"
2. Defina nome, tipo, valor alvo e deadline
3. Acompanhe progresso no dashboard

## Status automáticos
- **Ativa** — Em andamento
- **Atingida** — Valor atual ≥ alvo
- **Expirada** — Deadline passou sem atingir

💡 **Dica**: Metas mensais de receita + semanais de leads. Acompanhe diariamente.`,
  },
  {
    id: 'win-probability',
    categoryId: 'intelligence',
    title: 'Probabilidade de Fechamento',
    icon: Target,
    description: 'IA calcula a probabilidade de fechar cada negócio do pipeline.',
    readTime: '5 min',
    content: `A **Win Probability** usa IA para calcular chances de converter cada negócio.

## Como funciona
1. IA analisa: valor, tempo na etapa, atividades, contato
2. Compara com padrões históricos
3. Calcula probabilidade (0-100%)
4. Lista fatores positivos e negativos

## Dashboard
- Total de deals analisados
- Probabilidade média do pipeline
- Deals de alta probabilidade (>70%)

## Uso prático
- Foque nos top deals (>70%)
- Recupere deals em risco (queda de probabilidade)
- Forecast: valor × probabilidade

💡 **Dica**: Recalcule semanalmente. Deals estagnados perdem probabilidade — aja rápido.`,
  },
  {
    id: 'custom-reports',
    categoryId: 'intelligence',
    title: 'Relatórios Personalizados',
    icon: BarChart3,
    description: 'Dashboards customizados combinando métricas de CRM, e-mail e WhatsApp.',
    readTime: '5 min',
    content: `Os **Relatórios Personalizados** permitem criar dashboards sob medida.

## Criar relatório
1. Acesse Relatórios Personalizados → "Novo Relatório"
2. Adicione widgets (Barras, Linhas, Pizza)
3. Escolha fontes: CRM, E-mail, WhatsApp, Inbox
4. Configure período e filtros

## Fontes de dados
- **CRM** — Contatos, deals, receita, pipeline
- **E-mail** — Campanhas, aberturas, cliques
- **WhatsApp** — Mensagens, respostas, campanhas
- **Inbox** — Conversas, tempo de resposta, CSAT

💡 **Dica**: Relatório semanal com: novos leads, deals ganhos, receita e CSAT para reuniões de equipe.`,
  },
  {
    id: 'revenue-reporting',
    categoryId: 'intelligence',
    title: 'Relatório de Receita',
    icon: BarChart3,
    description: 'Receita por canal, campanha e período com dashboards detalhados.',
    readTime: '5 min',
    content: `O **Relatório de Receita** consolida toda receita segmentada por canal, campanha e período.

## Dashboard
- Receita total no período
- Receita por canal (E-mail, WhatsApp, SMS, Site)
- Crescimento vs período anterior
- Top campanhas por receita

## Filtros
- Período (7, 30, 90 dias ou customizado)
- Canal e campanha

## Integração
Alimentado pelos dados de **Atribuição** para visão clara de contribuição por canal.

💡 **Dica**: Compare receita por canal mensalmente para redistribuir investimentos.`,
  },
  {
    id: 'predictive-scoring',
    categoryId: 'intelligence',
    title: 'Scoring Preditivo com IA',
    icon: Brain,
    description: 'Lead scoring automático baseado em comportamento, usando Inteligência Artificial.',
    readTime: '6 min',
    popular: true,
    content: `O **Scoring Preditivo** usa Inteligência Artificial para calcular automaticamente a probabilidade de conversão de cada lead, baseado em comportamento real — não em regras estáticas.

## Diferença: Lead Scoring vs Scoring Preditivo

| Aspecto | Lead Scoring (regras) | Scoring Preditivo (IA) |
|---------|----------------------|----------------------|
| Base | Regras manuais (ex: +10 por abrir e-mail) | Análise comportamental por IA |
| Precisão | Limitada às regras criadas | Aprende padrões complexos |
| Manutenção | Requer ajuste manual das regras | Automático e adaptativo |
| Fatores | Poucos e predefinidos | Dezenas de fatores analisados |

## Fatores analisados pela IA

A IA analisa automaticamente:

- 📧 **Engajamento com e-mails** — Aberturas, cliques, respostas
- 💬 **Interações no WhatsApp** — Mensagens, respostas, tempo de resposta
- 🏷️ **Tags aplicadas** — Segmentação e comportamento
- 💼 **Deals** — Valor, estágio, tempo no pipeline
- 📊 **Atividades** — Volume e frequência de interações
- 🌐 **Visitas ao site** — Páginas visitadas (se Site Tracking ativo)

## Como usar

1. Acesse **Lead Scoring** no menu lateral
2. Vá na aba **"Scoring Preditivo (IA)"**
3. Clique em **"Calcular para Todos"** para processar toda a base
4. Ou clique no botão de calcular em um contato específico

## Interpretando os resultados

Cada contato recebe:

- **Score preditivo (0-100)** — Probabilidade de conversão
- **Confiança** — Grau de certeza da predição
- **Fatores de impacto** — Os motivos que elevam ou reduzem o score
- **Versão do modelo** — Para rastreabilidade

### Escala de scores

| Score | Classificação | Ação recomendada |
|-------|--------------|-----------------|
| 80-100 | 🔥 Quente | Priorizar contato imediato |
| 60-79 | 🟡 Morno | Nutrir com conteúdo relevante |
| 40-59 | 🟠 Frio | Manter em sequência de nutrição |
| 0-39 | ❄️ Gelado | Requalificar ou remover |

## Automações com Scoring Preditivo

Combine o score preditivo com automações:

- Score > 80 → Notifica vendedor + cria tarefa
- Score entre 50-80 → Insere em sequência de nutrição
- Score < 30 → Remove de campanhas ativas

💡 **Dica**: Execute o cálculo semanalmente para manter os scores atualizados conforme o comportamento dos leads evolui.`,
  },
  {
    id: 'event-tracking',
    categoryId: 'intelligence',
    title: 'Event Tracking (Pixel)',
    icon: Target,
    description: 'Snippet JavaScript para rastreamento de page views, eventos e navegação SPA.',
    readTime: '5 min',
    content: `O **Event Tracking** é um snippet JavaScript que rastreia visitantes, page views e eventos no seu site.

## Instalação

1. Acesse **Event Tracking** → copie o snippet JS
2. Cole no \`<head>\` do seu site
3. O rastreamento inicia automaticamente (page views, navegação SPA, visitor ID persistente)

## Integração com CRM

Quando identificado via formulário, sessões são vinculadas ao contato, alimentam Lead Scoring e podem disparar automações.

💡 **Dica**: Instale em páginas estratégicas (pricing, checkout) e combine com automações.`,
  },
  {
    id: 'funnel-bi',
    categoryId: 'intelligence',
    title: 'BI do Funil',
    icon: BarChart3,
    description: 'Dashboard visual com taxas de conversão, drop-off e performance por canal.',
    readTime: '5 min',
    content: `O **BI do Funil** é um dashboard analítico que mostra a performance real do seu funil de vendas com taxas de conversão e drop-off por etapa.

## Métricas Principais

- **Conversão Total** — Percentual de visitantes que se tornaram clientes
- **Drop-off por Etapa** — Onde você perde mais leads no funil
- **Performance por Canal** — Comparativo de WhatsApp, E-mail, Instagram e SMS

## Visualizações

### Funil Visual
Gráfico de barras decrescente mostrando o volume em cada etapa:
- Visitantes → Leads → Qualificados → Oportunidades → Clientes

### Drop-off
Para cada transição entre etapas, veja:
- **Taxa de conversão** — % que avançou
- **Drop-off** — % que saiu do funil

### Performance por Canal
Tabela comparativa com leads gerados, conversões e taxa de conversão por canal.

## Filtros

Filtre por período: últimos 7 dias, 30 dias ou 90 dias.

💡 **Dica**: Foque nos pontos de maior drop-off para otimizar seu funil de vendas.`,
  },
];
