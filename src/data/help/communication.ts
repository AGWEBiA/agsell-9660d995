import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const communication_articles: HelpArticle[] = [
  {
    id: 'inbox',
    categoryId: 'communication',
    title: 'SAC / Inbox unificado',
    icon: Inbox,
    description: 'Guia completo: atendimento multicanal, IA, transcrição, atribuição, CSAT e relatórios.',
    readTime: '10 min',
    popular: true,
    content: `O Inbox é sua central de atendimento que unifica mensagens de **WhatsApp**, **E-mail**, **Instagram**, **Telegram** e **SMS** em um único painel.

[presentation:inbox]

## Visão geral da interface

O Inbox é dividido em três painéis:

### Painel esquerdo — Lista de conversas
- Lista todas as conversas ativas e recentes
- Filtro por **canal** (WhatsApp, E-mail, Instagram, etc.)
- Filtro por **status** (Aberta, Respondida, Resolvida)
- Filtro por **prioridade** (Normal, Urgente)
- Filtro por **atribuição** (Minhas, Da equipe, Não atribuídas)
- **Busca** por nome do contato ou conteúdo da mensagem
- Indicador de **mensagens não lidas**

### Painel central — Chat
- Histórico completo da conversa selecionada
- Campo de digitação para responder
- Botões de ação: enviar, anexar arquivo, emoji, resposta rápida
- Botão **"Enviar com IA"** para gerar resposta inteligente
- Botão de **transcrição de áudio**
- Indicador do **canal** (ícone de WhatsApp, E-mail, etc.)

### Painel direito — Detalhes do contato
- Informações do contato (nome, e-mail, telefone, WhatsApp)
- **Lead Score** — Pontuação do contato
- **Tags** — Etiquetas aplicadas
- **Notas** — Observações internas da equipe
- **Deals** vinculados no pipeline
- **Histórico** de interações anteriores

[screenshot:Inbox unificado - Central de Atendimento|/inbox]

## Respondendo mensagens

1. Selecione uma conversa na lista à esquerda
2. Leia o histórico da conversa no painel central
3. Digite sua resposta no campo de texto na parte inferior
4. Pressione **Enter** para enviar (ou **Shift+Enter** para quebrar linha)
5. A mensagem é enviada pelo mesmo canal que o contato usou

### Opções ao responder
- **Texto** — Mensagem de texto simples
- **Emoji** — Selecione emojis do seletor
- **Arquivo** — Anexe documentos, imagens ou outros arquivos
- **Resposta rápida** — Use templates pré-configurados
- **Notas internas** — Adicione observações visíveis apenas para a equipe

## IA no atendimento

O recurso de **IA no atendimento** ajuda a responder mais rápido e com mais qualidade:

1. Com uma conversa aberta, clique no botão **"Enviar com IA"** (ícone de estrela/sparkle)
2. A IA analisa o **contexto completo** da conversa (mensagens anteriores, dados do contato)
3. Uma resposta inteligente é gerada automaticamente
4. **Revise** a sugestão antes de enviar
5. **Edite** se necessário — a IA é um assistente, não um substituto
6. Clique em **Enviar** para confirmar

> A IA é contextual: ela leva em conta o histórico da conversa, dados do contato e informações do CRM para gerar respostas relevantes.

## Transcrição de áudio

Quando receber mensagens de áudio no WhatsApp:

1. O áudio aparece como player no chat
2. Clique no botão de **transcrição** (ícone de texto)
3. O texto é gerado automaticamente usando IA
4. A transcrição aparece abaixo do áudio
5. Útil para ambientes onde não é possível ouvir áudio

## Respostas rápidas (Quick Replies)

Configure templates de respostas frequentes:

1. Acesse **Config. SAC** no menu lateral
2. Vá para a seção **"Respostas Rápidas"**
3. Clique em **"Nova Resposta"**
4. Defina um **atalho** (ex: "/boas-vindas") e o **texto da resposta**
5. No chat, digite o atalho ou clique no ícone de respostas rápidas

### Exemplos de respostas rápidas
- **/boas-vindas** — "Olá! Bem-vindo ao AG Sell. Como posso ajudar?"
- **/horario** — "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h."
- **/preco** — "Nossos planos começam a partir de R$197/mês. Veja mais em..."

## Notas internas da conversa

Adicione observações visíveis apenas para a equipe:

1. Na conversa aberta, acesse a seção de **notas** no painel direito
2. Clique em **"Adicionar nota"**
3. Escreva a observação
4. A nota fica vinculada à conversa e visível para todos os membros

> Notas internas são úteis para registrar contexto, decisões e informações que não devem ser enviadas ao cliente.

## Atribuição de atendimentos

Configure regras de atribuição automática para distribuir conversas entre os atendentes:

1. Acesse **"Config. SAC"** no menu lateral
2. Vá para a seção **"Regras de Atribuição"**
3. Crie uma nova regra:
   - **Nome** — Identificação da regra
   - **Canais** — Para quais canais aplicar
   - **Estratégia**:
     - **Round Robin** — Distribui igualmente entre atendentes na ordem
     - **Carga mínima** — Prioriza quem tem menos atendimentos abertos
     - **Aleatório** — Distribui aleatoriamente
   - **Membros elegíveis** — Selecione quais atendentes participam
   - **Máximo simultâneo** — Limite de atendimentos por pessoa
4. Ative a regra

[screenshot:Configuração do SAC|/inbox-settings]

## Agentes de atendimento (SAC)

Gerencie quem pode atender no SAC:

1. Acesse **"Config. SAC"** → seção **"Agentes"**
2. Visualize a lista de agentes disponíveis
3. Configure o **status online/offline** de cada agente
4. Defina **departamentos** e especialidades

## Pesquisa CSAT (Satisfação)

Configure pesquisas de satisfação automáticas:

1. Acesse **Config. SAC** → seção **"CSAT"**
2. Clique em **"Nova Pesquisa"**
3. Configure:
   - **Nome** — Identificação da pesquisa
   - **Pergunta** — Ex: "De 1 a 5, como você avalia nosso atendimento?"
   - **Canais** — Em quais canais enviar
   - **Envio automático** — Enviar automaticamente ao encerrar a conversa
4. Ative a pesquisa

### Métricas de satisfação
- **Nota média** (CSAT Score)
- **Distribuição por nota** (quantos deram 1, 2, 3, 4 ou 5)
- **Comentários** dos clientes
- **Por agente** — Compare a satisfação entre atendentes

## Protocolos de atendimento

Cada conversa recebe um **número de protocolo** único automaticamente. Isso permite:
- Rastrear atendimentos
- Vincular conversas relacionadas
- Fornecer referência ao cliente

## Categorias e prioridades

Classifique conversas por:
- **Categorias** — Suporte, Vendas, Financeiro, etc.
- **Prioridades** — Normal, Urgente
- **Tags** — Adicione tags específicas à conversa

## Boas práticas

- ⚡ **Responda rápido** — O tempo de primeira resposta impacta diretamente a satisfação
- 🤖 **Use a IA** como rascunho — Revise sempre antes de enviar
- 📝 **Registre notas** — Contexto interno facilita transferências entre atendentes
- 🏷️ **Categorize conversas** — Facilita análises posteriores
- 📊 **Monitore métricas** — Use os Relatórios do SAC para identificar melhorias
- 🎯 **Configure respostas rápidas** para perguntas frequentes

💡 **Dica**: O Lead Score aparece ao lado do nome do contato no chat. Use para priorizar atendimentos de leads mais qualificados e com maior potencial de conversão.`,
  },
  {
    id: 'whatsapp',
    categoryId: 'communication',
    title: 'WhatsApp',
    icon: MessageSquare,
    description: 'Guia completo: QR Code, API Oficial (Meta), Coex (duplo canal), múltiplas instâncias e campanhas.',
    readTime: '12 min',
    popular: true,
    content: `Integre o WhatsApp ao AG Sell para comunicação direta com seus contatos, campanhas em massa e automações. O sistema suporta **múltiplos provedores simultaneamente** — incluindo a API Oficial da Meta e a Evolution API via QR Code.

[video:🎬 Tutorial: Configurando WhatsApp + QR Code|/videos/tutorial-whatsapp.mp4]

## Provedores disponíveis

O AG Sell oferece **quatro modalidades** de conexão WhatsApp, que podem ser usadas **simultaneamente**:

| Provedor | Tipo | Indicado para |
|----------|------|---------------|
| **Evolution API (QR Code)** | Não oficial | Testes, uso pessoal, agilidade |
| **WhatsApp Business API (Meta)** | Oficial | Alto volume, profissionalismo, templates |
| **WhatsApp com Coexistência (Beta)** | Oficial + App | Manter app pessoal + API no mesmo número |
| **Z-API** | Não oficial | Alternativa simplificada |

> **Coex (Coexistência)** permite usar o mesmo número no app do celular e na API simultaneamente — recurso avançado da API Oficial da Meta.

---

## Opção 1: Conectando via QR Code (Evolution API)

Esta é a forma mais rápida de começar:

1. Acesse **"WhatsApp"** no menu lateral
2. Clique em **"Conectar WhatsApp"**
3. Um **QR Code** será exibido na tela
4. No seu celular, abra o **WhatsApp** → Menu (⋮) → **"Dispositivos vinculados"** → **"Vincular dispositivo"**
5. Escaneie o QR Code exibido na tela
6. Aguarde a sincronização (pode levar alguns segundos)
7. O status mudará para **"Conectado"** (indicador verde)

[screenshot:Tela de conexão do WhatsApp|/whatsapp]

> O AG Sell se conecta ao WhatsApp como um **dispositivo vinculado**. Seu celular deve permanecer conectado à internet para manter a conexão ativa.

⚠️ **Importante**: A conexão pode cair se o celular ficar muito tempo sem internet ou se o WhatsApp for deslogado. Reconecte escaneando um novo QR Code.

---

## Opção 2: WhatsApp Business API Oficial (Meta)

A API Oficial oferece **maior estabilidade, templates aprovados e suporte a alto volume de mensagens**. Siga os passos:

### Pré-requisitos

1. **Conta Meta Business Suite** verificada em [business.facebook.com](https://business.facebook.com)
2. **App criado** no [Meta for Developers](https://developers.facebook.com) (tipo "Business")
3. Produto **WhatsApp** adicionado ao app
4. **Número de telefone** registrado e verificado na plataforma Meta

### Obtendo as credenciais

1. Acesse o [Meta for Developers](https://developers.facebook.com) → seu App → **WhatsApp** → **Configuração da API**
2. Copie as seguintes informações:
   - **Phone Number ID** — Identificador único do seu número
   - **WhatsApp Business Account ID (WABA ID)** — ID da conta business
   - **Access Token Permanente** — Token de acesso (gere um token permanente no painel de System Users)

### Configurando no AG Sell

1. Acesse **"Integrações"** no menu lateral
2. Na seção **WhatsApp**, clique em **"Configurar"**
3. Selecione a aba **"WhatsApp Business API"**
4. Preencha os campos:
   - **Phone Number ID**
   - **Business Account ID**
   - **Access Token**
   - **Webhook Verify Token** (crie um token personalizado, ex: "agsell_verify_2024")
5. Clique em **"Salvar Configuração"**

### Configurando o Webhook na Meta

Para receber mensagens dos clientes, configure o webhook no Meta:

1. No Meta for Developers, vá em **WhatsApp** → **Configuração** → **Webhook**
2. Cole a **URL do Webhook** exibida na interface do AG Sell
3. Cole o **Verify Token** que você definiu
4. Clique em **"Verificar e Salvar"**
5. Inscreva-se nos campos: **messages**, **message_deliveries**, **message_reads**

✅ Pronto! As mensagens recebidas aparecerão automaticamente no Inbox.

---

## Opção 3: WhatsApp com Coexistência (Beta)

O modo **Coex** permite usar o **mesmo número no app do celular e na API** simultaneamente. Isso é possível graças ao recurso de coexistência da API Oficial da Meta.

### Como funciona

- Você continua usando o WhatsApp normalmente no celular
- A API envia e recebe mensagens pelo mesmo número
- Ideal para profissionais que não querem separar número pessoal/profissional

### Configuração

1. Siga todos os passos da **Opção 2** (API Oficial)
2. Na tela de configuração, marque a opção **"Habilitar Coexistência (Coex)"**
3. Salve a configuração

⚠️ **Atenção**: O recurso de Coexistência é um **recurso Beta** da Meta. Nem todos os números podem ser habilitados. Consulte a documentação oficial da Meta para verificar a disponibilidade.

---

## Múltiplas instâncias

Você pode conectar **vários números de WhatsApp** simultaneamente, inclusive usando **provedores diferentes** para cada número:

1. Na página do WhatsApp, clique em **"Adicionar Instância"**
2. Defina um nome para identificação (ex: "Vendas - QR Code", "Suporte - API Oficial")
3. Escolha o provedor (Evolution API, API Oficial, Z-API ou Coex)
4. Configure as credenciais do provedor escolhido
5. Use o **seletor no topo** da página para alternar entre contas

### Exemplo de configuração multi-instância

| Instância | Provedor | Número | Uso |
|-----------|----------|--------|-----|
| Vendas | API Oficial | +55 11 9xxxx-1111 | Alto volume, templates |
| Suporte | Evolution API (QR) | +55 11 9xxxx-2222 | Atendimento rápido |
| Pessoal | Coex (Beta) | +55 11 9xxxx-3333 | App + API simultaneamente |

### Instância padrão

- Defina uma instância como **padrão** — ela será usada automaticamente quando nenhuma instância for especificada
- Para campanhas e automações, você pode **escolher qual instância** usar

### Roteamento inteligente

Quando uma mensagem é enviada sem especificar a instância:
1. O sistema verifica se há uma **instância padrão** ativa
2. Se não houver, prioriza **Evolution API** como fallback
3. Em último caso, usa a **primeira instância ativa** disponível

---

## Campanhas de envio em massa

Envie mensagens para múltiplos contatos de uma vez:

1. Acesse a aba **"Campanhas"** na página do WhatsApp
2. Clique em **"Nova Campanha"**
3. Configure:
   - **Nome** — Identificação da campanha
   - **Instância** — Qual número usar para envio
   - **Mensagem** — Texto da mensagem (suporta formatação WhatsApp)
   - **Destinatários** — Selecione contatos por:
     - Tags específicas
     - Todos os contatos
     - Seleção manual
   - **Mídia** — Opcionalmente anexe imagem, vídeo ou documento
4. Clique em **"Enviar"** para envio imediato ou **"Agendar"** para envio futuro

### Detalhes da campanha
- **Progresso em tempo real** — Acompanhe quantos foram enviados
- **Status por contato** — Enviado, entregue, lido, erro
- **Intervalo entre envios** — O sistema adiciona delays para evitar bloqueio

⚠️ **Atenção**: Respeite as políticas do WhatsApp sobre envio em massa. Envios excessivos ou spam podem resultar em **bloqueio temporário ou permanente** da conta. Recomendações:
- Envie apenas para contatos que **consentiram** receber mensagens
- Limite o volume a **200-300 mensagens por dia** em contas novas
- Aumente gradualmente conforme a conta "aquece"
- Evite conteúdo repetitivo ou genérico

## Grupos do WhatsApp

O gerenciamento de grupos foi redesenhado para suportar operações de lançamento em grupo com controle total de tags, leads e automação.

### Como funciona o fluxo de grupos

O AG Sell **não cria os grupos** — você cria o grupo normalmente no WhatsApp com qualquer número. O fluxo é:

1. **Crie o grupo** no WhatsApp com qualquer número do seu celular
2. **Adicione o número de automação** como administrador do grupo
3. **Conecte o número de automação** na plataforma (via QR Code)
4. **Importe os grupos** — Nas configurações do dispositivo, clique em **"Importar todos os grupos"**
5. Os grupos aparecem na listagem **desativados** por padrão
6. **Ative e configure** cada grupo: adicione tags, defina tags de leads e ative a sincronização

### Identificando o dispositivo

Ao conectar múltiplos números, a plataforma exibe o **número de telefone** de cada dispositivo na listagem e nas configurações, facilitando a identificação de qual dispositivo está associado a quais grupos.

### Configurações do dispositivo

Ao clicar no ícone de configurações de um dispositivo conectado, você acessa:

- **Número de telefone** — Exibido para identificação
- **Importar todos os grupos** — Busca e importa todos os grupos onde o número é admin
- **Importar todos os contatos** — Importa contatos da instância
- Configurações de webhook e reconexão

### Listagem de grupos (formato tabela)

A aba **"Grupos"** exibe todos os grupos importados em uma tabela com:

| Coluna | Descrição |
|--------|-----------|
| **Nome** | Nome do grupo no WhatsApp |
| **Tags dos grupos** | Tags de categorização (ex: "lançamento", "vip") |
| **Tag dos leads** | Tags aplicadas automaticamente aos novos membros |
| **Telefone de envio** | Número da instância conectada |
| **JID** | Identificador único do grupo |
| **Status** | Toggle para ativar/desativar o grupo |

### Barra de ações

No topo da tabela, você encontra:

- **Editar os selecionados** — Edite tags e configurações de múltiplos grupos de uma vez
- **Editar todos os grupos** — Aplique configuração em lote a todos os grupos
- **Grupos arquivados** — Visualize grupos desativados/arquivados
- **Filtro por tag** — Filtre grupos por tag específica
- **Busca** — Pesquise pelo nome do grupo

### Configurando um grupo

Ao editar um grupo, você pode:

1. Definir **Tags do grupo** — Para categorização e filtros
2. Definir **Tags dos leads** — Tags aplicadas automaticamente quando novos membros entram
3. Vincular **instância** de envio — Qual número usar para enviar mensagens
4. Ativar **Sincronizar novos leads** — Importa automaticamente novos membros como contatos no CRM
5. **Importar leads** — Importa membros atuais como contatos

### Detalhes do grupo (5 abas)

Ao clicar em um grupo, você abre o painel de detalhes com:

- **Membros** — Lista de participantes com função (admin/membro), ações de promoção e remoção
- **Atividades** — Histórico de eventos (entradas, saídas, mensagens)
- **Mensagem** — Envio de mensagens com variáveis ({{grupo}}, {{data}}, {{total_membros}}), modo imediato ou agendado com data e horário
- **Config** — Travar grupo, somente admins, mensagens temporárias
- **Admin** — Configurações administrativas avançadas

### Mensagens para grupos
1. Acesse a aba **"Mensagem"** no painel de detalhes do grupo
2. Use as **variáveis** disponíveis: {{grupo}}, {{data}}, {{total_membros}}
3. Escolha o modo de envio:
   - **Enviar Agora** — Disparo imediato
   - **Agendar Envio** — Selecione data e horário para envio futuro
4. Clique em **Enviar** ou **Agendar**

## Integração com o CRM

Todas as mensagens de WhatsApp são:

- **Registradas no histórico** do contato
- **Visíveis no Inbox** unificado
- **Disponíveis para automações** como gatilho
- **Contabilizadas no Lead Score** (se configurado)

## Comparativo: QR Code vs API Oficial

| Característica | QR Code (Evolution) | API Oficial (Meta) |
|----------------|--------------------|--------------------|
| Configuração | Simples (escanear QR) | Requer conta Meta Business |
| Estabilidade | Média (depende do celular) | Alta (infraestrutura Meta) |
| Templates | Não suporta | Suporta templates aprovados |
| Volume | Limitado | Alto volume |
| Custo | Sem custo da Meta | Cobrança por conversa (Meta) |
| Coexistência | Não | Sim (Beta) |
| Ideal para | Início rápido, testes | Operações profissionais |

## Boas práticas

- 📱 **Mantenha o celular conectado** à internet (para QR Code)
- 🔄 **Reconecte proativamente** — Verifique o status da conexão regularmente
- ✍️ **Personalize mensagens** — Use {{nome}} para incluir o nome do contato
- ⏰ **Respeite horários** — Evite enviar mensagens fora do horário comercial
- 📊 **Monitore o engajamento** — Acompanhe taxas de leitura e resposta
- 🚫 **Evite spam** — Envie conteúdo relevante para não ser bloqueado
- 🔀 **Use múltiplas instâncias** — Separe canais por departamento ou finalidade
- 🏢 **API Oficial para produção** — Para operações críticas, prefira a API Oficial

💡 **Dica**: Combine WhatsApp com automações para criar fluxos como: "Quando um novo contato for criado, enviar mensagem de boas-vindas automaticamente". Você pode escolher qual instância/provedor usar em cada automação.`,
  },
  {
    id: 'email-marketing',
    categoryId: 'communication',
    title: 'E-mail Marketing',
    icon: Mail,
    description: 'Guia completo: criar campanhas, editor visual, templates, domínio personalizado e métricas.',
    readTime: '7 min',
    content: `O módulo de E-mail permite criar e enviar campanhas profissionais de e-mail marketing com editor visual.

## Visão geral

Na página de **E-mail**, você encontra:

- **Lista de campanhas** — Todas as campanhas criadas, com status e métricas
- **Botão "Nova Campanha"** — Criar uma nova campanha
- **Filtros** — Por status (rascunho, enviada, agendada)

[screenshot:Módulo de E-mail Marketing|/email]

## Criando uma campanha

### 1. Informações básicas
1. Clique em **"Nova Campanha"**
2. Defina o **nome** da campanha (interno, apenas para organização)
3. Defina o **assunto** do e-mail (o que o destinatário vê na caixa de entrada)
4. Selecione o **remetente** (caixa postal configurada)

### 2. Conteúdo do e-mail
Use o **editor visual** para montar o e-mail:

- **Arrastar e soltar** blocos de conteúdo
- Blocos disponíveis:
   - Texto (com formatação rica)
   - Imagem
   - Botão (CTA)
   - Separador
   - Espaçador
   - Colunas (layout em grid)
- **Variáveis dinâmicas**: {{nome}}, {{email}}, {{empresa}}
- **Personalização visual**: cores, fontes, bordas, espaçamentos

### 3. Destinatários
Selecione quem receberá o e-mail:

- **Todos os contatos** com e-mail cadastrado
- **Filtrar por tags** — Selecione uma ou mais tags
- **Contatos específicos** — Seleção manual

### 4. Envio
- **Enviar agora** — Dispara imediatamente
- **Agendar** — Defina data e hora para envio futuro

## Templates de e-mail

Para agilizar a criação:

1. Na criação de campanha, clique em **"Templates"**
2. Escolha entre templates pré-prontos:
   - Newsletter básica
   - Promoção com destaque
   - Anúncio de produto
   - Welcome email
3. Personalize cores, textos e imagens
4. Salve seus próprios templates para reuso

## Domínio personalizado de e-mail

[video:🎬 Tutorial: Configurando Domínio de E-mail|/videos/tutorial-dominio-email.mp4]

Para melhor **entregabilidade** (evitar caixa de spam), configure um domínio próprio:

1. Acesse **"Domínio E-mail"** no menu lateral
2. Clique em **"Adicionar Domínio"**
3. Insira seu domínio (ex: empresa.com.br)
4. O sistema gera os registros **DNS** necessários:
   - **SPF** — Autoriza o envio pelo AG Sell
   - **DKIM** — Assina digitalmente os e-mails
   - **DMARC** — Política de autenticação
   - **MX** — Para recebimento de e-mails
5. Adicione os registros no **painel do seu provedor de domínio** (GoDaddy, Registro.br, Cloudflare, etc.)
6. Volte ao AG Sell e clique em **"Verificar"**
7. Aguarde a propagação DNS (pode levar até 48h, geralmente minutos)

[screenshot:Configuração de Domínio de E-mail|/email-domain]

### Status da verificação
- ✅ **Verificado** — Tudo configurado corretamente
- ⏳ **Pendente** — Aguardando propagação DNS
- ❌ **Erro** — Registro não encontrado (verifique a configuração)

## Caixas postais (Mailboxes)

Após verificar o domínio, crie caixas postais:

1. No domínio verificado, acesse **"Caixas Postais"**
2. Clique em **"Nova Caixa"**
3. Configure:
   - **Prefixo** — ex: contato, suporte, vendas (gera contato@seudominio.com)
   - **Nome** — Nome de exibição (ex: "Equipe de Vendas")
   - **Limite diário** — Quantidade máxima de envios por dia:
     - Aquecimento: 50/dia (domínios novos)
     - Conservador: 200/dia
     - Moderado: 500/dia
     - Alto volume: 1000/dia
   - **Assinatura** — Configure assinatura com logo e links de redes sociais

### Warmup (Aquecimento)

Domínios novos precisam ser **aquecidos** gradualmente:
1. Comece com o limite de **50 e-mails/dia**
2. Após 1-2 semanas sem problemas, aumente para **200/dia**
3. Continue aumentando gradualmente conforme a reputação cresce
4. O status de warmup é exibido na caixa postal

## Métricas das campanhas

Cada campanha exibe métricas detalhadas:

- **Taxa de abertura** — Percentual de destinatários que abriram o e-mail
- **Taxa de cliques** — Percentual que clicou em links do e-mail
- **Entregas** — Quantidade de e-mails efetivamente entregues
- **Bounces** — E-mails que não foram entregues (endereço inválido)

## Boas práticas

- ✉️ **Assunto atraente** — O assunto é o fator #1 na taxa de abertura
- 📱 **Design responsivo** — Teste como o e-mail aparece no celular
- 🎯 **Segmente destinatários** — E-mails segmentados têm 2x mais abertura
- 📊 **Analise métricas** — Compare campanhas para otimizar
- 🔥 **Aqueça o domínio** — Comece devagar para evitar spam
- 📝 **Inclua CTA claro** — Botão com ação específica (Comprar, Saiba mais, etc.)

💡 **Dica**: Combine e-mail marketing com automações para envios baseados em comportamento (ex: enviar e-mail de follow-up quando um lead abrir uma proposta).`,
  },
  {
    id: 'instagram-integration',
    categoryId: 'communication',
    title: 'Instagram',
    icon: Instagram,
    description: 'Guia completo: conectar conta, automações de DM, comentários, stories e histórico.',
    readTime: '5 min',
    content: `Conecte contas do Instagram para automação de interações, DMs automáticas e atendimento via Inbox.

[presentation:instagram]

## Conectando sua conta

1. Acesse **"Instagram"** no menu lateral
2. Clique em **"Conectar conta"**
3. Autorize o acesso via **Facebook/Instagram** (sua conta Instagram deve ser uma conta profissional vinculada a uma página do Facebook)
4. Sua conta aparecerá na lista com:
   - Nome de usuário
   - Foto de perfil
   - Status da conexão

[screenshot:Página de automações do Instagram|/instagram]

### Requisitos
- Conta Instagram **Profissional** (Comercial ou Criador)
- Página do **Facebook** vinculada ao Instagram
- Permissões concedidas para gerenciar mensagens

## Automações de DM

Configure respostas automáticas para diferentes tipos de interação:

### Tipos de gatilhos

1. **DM recebida** — Quando alguém envia uma mensagem direta
2. **Comentário em post** — Quando alguém comenta em uma publicação
3. **Comentário em post específico** — Filtrado por post (via URL ou ID)
4. **Resposta ao story** — Quando alguém responde um story
5. **Menção em story** — Quando alguém menciona você em um story
6. **Novo seguidor** — Quando alguém começa a seguir

### Configurando uma automação

1. Clique em **"Nova Automação"**
2. Selecione a **conta** do Instagram
3. Escolha o **tipo de gatilho**
4. Configure as **condições**:
   - Palavra-chave na mensagem/comentário
   - Qualquer interação (sem filtro)
5. Configure a **resposta automática**:
   - Texto de resposta
   - Responder via DM (para comentários)
   - Enviar mídia (imagem, vídeo)
6. Opcionalmente adicione **ações CRM**:
   - Criar contato
   - Adicionar tag
   - Inscrever em sequência
7. **Ative** a automação

### Exemplos de automações

**Captura de leads via comentários:**
- Gatilho: Comentário com a palavra "QUERO" em um post de oferta
- Ação: Responder o comentário "Mandei no DM! 🚀"
- Ação: Enviar DM com link da oferta
- Ação: Criar contato no CRM com tag "lead-instagram"

**Boas-vindas para novos seguidores:**
- Gatilho: Novo seguidor
- Ação: Enviar DM de boas-vindas com apresentação
- Ação: Adicionar tag "seguidor-instagram"

## Histórico de execuções

Acompanhe todas as automações executadas:

- **Data e hora** da execução
- **Tipo de evento** que disparou
- **Status** (sucesso ou erro)
- **Ação tomada** (mensagem enviada, contato criado, etc.)
- **Contato** vinculado à interação

## Integração com o Inbox

Mensagens do Instagram aparecem no **Inbox unificado**:
- DMs são exibidas como conversas
- A equipe pode responder diretamente pelo Inbox
- Histórico completo da interação fica vinculado ao contato

## Boas práticas

- 📸 **Use em posts estratégicos** — Configure automações para posts com ofertas ou conteúdo de valor
- 🎯 **Segmente por palavra-chave** — Diferentes palavras podem acionar diferentes fluxos
- 🤖 **Combine com Flow Builder** — Use automações de Instagram como gatilho para funis completos
- ⏱️ **Responda rápido** — O Instagram penaliza contas que demoram para responder DMs

💡 **Dica**: Use o Flow Builder para criar funis completos de Instagram, combinando gatilhos de comentários com sequências de DMs automáticas.`,
  },
  {
    id: 'channels',
    categoryId: 'communication',
    title: 'Canais de comunicação',
    icon: Globe,
    description: 'Guia completo: Telegram, SMS (Twilio/Vonage) e Shopify — configuração e uso.',
    readTime: '5 min',
    content: `A página de Canais centraliza a configuração de todos os canais de comunicação adicionais disponíveis no AG Sell.

## Canais disponíveis

### 🤖 Telegram

Conecte bots do Telegram para atendimento automatizado:

1. Crie um bot no Telegram via **@BotFather**
2. Copie o **Token do Bot** gerado
3. No AG Sell, acesse **"Canais"** → **Telegram**
4. Cole o **Token do Bot**
5. Configure a **mensagem de boas-vindas** (enviada quando alguém inicia conversa com o bot)
6. Ative a integração

**Funcionalidades:**
- Receba mensagens do Telegram no **Inbox unificado**
- Responda diretamente pelo AG Sell
- Crie contatos automaticamente a partir de interações
- Use em **automações** como canal de envio

### 📱 SMS

Integre provedores de SMS para envios automáticos:

**Twilio:**
1. Crie uma conta no Twilio
2. Obtenha Account SID, Auth Token e número de telefone
3. No AG Sell, acesse **"Canais"** → **SMS**
4. Configure as credenciais do Twilio
5. Ative a integração

**Vonage:**
1. Crie uma conta no Vonage
2. Obtenha API Key e API Secret
3. Configure no AG Sell da mesma forma

**Funcionalidades:**
- Envie SMS em **automações** e **sequências**
- Receba respostas de SMS no **Inbox**
- Acompanhe **entregas** e **respostas**
- Use SMS como **fallback** quando WhatsApp não estiver disponível

### 🛒 Shopify

Conecte sua loja Shopify para sincronizar dados:

1. No AG Sell, acesse **"Canais"** → **Shopify**
2. Siga o fluxo de autorização do Shopify
3. Configure quais eventos sincronizar:
   - **Novo pedido** → Cria contato automaticamente
   - **Pedido pago** → Adiciona tag "cliente"
   - **Carrinho abandonado** → Dispara automação de recuperação

**Funcionalidades:**
- Crie contatos automaticamente a partir de compras
- Sincronize dados de pedidos
- Dispare automações baseadas em eventos de compra
- Recupere carrinhos abandonados com mensagens automáticas

[screenshot:Página de Canais|/channels]

## Boas práticas

- 📡 **Configure múltiplos canais** para alcançar contatos onde eles preferem ser contatados
- 🔄 **Use canais como fallback** — Se WhatsApp não entregar, tente SMS
- 🤖 **Automatize boas-vindas** em todos os canais para primeira impressão positiva
- 📊 **Compare performance** entre canais para investir nos mais eficientes

💡 **Dica**: A estratégia multicanal aumenta significativamente as taxas de resposta. Configure pelo menos 2 canais ativos.`,
  },
  {
    id: 'inbox-reports',
    categoryId: 'communication',
    title: 'Relatórios do SAC',
    icon: BarChart3,
    description: 'Métricas detalhadas: tempo de resposta, volume, satisfação, performance por agente.',
    readTime: '4 min',
    content: `Os Relatórios do SAC oferecem métricas detalhadas sobre o desempenho do atendimento da sua equipe.

[presentation:inbox-reports]

## Métricas disponíveis

### Tempo de resposta
- **Tempo médio de primeira resposta** — Quanto tempo leva para o primeiro atendente responder
- **Tempo médio de resolução** — Quanto tempo leva para resolver o atendimento completamente
- Ambos medidos em minutos/horas com gráfico de evolução

### Volume de atendimento
- **Total de conversas** — Por período selecionado
- **Distribuição por canal** — Quantas via WhatsApp, E-mail, Instagram, etc.
- **Distribuição por status** — Abertas, em atendimento, resolvidas
- **Pico de atendimento** — Horários e dias com mais demanda

### Satisfação (CSAT)
- **Nota média** — Score de satisfação (1-5)
- **Distribuição por nota** — Quantos clientes deram cada nota
- **Tendência** — Evolução da satisfação ao longo do tempo
- **Comentários** — Feedback textual dos clientes

### Performance por agente
- **Conversas atendidas** — Quantidade por atendente
- **Tempo médio de resposta** — Por atendente
- **Nota CSAT** — Satisfação por atendente
- **Taxa de resolução** — Percentual de atendimentos resolvidos por atendente

[screenshot:Relatórios do SAC|/inbox-reports]

## Filtros

Filtre os relatórios por:

- **Período** — Hoje, esta semana, este mês, personalizado
- **Canal** — WhatsApp, E-mail, Instagram, Telegram, SMS
- **Agente** — Atendente específico
- **Prioridade** — Normal, Urgente

## Como usar os dados

### Identificar gargalos
- Tempo de primeira resposta alto? → Contrate mais atendentes ou configure automações
- Volume concentrado em um canal? → Invista mais nesse canal
- Nota CSAT baixa em um agente? → Ofereça treinamento

### Definir metas
- Meta de tempo de primeira resposta: < 5 minutos
- Meta de CSAT: > 4.0
- Meta de taxa de resolução: > 90%

💡 **Dica**: Acompanhe o tempo de primeira resposta para garantir que seus clientes não fiquem esperando. Respostas rápidas aumentam a satisfação em até 60%.`,
  },
  {
    id: 'email-inbox',
    categoryId: 'communication',
    title: 'Inbox de E-mail',
    icon: Mail,
    description: 'Guia completo: receber e responder e-mails, caixas postais, assinaturas e warmup.',
    readTime: '5 min',
    content: `O Inbox de E-mail permite receber e responder e-mails diretamente dentro do AG Sell, sem precisar de um cliente de e-mail externo.

## Pré-requisitos

Para usar o Inbox de E-mail, você precisa:

1. **Domínio verificado** — Configure em "Domínio E-mail"
2. **Registros MX** configurados — Para recebimento de e-mails
3. **Caixa postal** criada — Com o prefixo desejado (ex: contato@)

## Como funciona

1. Quando alguém envia e-mail para **contato@seudominio.com**, o e-mail aparece no Inbox
2. O sistema tenta **vincular automaticamente** ao contato pelo e-mail
3. Se não encontrar, cria um novo contato automaticamente
4. Você pode **responder** diretamente pela plataforma

[screenshot:Inbox de E-mail|/email-inbox]

## Funcionalidades

### Receber e-mails
- E-mails recebidos aparecem em **tempo real** no inbox
- Indicação visual de e-mails **não lidos**
- Preview do conteúdo na lista

### Responder e-mails
1. Abra o e-mail na lista
2. Clique em **"Responder"**
3. O campo de resposta abre com:
   - Cabeçalho de resposta ("Em resposta a...")
   - Assinatura configurada automaticamente
4. Escreva sua resposta e envie

### Vincular a contatos
- E-mails são **automaticamente vinculados** ao contato correspondente (pelo endereço de e-mail)
- Aparecem na **timeline do contato** junto com WhatsApp e Instagram
- Criam **histórico unificado** de todas as interações

## Caixas postais — Configuração detalhada

Cada caixa postal possui:

### Limite diário de envios
Configure com presets inteligentes:
- 🐢 **Aquecimento (50/dia)** — Para domínios novos, aumenta reputação gradualmente
- 🐌 **Conservador (200/dia)** — Para uso regular com volume baixo
- ⚡ **Moderado (500/dia)** — Para volume médio de envios
- 🚀 **Alto volume (1000/dia)** — Para operações de grande escala

### Assinatura
Personalize a assinatura de cada caixa postal:
- **Logo** da empresa
- **Nome e cargo** do remetente
- **Links de redes sociais** (WhatsApp, Instagram, Facebook, YouTube, Telegram)
- **Texto** personalizado

### Status de warmup
Acompanhe o aquecimento do domínio:
- **Cold** — Domínio novo, sem reputação
- **Warming** — Em processo de aquecimento
- **Warm** — Reputação estabelecida
- **Hot** — Alta reputação, alto volume permitido

## Boas práticas

- 🔥 **Aqueça o domínio** — Comece com 50/dia e aumente gradualmente a cada semana
- 📧 **Responda rápido** — E-mails não respondidos prejudicam a reputação
- 🎨 **Configure assinatura** profissional — Transmite credibilidade
- 🔗 **Mantenha MX configurado** — Sem MX, você não recebe e-mails

💡 **Dica**: Comece com o limite de aquecimento (50 e-mails/dia) para novos domínios e aumente gradualmente a cada 1-2 semanas conforme a reputação cresce.`,
  },
  {
    id: 'sac-productivity',
    categoryId: 'communication',
    title: 'Novidades do SAC: copiar, citar e exportar',
    icon: Inbox,
    description: 'Use citação na resposta, copie mensagens com metadados, selecione texto livremente e exporte o histórico em PDF.',
    readTime: '5 min',
    popular: true,
    content: `O SAC do AG Sell ganhou um conjunto de melhorias para acelerar seu atendimento e facilitar o compartilhamento de informações fora da plataforma.

## ✍️ Citação automática na resposta

Quando você clica em **Responder** em uma mensagem, o conteúdo citado é enviado **junto** com a sua resposta e fica visível na bolha do contato.

- Útil para deixar claro a qual mensagem você está respondendo em conversas longas
- A citação aparece destacada acima do seu texto
- Funciona para mensagens enviadas e recebidas

> Caso queira remover a citação antes de enviar, basta clicar no **X** ao lado do bloco citado no campo de resposta.

## 📋 Copiar mensagem (com metadados)

Cada bolha de mensagem agora exibe um botão **Copiar** ao passar o mouse. O texto vai para a área de transferência no formato:

\`\`\`
> "trecho citado" — Autor da citação

Conteúdo da mensagem
— Remetente, dd/mm/aaaa hh:mm
\`\`\`

- Inclui automaticamente a **citação** (se houver), o **autor** e a **data/hora**
- Atalho de teclado **Ctrl+C** funciona após selecionar texto na bolha
- Ideal para colar em outros sistemas, e-mails ou documentos

## 🖱️ Seleção livre de texto

Você pode **selecionar qualquer trecho** das mensagens com o mouse — basta arrastar para destacar. Isso permite:

- Copiar apenas uma parte específica da conversa
- Pesquisar o texto em outras ferramentas
- Compartilhar trechos pontuais com a equipe

## 📄 Exportar histórico em PDF

No header da conversa, clique no botão de **Download** para gerar um PDF completo do atendimento.

O arquivo é salvo como \`conversa-{protocolo}-{data}.pdf\` e inclui:

- Nome do contato, número de protocolo e canal
- Todas as mensagens em ordem cronológica
- Citações preservadas e timestamps
- Pronto para arquivar, compartilhar ou anexar a auditorias

[screenshot:Botão de exportar PDF no header da conversa|/inbox]

## 🖼️ Imagens e anexos

As mídias enviadas no SAC (imagens, áudios e documentos) são armazenadas no bucket público \`inbox-attachments\`, garantindo carregamento rápido e visualização imediata em qualquer dispositivo.

⚠️ **Importante**: Mensagens excluídas do contato no WhatsApp continuam disponíveis no histórico do AG Sell — o SAC mantém um registro completo do atendimento para fins de auditoria.

💡 **Dica**: Combine **citação + cópia + PDF** quando precisar transferir um caso para outra equipe ou abrir um ticket interno com contexto completo.`,
  },
  {
    id: 'paid-groups',
    categoryId: 'communication',
    title: 'Grupos Pagos (Beta)',
    icon: Users,
    description: 'Automatize a gestão de membros em grupos de WhatsApp com integração a 20+ gateways de pagamento.',
    readTime: '10 min',
    popular: true,
    content: `O módulo **Grupos Pagos** permite automatizar completamente a entrada e saída de membros em grupos de WhatsApp com base em pagamentos recebidos de plataformas digitais. Disponível a partir do plano **Professional**.

[video:🎬 Tutorial: Configurando Grupos Pagos|/videos/tutorial-grupos-pagos.mp4]

> 🚧 **Beta**: Esta funcionalidade está em fase beta. Novos gateways e melhorias são adicionados continuamente.

## Como funciona?

O fluxo é simples:

1. **Cliente paga** em qualquer gateway (Kiwify, Hotmart, Eduzz, etc.)
2. **Webhook é enviado** para a AG Sell automaticamente
3. **Sistema identifica** o produto e o grupo vinculado
4. **Membro é adicionado** ao grupo de WhatsApp via Evolution API
5. Em caso de **cancelamento ou reembolso**, o membro é removido automaticamente

## Passo a Passo de Configuração

### 1. Configurar a Evolution API

A Evolution API é necessária para que o sistema consiga adicionar e remover participantes dos seus grupos de WhatsApp.

1. Acesse **Grupos Pagos** no menu lateral
2. Vá na aba **"Configuração"**
3. Insira a **URL** da sua instância da Evolution API (ex: \`https://api.meudominio.com\`)
4. Insira a **API Key** da sua instância
5. Ative o toggle **"Ativo"**
6. Clique em **"Salvar Configuração"**

> ⚠️ Certifique-se de que a Evolution API está rodando e acessível. O sistema precisa dela para gerenciar os grupos.

### 2. Importar seus Grupos de WhatsApp

Após configurar a Evolution API, você pode importar os grupos automaticamente:

1. Vá na aba **"Grupos"**
2. Clique em **"Buscar Grupos"**
3. O sistema buscará todas as instâncias conectadas e listará os grupos encontrados
4. **Selecione os grupos** que deseja utilizar para membros pagos
5. Clique em **"Adicionar Selecionados"**

> Grupos já importados não aparecem na lista para evitar duplicatas. Você pode remover um grupo a qualquer momento.

### 3. Criar Produtos

Cada produto representa um item de venda no seu gateway de pagamento:

1. Vá na aba **"Produtos"**
2. Clique em **"Novo Produto"**
3. Defina o **nome** (ex: "Acesso Comunidade VIP")
4. Opcionalmente defina **descrição**, **preço** e **ciclo de cobrança**
5. Na seção **"Mapeamento de Gateways"**, vincule os IDs dos produtos de cada plataforma:
   - Ex: No Kiwify, o product_id é \`abc123\`
   - Ex: No Hotmart, o product_id é \`xyz789\`
6. Salve o produto

> O mapeamento é essencial para que o sistema saiba qual produto do gateway corresponde a qual grupo.

### 4. Vincular Produtos a Grupos

Após criar produtos, vincule-os aos grupos:

1. No card do produto, clique em **"Gerenciar Vínculos"**
2. Selecione os grupos de WhatsApp que devem receber membros quando esse produto for comprado
3. Um produto pode estar vinculado a múltiplos grupos (ex: grupo geral + grupo exclusivo)

### 5. Configurar Webhooks nos Gateways

Copie a URL do webhook exibida na aba **"Passo a Passo"** e configure-a nos seus gateways:

**URL padrão do webhook:**
\`\`\`
https://[seu-projeto].supabase.co/functions/v1/paid-groups-webhook?org=[id-da-organizacao]&gateway=[nome-do-gateway]
\`\`\`

**Gateways suportados (20+):**
- 💳 **Kiwify** — \`gateway=kiwify\`
- 🟢 **Kiwify** — \`gateway=kiwify\`
- 🔥 **Hotmart** — \`gateway=hotmart\`
- 📦 **Eduzz** — \`gateway=eduzz\`
- 💰 **Monetizze** — \`gateway=monetizze\`
- ✅ **PerfectPay** — \`gateway=perfectpay\`
- 🎯 **Braip** — \`gateway=braip\`
- 🧘 **Guru** — \`gateway=guru\`
- 🔗 **Lastlink** — \`gateway=lastlink\`
- 🌶️ **Pepper** — \`gateway=pepper\`
- 🛒 **Yampi** — \`gateway=yampi\`
- ⚡ **Ticto** — \`gateway=ticto\`
- 🏷️ **Kirvano** — \`gateway=kirvano\`
- 💵 **Payt** — \`gateway=payt\`
- 🟩 **Greenn** — \`gateway=greenn\`
- 🛍️ **CartPanda** — \`gateway=cartpanda\`
- 🚀 **HeroSpark** — \`gateway=herospark\`
- 📱 **AppMax** — \`gateway=appmax\`
- 🎪 **Doppus** — \`gateway=doppus\`
- 🔧 **Webhook Genérico** — \`gateway=generic\`

### 6. Acompanhar Membros

Na aba **"Membros"**, você visualiza:
- **Membros ativos** — adicionados automaticamente após compra
- **Membros removidos** — retirados após cancelamento/reembolso
- **Informações** — Nome, WhatsApp, grupo, produto, data de entrada/saída

## Eventos Processados

O webhook processa os seguintes tipos de evento:

| Evento | Ação |
|--------|------|
| Compra aprovada | Adiciona membro ao grupo |
| Assinatura ativa | Adiciona membro ao grupo |
| Cancelamento | Remove membro do grupo |
| Reembolso | Remove membro do grupo |
| Estorno (chargeback) | Remove membro do grupo |
| Assinatura expirada | Remove membro do grupo |

## Dicas e Boas Práticas

- 📋 **Teste o webhook** antes de ativar em produção. Use um gateway de sandbox se disponível.
- 🔗 **Vincule corretamente** os IDs dos produtos — um mapeamento incorreto impede a automação.
- 👥 **Use grupos exclusivos** — Crie grupos separados para cada produto/nível de acesso.
- 🔄 **Monitore membros** — Verifique periodicamente a aba de membros para garantir que tudo funciona.
- ⚙️ **Evolution API estável** — Use uma instância dedicada para evitar quedas.

💡 **Dica**: O webhook genérico aceita qualquer payload com campos \`email\`, \`phone\`, \`product_id\` e \`event\` — ideal para integrações customizadas.`,
  },
  {
    id: 'group-rotator',
    categoryId: 'communication',
    title: 'Rotador de Grupos (Smart Link)',
    icon: LinkIcon,
    description: 'Distribua automaticamente usuários entre múltiplos grupos de WhatsApp com um link inteligente.',
    readTime: '6 min',
    popular: true,
    content: `O **Rotador de Grupos** permite criar links inteligentes que distribuem automaticamente os cliques entre vários grupos de WhatsApp usando a estratégia **round-robin**. Ideal para lançamentos, comunidades e infoprodutos que precisam gerenciar múltiplos grupos.

## Como funciona

1. Você cria uma **campanha** com um slug único (ex: \`curso-vip\`)
2. Adiciona vários **grupos** com seus links de convite do WhatsApp
3. Compartilha o link único: \`seusite.com/r/curso-vip\`
4. Cada clique é automaticamente direcionado para o próximo grupo disponível

## Criando uma Campanha

1. Acesse **Rotador de Grupos** no menu WhatsApp
2. Clique em **"Nova Campanha"**
3. Defina um **nome** (ex: "Lançamento Produto X")
4. Defina um **slug** (identificador no link — ex: \`produto-x\`)
5. Clique em **"Criar Campanha"**

## Adicionando Grupos

1. Na lista de campanhas, clique no ícone de **engrenagem** (⚙)
2. Clique em **"Adicionar Grupo"**
3. Preencha:
   - **Nome do Grupo** — Nome para identificação interna
   - **Link de Convite** — Link completo do WhatsApp (ex: \`https://chat.whatsapp.com/ABC123\`)
   - **Capacidade Máxima** — Número máximo de membros (0 = sem limite)
   - **Máx. de Cliques** — Após X cliques, o grupo sai da rotação (0 = sem limite)

## Critérios de Troca Automática

O sistema troca automaticamente para o próximo grupo quando:

- ⚡ **Limite de cliques** — O grupo atingiu o número máximo de cliques configurado
- 👥 **Lotação** — O grupo atingiu a capacidade máxima de membros
- ⏸️ **Pausa manual** — Você pausou o grupo na interface

## Monitoramento

O painel mostra em tempo real:
- **Total de cliques** na campanha
- **Cliques por grupo** com barra de progresso
- **Ocupação** de cada grupo
- **Status** (Ativo, Pausado, Lotado)

## Boas Práticas

- 🔗 **Sempre use links válidos** — Verifique se os links de convite do WhatsApp estão funcionando
- 📊 **Configure limites** — Defina capacidade máxima para evitar grupos superlotados
- ⏸️ **Pause para manutenção** — Use o botão de pausa ao invés de remover o grupo
- 🎯 **Um link por campanha** — Cada campanha gera um link único, facilitando o rastreamento

💡 **Dica**: Use o rotador para lançamentos com grande volume de leads. Ao invés de um único grupo lotado, distribua entre 5-10 grupos menores para melhor engajamento.`,
  },
  {
    id: 'voip',
    categoryId: 'communication',
    title: 'VoIP / Telefonia',
    icon: Inbox,
    description: 'Realize e receba ligações diretamente pela plataforma com softphone integrado e gravação.',
    readTime: '7 min',
    content: `O módulo de **VoIP** permite realizar e receber ligações telefônicas diretamente pelo navegador. Disponível a partir do plano **Professional**.

## Softphone Integrado

1. Acesse **VoIP** no menu lateral
2. Use o teclado numérico para discar ou clique no ícone de telefone ao lado de qualquer contato

### Funcionalidades
- Discagem direta, mudo, espera e transferência
- Gravação automática de chamadas vinculadas ao CRM
- Transcrição com IA para registro textual
- Dashboard com métricas: duração média, taxa de atendimento, distribuição por hora

## Créditos de VoIP

O VoIP funciona com sistema de créditos — compre pacotes (100, 500, 1000, 5000 minutos) e créditos são debitados conforme duração da ligação.

💡 **Dica**: Grave todas as ligações de vendas para criar um banco de boas práticas e treinar novos vendedores.`,
  },
  {
    id: 'whatsapp-templates-guide',
    categoryId: 'communication',
    title: 'Templates de WhatsApp',
    icon: MessageSquare,
    description: 'Gerencie templates aprovados para WhatsApp Business API com variáveis e botões.',
    readTime: '5 min',
    content: `**Templates de WhatsApp** são mensagens pré-aprovadas pela Meta necessárias para iniciar conversas proativas.

## Criando um Template

1. Acesse **WhatsApp Templates** → **"Novo Template"**
2. Configure nome, categoria (Marketing/Utilidade/Autenticação), idioma, conteúdo com variáveis (\`{{1}}\`, \`{{2}}\`), botões e mídia
3. Envie para aprovação

## Status: ⏳ Pendente → ✅ Aprovado ou ❌ Rejeitado

Templates aprovados podem ser usados em automações, campanhas, sequências e Flow Builder.

💡 **Dica**: Crie templates genéricos reutilizáveis em múltiplas campanhas.`,
  },
  {
    id: 'working-hours',
    categoryId: 'communication',
    title: 'Jornada de Trabalho (SAC)',
    icon: Inbox,
    description: 'Configure horários de atendimento, mensagem offline e fusos horários do SAC.',
    readTime: '4 min',
    content: `A configuração de **Jornada de Trabalho** define quando sua equipe está disponível para atendimento no SAC. Fora do horário, uma mensagem automática é exibida ao cliente.

## Acessando a Configuração

1. Acesse **Configurações do SAC** (menu lateral → SAC → ícone de engrenagem)
2. Clique na aba **"Horários"**

## Modos de Operação

| Modo | Descrição |
|------|-----------|
| **Sempre Online** | O SAC está disponível 24/7, sem mensagem offline |
| **Horário Comercial** | Ativo nos dias e horários configurados |
| **Personalizado** | Configuração livre por dia da semana |

## Configurando Horários

Para cada dia da semana, defina:

- **Ativo/Inativo** — Se o atendimento funciona neste dia
- **Horário de Início** — Ex: 09:00
- **Horário de Fim** — Ex: 18:00

### Atalho: Aplicar a Todos

Defina um horário e clique em **"Aplicar a todos os dias"** para replicar rapidamente.

## Mensagem Offline

Configure a mensagem que o cliente recebe quando entra em contato fora do horário:

> Exemplo: "Nosso horário de atendimento é de segunda a sexta, das 09:00 às 18:00. Deixe sua mensagem que retornaremos assim que possível!"

## Fuso Horário

Selecione o fuso horário da sua equipe (ex: America/Sao_Paulo) para garantir que os horários sejam calculados corretamente.

💡 **Dica**: Configure horários diferentes para sábado e domingo. Mesmo que a equipe não atenda, a mensagem offline mantém o cliente informado.`,
  },
  {
    id: 'communication-campaigns',
    categoryId: 'communication',
    title: 'Central de Campanhas',
    icon: Megaphone,
    description: 'Gerencie campanhas de VoIP, SMS e comunicação unificada em um só lugar.',
    readTime: '6 min',
    content: `A **Central de Campanhas** unifica a gestão de campanhas de VoIP, SMS e comunicação em uma única interface com créditos compartilhados.

## Campanhas de VoIP

Crie campanhas de ligação em massa com áudio pré-gravado:

1. Clique em **"Nova Campanha de VoIP"**
2. Defina o **nome** e faça upload do **áudio** (MP3 ou WAV)
3. Selecione as **tags** dos contatos que receberão a ligação
4. Opcionalmente, defina uma **mensagem de fallback** (enviada por WhatsApp se a ligação não for atendida)
5. **Agende** ou envie imediatamente

### Métricas de VoIP
- Total de chamadas, atendidas, não atendidas, falhadas
- Créditos consumidos por campanha

## Campanhas de SMS

Envie SMS em massa para segmentos de contatos:

1. Clique em **"Nova Campanha de SMS"**
2. Escreva a **mensagem** (até 160 caracteres)
3. Selecione as **tags** dos destinatários
4. Envie ou agende

## Créditos de Comunicação

Todas as campanhas consomem **créditos de comunicação**:

- Compre pacotes na aba **"Créditos"**
- Veja o histórico de transações
- Monitore o saldo em tempo real

## Boas Práticas

- 📊 **Monitore créditos** antes de campanhas grandes
- 🎯 **Segmente por tags** para campanhas mais relevantes
- ⏰ **Agende campanhas** para horários de maior engajamento
- 📱 **Use fallback** no VoIP para garantir que a mensagem chegue

💡 **Dica**: Combine campanhas de VoIP + SMS para máximo alcance: ligue primeiro, envie SMS para quem não atendeu.`,
  },
];
