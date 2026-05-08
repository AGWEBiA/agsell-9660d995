import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const settings_articles: HelpArticle[] = [
  {
    id: 'organization',
    categoryId: 'settings',
    title: 'Organização e equipe',
    icon: Building2,
    description: 'Guia completo: configurar organização, convidar membros, papéis e gerenciamento.',
    readTime: '5 min',
    content: `Gerencie os dados da sua organização e equipe de forma centralizada.

## Perfil da organização

1. Acesse **"Organização"** no menu lateral
2. Configure:
   - **Nome** — Nome da empresa/organização
   - **Logo** — Upload de imagem (200x200px, PNG/JPG recomendado)
   - **Slug** — URL única da organização (usado internamente)
3. Clique em **"Salvar"**

[screenshot:Configurações da Organização|/organization]

> O logo aparece no cabeçalho da plataforma, formulários públicos e relatórios. Use uma imagem de boa qualidade.

## Membros da equipe

### Convidando membros
1. Na página de Organização, vá para a seção **"Membros"**
2. Clique em **"Convidar membro"**
3. Insira o **e-mail** do colaborador
4. Selecione o **papel**:
   - **Owner** — Proprietário da organização (apenas 1)
   - **Admin** — Acesso administrativo completo
   - **Membro** — Acesso controlado por permissões
5. O convite é enviado automaticamente por e-mail
6. O membro aceita o convite e acessa a organização

### Gerenciando membros
- **Alterar papel** — Mude o papel de qualquer membro
- **Remover membro** — Desvincula o membro da organização
- **Ver último acesso** — Quando o membro acessou pela última vez

### Papéis e diferenças

| Permissão | Owner | Admin | Membro |
|-----------|-------|-------|--------|
| Visualizar dados | ✅ | ✅ | Conforme permissões |
| Editar organização | ✅ | ✅ | ❌ |
| Convidar membros | ✅ | ✅ | ❌ |
| Gerenciar plano | ✅ | ✅ | ❌ |
| Excluir organização | ✅ | ❌ | ❌ |
| Configurar permissões | ✅ | ✅ | ❌ |

## Isolamento de dados

Cada organização mantém seus dados **completamente isolados**:
- Contatos de uma organização não aparecem em outra
- Automações, deals, tags — tudo é separado
- Membros podem pertencer a múltiplas organizações

## Boas práticas

- 👥 **Convide toda a equipe** — O CRM funciona melhor com todos usando
- 🔒 **Use permissões** — Limite acesso baseado no papel de cada membro
- 📝 **Mantenha dados atualizados** — Nome, logo e informações corretas

💡 **Dica**: Configure as permissões (menu Permissões) antes de convidar membros com papel "Membro" para garantir controle de acesso desde o início.`,
  },
  {
    id: 'plans-subscription',
    categoryId: 'settings',
    title: 'Planos e assinatura',
    icon: Target,
    description: 'Guia completo: planos disponíveis, assinatura, upgrade, downgrade e faturamento.',
    readTime: '4 min',
    content: `O AG Sell oferece planos com diferentes níveis de recursos para atender negócios de todos os portes.

## Visualizando planos

1. Acesse **"Planos"** no menu lateral
2. Veja todos os planos disponíveis com:
   - **Recursos incluídos** em cada plano
   - **Limites** (contatos, envios, automações, membros)
   - **Preços** mensais e anuais
   - Comparação lado a lado

[screenshot:Página de Planos e Assinatura|/plans]

## Assinando ou fazendo upgrade

1. Selecione o plano desejado
2. Clique em **"Assinar"** ou **"Upgrade"**
3. Complete o pagamento via **Kiwify** (Pix, Boleto ou Cartão)
4. Os recursos são liberados **imediatamente**
5. Você recebe confirmação por e-mail

## Gerenciando sua assinatura

Na página de Planos, acompanhe:

- **Plano atual** — Qual plano está ativo
- **Status** — Ativo, em trial, expirado
- **Data de renovação** — Quando a próxima cobrança acontecerá
- **Histórico de pagamentos** — Cobranças anteriores

## Upgrade

- Ao fazer upgrade, os novos recursos são liberados **imediatamente**
- A diferença de valor é calculada **pro-rata** (proporcional aos dias restantes)
- Não há perda de dados ou configurações

## Downgrade

⚠️ Ao fazer downgrade:
- Funcionalidades exclusivas do plano anterior serão **desativadas no próximo ciclo**
- Dados não são excluídos, mas o acesso pode ser limitado
- Se ultrapassar limites do novo plano (contatos, membros), funcionalidades são bloqueadas

## Feature Gate

Recursos que não fazem parte do seu plano são protegidos por **Feature Gate**:
- O item aparece no menu mas está **bloqueado**
- Ao tentar acessar, você vê qual plano é necessário
- Botão direto para fazer upgrade

## Boas práticas

- 📊 **Comece pelo plano que atende hoje** — Upgrade é fácil e imediato
- 📅 **Planos anuais** têm desconto significativo
- 🔔 **Monitore o uso** — Próximo de atingir limites? Considere upgrade
- 💳 **Mantenha os dados de pagamento atualizados** — Evite interrupção por falha de pagamento

💡 **Dica**: Comece com o plano que atende suas necessidades atuais. Você pode fazer upgrade a qualquer momento sem perder dados ou configurações.`,
  },
  {
    id: 'permissions',
    categoryId: 'settings',
    title: 'Permissões e acessos',
    icon: Shield,
    description: 'Guia completo: criar perfis de permissão, configurar acessos granulares e Feature Gate.',
    readTime: '5 min',
    content: `Configure exatamente o que cada membro da equipe pode acessar no AG Sell com controle granular de permissões.

[presentation:permissions]

## Como funciona

O sistema de permissões tem três camadas:

1. **Papéis** — Owner, Admin, Membro (definidos na Organização)
2. **Perfis de permissão** — Conjuntos de módulos permitidos (configurados aqui)
3. **Feature Gate** — Recursos limitados pelo plano da organização

## Criando um perfil de permissão

1. Acesse **"Permissões"** no menu lateral
2. Clique em **"Novo Perfil"**
3. Defina o **nome** do perfil (ex: "Vendedor", "Suporte", "Marketing")
4. Selecione os **módulos permitidos**:

[screenshot:Configuração de Permissões|/permissions]

### Módulos configuráveis

**CRM:**
- ✅ Contatos — Ver, criar, editar, excluir
- ✅ Empresas — Ver, criar, editar, excluir
- ✅ Pipeline — Ver, criar deals, mover, editar
- ✅ Tags — Ver, criar, aplicar

**Comunicação:**
- ✅ Inbox (SAC) — Atender, responder, transferir
- ✅ WhatsApp — Enviar, conectar, campanhas
- ✅ E-mail Marketing — Criar campanhas, enviar
- ✅ Instagram — Automações, DMs
- ✅ Canais — Telegram, SMS, Shopify

**Marketing:**
- ✅ Automações — Criar, editar, ativar
- ✅ Flow Builder — Criar, editar fluxos
- ✅ Sequências — Criar, inscrever contatos
- ✅ Formulários — Criar, ver submissões
- ✅ Growth Tools — Criar ferramentas
- ✅ Testes A/B — Criar, analisar
- ✅ Lead Scoring — Configurar regras

**Inteligência:**
- ✅ Analytics — Ver dashboards e relatórios
- ✅ Assistente IA — Usar o chat
- ✅ Agentes IA — Criar, configurar
- ✅ Gamificação — Ver ranking, conquistas

**Configurações:**
- ✅ Organização — Editar dados
- ✅ Planos — Ver e gerenciar
- ✅ API Keys — Criar e gerenciar
- ✅ Webhooks — Configurar
- ✅ Integrações — Conectar serviços

5. Clique em **"Salvar"**

## Atribuindo perfis

1. Na página de Organização, selecione um membro
2. Atribua o perfil de permissão criado
3. O acesso é atualizado imediatamente

## Comportamento do Gate

Recursos sem permissão são:

- 🚫 **Ocultos do menu lateral** — O membro não vê itens que não pode acessar
- 🔒 **Bloqueados por URL direta** — Se digitar a URL, vê uma mensagem amigável
- 📋 **Mensagem explicativa** — Indica que o recurso requer permissão especial

## Exemplos de perfis

### Vendedor
- ✅ Contatos, Empresas, Pipeline, Tags, Tarefas
- ✅ Inbox, WhatsApp
- ✅ Analytics (somente visualização)
- ❌ Automações, E-mail, Configurações

### Suporte
- ✅ Contatos (visualização)
- ✅ Inbox, WhatsApp
- ❌ Pipeline, Automações, Configurações

### Marketing
- ✅ Contatos, Tags
- ✅ E-mail, Automações, Flow Builder, Formulários, Growth Tools
- ✅ Analytics, Lead Scoring, Testes A/B
- ❌ Pipeline (edição), Configurações administrativas

## Boas práticas

- 🔒 **Princípio do menor privilégio** — Dê apenas as permissões necessárias
- 📝 **Nomeie perfis claramente** — "Vendedor Júnior" vs "Vendedor Sênior"
- 🔄 **Revise periodicamente** — Atualize conforme a equipe evolui
- 📋 **Documente** — Mantenha uma lista de perfis e suas permissões

💡 **Dica**: Configure perfis de permissão antes de convidar novos membros. Isso garante que cada pessoa veja apenas o que precisa desde o primeiro acesso.`,
  },
  {
    id: 'agency-management',
    categoryId: 'settings',
    title: 'Gestão de Agência',
    icon: Briefcase,
    description: 'Guia completo: modo multi-tenant para agências, convidar clientes, alternar contas e isolamento.',
    readTime: '5 min',
    content: `O modo Agência permite gerenciar múltiplas organizações-cliente a partir de uma única conta, ideal para agências de marketing e consultorias.

## O que é o modo Agência?

O modo Agência transforma sua conta AG Sell em uma plataforma **multi-tenant**:
- Sua organização é a **agência** (organização mãe)
- Cada cliente é uma **organização filha** (com dados isolados)
- Você alterna entre clientes com um clique
- Cada cliente pode ter seu próprio plano e configurações

## Adicionando clientes

1. Acesse **"Clientes Agência"** no menu lateral
2. Clique em **"Convidar Cliente"**
3. Insira o **e-mail** do cliente
4. Selecione o **nível de acesso**:
   - **Operacional** — Acesso para operar CRM, inbox e automações do cliente
   - **Completo** — Acesso total, incluindo configurações, planos e permissões
5. O cliente receberá um **convite por e-mail**
6. Ao aceitar, a organização do cliente é vinculada à sua agência

## Alternando entre clientes

- No topo do **sidebar**, um **seletor de organização** aparece
- Clique no seletor para ver a lista de organizações
- Selecione a organização do cliente desejada
- A interface é atualizada instantaneamente com os dados daquele cliente
- Para voltar, selecione sua organização principal

## Isolamento de dados

- Cada organização-cliente mantém seus dados **completamente isolados**
- A agência **acessa** mas **não mistura** dados entre clientes
- Automações, contatos, deals, tags — tudo é separado
- O cliente pode acessar sua própria organização independentemente

## Plano necessário

O modo Agência requer o plano **Agência** e está protegido por **Feature Gate**:
- Se seu plano não incluir o módulo de Agência, o menu aparece bloqueado
- Faça upgrade para o plano Agência para desbloquear

## Boas práticas

- 🔒 **Use "Operacional"** para equipes que só executam, **"Completo"** para gestores
- 📊 **Acompanhe métricas** de cada cliente separadamente
- 📝 **Documente processos** — Cada cliente pode ter processos diferentes
- 🔄 **Alternar é instantâneo** — Use para verificar status rapidamente

> Cada organização-cliente mantém seus dados completamente isolados. A agência acessa mas não mistura dados entre clientes.

💡 **Dica**: O seletor de organização no sidebar permite alternar entre clientes instantaneamente. Use para verificar o status de cada conta rapidamente.`,
  },
  {
    id: 'api-webhooks',
    categoryId: 'settings',
    title: 'API Keys e Webhooks',
    icon: Key,
    description: 'Guia completo: criar API Keys, webhooks de entrada, rate limiting e integrações de pagamento.',
    readTime: '6 min',
    content: `Use API Keys e Webhooks para integrar o AG Sell com outros sistemas e automatizar processos externos.

[presentation:api-webhooks]

## API Keys

### O que são
API Keys são credenciais que permitem sistemas externos acessar dados do AG Sell via API REST.

### Criando uma chave
1. Acesse **"API Keys"** no menu lateral
2. Clique em **"Nova Chave"**
3. Configure:
   - **Nome** — Identificação (ex: "Integração Website", "App Mobile")
   - **Permissões** — O que a chave pode acessar:
     - Contatos (ler, criar, editar, excluir)
     - Deals (ler, criar, editar)
     - Tags (ler, aplicar)
   - **Rate limiting** — Limites de requisição:
     - Requisições por minuto (padrão: 60)
     - Requisições por dia (padrão: 10.000)
   - **Expiração** — Data de validade (opcional)
4. Clique em **"Gerar Chave"**
5. **Copie a chave** imediatamente (ela não será exibida novamente!)

[screenshot:Gerenciamento de API Keys|/api-keys]

### Gerenciando chaves
- **Ativar/Desativar** — Suspenda temporariamente sem excluir
- **Visualizar uso** — Veja estatísticas de requisições
- **Último acesso** — Quando a chave foi usada pela última vez
- **Revogar** — Exclua permanentemente a chave

⚠️ **Segurança**: Nunca compartilhe API Keys publicamente. Trate-as como senhas.

## Webhooks de entrada

### O que são
Webhooks de entrada permitem que sistemas externos enviem dados para o AG Sell quando eventos acontecem (pagamento aprovado, pedido criado, etc.).

### Criando um webhook
1. Acesse **"Webhooks"** no menu lateral
2. Clique em **"Novo Webhook"**
3. O sistema gera:
   - **URL do endpoint** — Endereço único para receber dados
   - **Token de segurança** — Para autenticação (envie no header)
4. Configure:
   - **Nome** — Identificação (ex: "Webhook Kiwify", "Webhook Hotmart")
   - **Descrição** — Para que serve
   - **Mapeamento de campos** — Como traduzir os dados recebidos para campos do CRM
   - **Ação alvo** — O que fazer quando receber dados:
     - Criar contato
     - Atualizar contato
     - Criar deal
     - Disparar automação
5. Copie a **URL** e o **Token**
6. Configure no sistema externo

[screenshot:Configuração de Webhooks|/webhooks]

### Integrações de pagamento prontas

O AG Sell tem webhooks pré-configurados para:

**Kiwify:**
- Pagamento aprovado → Cria contato + Deal ganho
- Assinatura criada → Tag "cliente-ativo"
- Assinatura cancelada → Tag "churn"

**Hotmart:**
- Compra aprovada → Cria contato + Tag do produto
- Reembolso → Atualiza status

**Eduzz:**
- Compra aprovada → Cria contato + Automação de onboarding

**Kiwify:**
- Compra aprovada → Cria contato + Deal

### Monitoramento
- **Requisições recebidas** — Contagem total
- **Último request** — Data/hora do último envio
- **Status** — Ativo/Inativo
- **Logs** — Histórico de payloads recebidos

## Boas práticas

- 🔑 **Uma chave por integração** — Facilita rastreio e revogação
- 🔒 **Limite permissões** — Dê apenas o acesso necessário
- 📊 **Monitore uso** — Verifique se há uso anormal
- 🔄 **Rotacione chaves** — Troque periodicamente por segurança
- 📝 **Documente integrações** — Registre o que cada chave/webhook faz

💡 **Dica**: Combine webhooks com automações para criar fluxos como: "Quando receber pagamento na Kiwify, criar contato, mover para pipeline de clientes e enviar e-mail de boas-vindas".`,
  },
  {
    id: 'integrations',
    categoryId: 'settings',
    title: 'Integrações',
    icon: LinkIcon,
    description: 'Guia completo: Hotmart, Eduzz, Kiwify, Evolution API, Z-API e domínio de e-mail.',
    readTime: '5 min',
    content: `O AG Sell se integra com diversas ferramentas e plataformas do mercado para automatizar seu negócio.

[presentation:integrations]

## Integrações disponíveis

### 💳 Provedores de pagamento

**Kiwify:**
- Pagamentos e assinaturas internacionais
- Webhook automático para criação de contatos
- Sincronização de status de pagamento
- Configuração: Token do Webhook Kiwify

**Hotmart:**
- Vendas de infoprodutos
- Webhook para captura de compradores
- Tags automáticas por produto comprado
- Configuração: Webhook URL no Hotmart

**Eduzz:**
- Vendas digitais
- Integração via webhook
- Criação automática de contatos
- Configuração: Webhook URL no Eduzz

**Kiwify:**
- Vendas online
- Webhook para sincronização
- Tags automáticas
- Configuração: Webhook URL no Kiwify

### 💬 WhatsApp providers

**Evolution API:**
- Servidor próprio de WhatsApp
- Máxima privacidade e controle
- Configuração: URL do servidor + API Key + Instance Name
- Ideal para: empresas com infraestrutura própria

**Z-API:**
- API simplificada e gerenciada
- Sem necessidade de servidor próprio
- Configuração: Instance ID + Token + Client Token
- Ideal para: quem quer praticidade

### ✉️ E-mail
- Domínio personalizado com SPF, DKIM, DMARC
- Configuração detalhada no módulo "Domínio E-mail"

[screenshot:Página de Integrações|/integrations]

## Configurando uma integração

1. Acesse **"Integrações"** no menu lateral
2. Encontre a integração desejada
3. Clique em **"Configurar"**
4. Siga o assistente de configuração específico:
   - Insira credenciais (API Key, Token, etc.)
   - Configure as opções específicas
   - Teste a conexão
5. Ative a integração

## Testando integrações

Após configurar, sempre teste:
- **WhatsApp** — Envie uma mensagem de teste
- **Pagamento** — Faça uma transação de teste (modo sandbox)
- **E-mail** — Envie um e-mail de teste

## Boas práticas

- 🔐 **Proteja credenciais** — Nunca compartilhe API Keys publicamente
- 🧪 **Teste em sandbox** — Use ambientes de teste antes de produção
- 📝 **Documente** — Registre quais integrações estão ativas e por quê
- 🔄 **Monitore** — Verifique periodicamente se as conexões estão ativas

> Cada integração tem seu próprio fluxo de configuração. Siga os passos indicados na tela e consulte a documentação da ferramenta externa se necessário.

💡 **Dica**: Configure as integrações de pagamento (Hotmart) primeiro se seu negócio depende de vendas online. Isso automatiza a criação de contatos e deals.`,
  },
  {
    id: 'support-portal',
    categoryId: 'settings',
    title: 'Portal de Suporte White-label',
    icon: HelpCircle,
    description: 'Configure um portal público de suporte para seus clientes abrirem e acompanharem chamados.',
    readTime: '6 min',
    popular: true,
    content: `O **Portal de Suporte White-label** permite que você ofereça um canal de atendimento profissional para seus clientes, sem que eles precisem criar conta ou fazer login. Disponível nos planos **Professional**, **Enterprise** e **Agência**.

## Como funciona

O portal é uma página pública acessível via link único da sua organização:

\`\`\`
https://seudominio.com/support-portal/slug-da-sua-organizacao
\`\`\`

Seus clientes podem:
- **Abrir tickets de suporte** com nome, e-mail, assunto e categoria
- **Acompanhar o status** de tickets existentes usando o número de protocolo
- **Iniciar chat direto** via WhatsApp (se configurado)

> Cada ticket gera um protocolo único (ex: SUP-20260306-12345) que o cliente usa para consultar o andamento.

## Configurando o Portal

1. Acesse **"Portal de Suporte"** no menu lateral (seção Comunicação)
2. Você verá o **link público** do seu portal — copie e compartilhe com seus clientes
3. Configure as opções:

### Mensagem de boas-vindas
Personalize a mensagem que seus clientes veem ao acessar o portal.

### Horário de atendimento
Informe o horário em que sua equipe está disponível para responder.

### Categorias de chamados
Adicione categorias para organizar os tickets recebidos:
- Clique em **"+"** para adicionar uma nova categoria
- Clique no **"X"** ao lado de uma categoria para removê-la
- Categorias padrão: Dúvida, Problema técnico, Financeiro, Sugestão, Outro

### Chat via WhatsApp
Ative para permitir que clientes iniciem uma conversa direta pelo WhatsApp:
1. Ative o switch **"Chat via WhatsApp"**
2. Insira o número do WhatsApp no formato internacional (ex: 5511999999999)
3. O botão de chat aparecerá no portal público

## Integração com o CRM

Quando um cliente abre um ticket pelo portal:
- O sistema **cria automaticamente um contato** no CRM (se não existir)
- O ticket é vinculado ao contato pelo e-mail informado
- Você pode acompanhar os tickets diretamente no SAC/Inbox

## Acompanhamento de tickets

Seus clientes podem consultar o status dos tickets:
1. No portal, clicam na aba **"Acompanhar Ticket"**
2. Inserem o **número do protocolo** e o **e-mail** usado na abertura
3. O sistema mostra o status atual: Aberto, Em andamento ou Resolvido

## Boas práticas

- 🔗 **Compartilhe o link** no seu site, e-mails e redes sociais
- ⏰ **Mantenha horários atualizados** para definir expectativas corretas
- 📋 **Use categorias claras** para facilitar a triagem dos tickets
- 💬 **Ative o WhatsApp** para oferecer atendimento instantâneo
- 📊 **Monitore os tickets** regularmente para garantir respostas rápidas

💡 **Dica**: Inclua o link do portal de suporte na assinatura de e-mail da sua equipe e no rodapé do seu site para facilitar o acesso dos clientes.`,
  },
  {
    id: 'settings-general',
    categoryId: 'settings',
    title: 'Configurações gerais',
    icon: Settings,
    description: 'Guia completo: tema claro/escuro, notificações, privacidade (LGPD), exportação e exclusão.',
    readTime: '4 min',
    content: `Personalize sua experiência no AG Sell e gerencie suas preferências de privacidade.

## Tema claro e escuro

O AG Sell oferece dois temas visuais:

- ☀️ **Tema claro** — Fundo branco, ideal para ambientes iluminados
- 🌙 **Tema escuro** — Fundo escuro, ideal para trabalhar à noite ou reduzir fadiga visual

### Como alternar
1. Clique no ícone de **lua/sol** no cabeçalho (canto superior direito)
2. O tema muda instantaneamente
3. A preferência é **salva automaticamente** no seu navegador

> O tema é individual — cada membro pode escolher sua preferência sem afetar os outros.

[screenshot:Configurações Gerais|/settings]

## Notificações

Configure quais notificações deseja receber:

### Tipos de notificação
- 💬 **Novas mensagens** — Quando uma mensagem é recebida no inbox
- ✅ **Tarefas vencidas** — Quando o prazo de uma tarefa expira
- 📊 **Movimentações no pipeline** — Quando deals são movidos
- 🤖 **Execuções de automação** — Quando automações são disparadas
- 🔔 **Atualizações do sistema** — Novos recursos e manutenções

### Canais de notificação
- **Push no navegador** — Notificações pop-up no desktop
- **Dentro do app** — Ícone de sino no cabeçalho
- **E-mail** — Para notificações importantes

## Privacidade e LGPD

Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você pode:

### Exportar seus dados
1. Acesse **Configurações** → **Privacidade**
2. Clique em **"Exportar meus dados"**
3. O sistema prepara um arquivo com todos os seus dados pessoais
4. Você recebe o download quando pronto

### Excluir sua conta
1. Acesse **Configurações** → **Privacidade**
2. Clique em **"Excluir minha conta"**
3. Confirme a exclusão (requer senha)
4. Todos os seus dados pessoais serão **permanentemente apagados**

⚠️ **A exclusão de conta é irreversível**. Todos os dados serão apagados permanentemente, incluindo:
- Contatos criados por você
- Automações criadas por você
- Histórico de mensagens
- Configurações pessoais

> Se você é o **Owner** da organização, a exclusão da conta também pode afetar a organização inteira. Transfira a propriedade antes de excluir.

## Boas práticas

- 🌙 **Use tema escuro** à noite para reduzir fadiga visual
- 🔔 **Configure notificações** para não perder mensagens importantes
- 📋 **Exporte dados regularmente** como backup de segurança
- 🔒 **Revise permissões** periodicamente

💡 **Dica**: Ative notificações de novas mensagens no navegador para nunca perder um atendimento. A rapidez de resposta impacta diretamente a satisfação do cliente.`,
  },
  {
    id: 'marketplace-integrations',
    categoryId: 'settings',
    title: 'Marketplace de Integrações',
    icon: Globe,
    description: 'Catálogo visual de conectores nativos e de terceiros para expandir a plataforma.',
    readTime: '4 min',
    content: `O **Marketplace de Integrações** é um catálogo visual com todos os conectores disponíveis para expandir as funcionalidades do AG Sell.

## Como acessar

1. Acesse **Integrações** no menu lateral
2. A aba **"Marketplace"** exibe todos os conectores disponíveis

## Categorias de conectores

### 📢 Advertising
- Google Ads, Meta Ads (Facebook/Instagram), TikTok Ads, LinkedIn Ads, Twitter Ads

### 📊 Analytics
- Google Analytics, Meta Pixel, Mixpanel, Hotjar

### 📅 Scheduling
- Calendly, Cal.com, Google Calendar

### 🔄 Automation
- Zapier, Make (Integromat), n8n, Pabbly Connect

### 💳 Payments
- Mercado Pago, PagSeguro, PayPal, Asaas

### 🛒 E-commerce
- Shopify, WooCommerce, Nuvemshop, Yampi

### 📧 E-mail
- Resend, SendGrid, Amazon SES, Mailgun

### 💬 Messaging
- Evolution API, WhatsApp Cloud API, Telegram Bot, Twilio, Vonage

### 🎓 Infoproducts
- Hotmart, Kiwify, Eduzz, Monetizze, Braip

### ☁️ Cloud & Storage
- Google Sheets, AWS S3, Notion, Airtable

## Status dos conectores

| Status | Significado |
|--------|------------|
| 🟢 Ativo | Configurado e funcionando |
| 🔵 Disponível | Pronto para ativar |
| 🟡 Em breve | Será lançado em breve |
| 🔴 Beta | Em fase de testes |

## Ativando uma integração

1. Encontre o conector desejado no marketplace
2. Clique em **"Configurar"**
3. Insira as credenciais necessárias (API Key, Token, etc.)
4. Teste a conexão
5. Ative a integração

💡 **Dica**: Comece pelas integrações de pagamento e messaging, que geram mais impacto direto nas vendas.`,
  },
  {
    id: 'webhook-retry-queue',
    categoryId: 'settings',
    title: 'Webhooks com Retry e Fila de Entrega',
    icon: Webhook,
    description: 'Sistema de fila com retry automático, backoff exponencial e dead-letter queue.',
    readTime: '5 min',
    content: `O sistema de **Webhooks com Retry** garante que nenhuma entrega de webhook seja perdida, usando uma fila inteligente com tentativas automáticas.

## Como funciona

1. **Webhook é disparado** — Evento ocorre no AG Sell
2. **Primeira tentativa** — Envia para o endpoint configurado
3. **Se falhar** — Entra na fila de retry
4. **Backoff exponencial** — Espera crescente entre tentativas (1min → 5min → 15min → 1h → 6h)
5. **Dead-letter** — Após todas as tentativas, move para fila morta

## Dashboard de entregas

Acesse **Webhooks** no menu lateral para ver a aba **"Fila de Entrega"**:

### Métricas do dashboard

| Métrica | Descrição |
|---------|-----------|
| Pendentes | Webhooks aguardando envio |
| Entregues | Entregas bem-sucedidas |
| Falhados | Entregas que falharam todas as tentativas |
| Taxa de sucesso | Percentual de entregas bem-sucedidas |

### Status de cada webhook

| Status | Significado |
|--------|------------|
| ⏳ Pendente | Aguardando primeira tentativa |
| 🔄 Retry | Falhou, aguardando próxima tentativa |
| ✅ Entregue | Enviado com sucesso |
| ❌ Falhado | Todas as tentativas esgotadas |
| 💀 Dead-letter | Movido para fila morta |

## Configuração

O sistema de retry é automático para todos os webhooks de saída. Parâmetros:

- **Máximo de tentativas**: 5
- **Backoff**: Exponencial (1min, 5min, 15min, 1h, 6h)
- **Timeout**: 30 segundos por tentativa
- **Dead-letter**: Após 5 falhas consecutivas

## Ações manuais

- **Reenviar** — Force o reenvio de um webhook específico
- **Cancelar** — Cancele entregas pendentes
- **Visualizar payload** — Veja o conteúdo enviado
- **Ver resposta** — Veja o status HTTP e corpo da resposta

## Boas práticas

- 🔗 **Endpoint sempre disponível** — Garanta que seu servidor está online
- ⚡ **Responda rápido** — Processe webhooks em menos de 30 segundos
- 📊 **Monitore falhas** — Falhas frequentes indicam problemas no endpoint
- 🔄 **Use dead-letter** — Investigue webhooks na fila morta regularmente

💡 **Dica**: Se muitos webhooks estão falhando, verifique se o endpoint está retornando status 200. Qualquer outro status é tratado como falha.`,
  },
  {
    id: 'migration',
    categoryId: 'settings',
    title: 'Migração de Plataforma',
    icon: Settings,
    description: 'Importe dados de outras plataformas via CSV, JSON, API ou webhooks.',
    readTime: '5 min',
    content: `O módulo de **Migração** facilita a transição de outras ferramentas para o AG Sell.

## Métodos

- **CSV** — Upload de arquivo com mapeamento de campos
- **JSON** — Importação de dados estruturados
- **API** — Conexão direta à API da plataforma de origem
- **Webhook** — Sincronização contínua durante a transição

## O que pode ser migrado

Contatos, empresas, deals, tags — tudo com mapeamento de campos configurável.

💡 **Dica**: Teste com uma amostra de 50-100 registros antes de importar a base completa.`,
  },
  {
    id: 'contact-preferences-guide',
    categoryId: 'settings',
    title: 'Preferências de Contato (Opt-out)',
    icon: Shield,
    description: 'Gestão de opt-out por canal e conformidade LGPD.',
    readTime: '4 min',
    content: `O módulo de **Preferências de Contato** gerencia opt-out por canal (WhatsApp, E-mail, SMS, Telefone).

## Como funciona

Quando um contato tem opt-out em um canal, automações, campanhas e sequências respeitam automaticamente a preferência. Cada alteração é registrada com data, motivo e quem realizou.

## Conformidade LGPD

- Respeito ao direito de revogação de consentimento
- Registro auditável de todas as alterações
- Bloqueio automático de envios

💡 **Dica**: Inclua links de opt-out nos rodapés de e-mails e mensagens de campanha.`,
  },
];
