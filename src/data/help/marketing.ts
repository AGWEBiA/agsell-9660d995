import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const marketing_articles: HelpArticle[] = [
  {
    id: 'automations',
    categoryId: 'marketing',
    title: 'Automações',
    icon: Zap,
    description: 'Guia completo: gatilhos, 20+ ações, condições, enquetes, templates e boas práticas.',
    readTime: '12 min',
    popular: true,
    content: `O motor de automações permite criar fluxos que executam ações automaticamente, eliminando tarefas repetitivas e acelerando seu processo de vendas.

[presentation:automations]

## Conceitos básicos

Uma automação é composta por:

- **Gatilho** — O evento que inicia a automação (o "quando")
- **Ações** — O que deve ser executado (o "então")
- **Condições** — Lógica Se/Senão para ramificar o fluxo (o "se")
- **Enquetes** — Perguntas interativas com ações por resposta

## Criando uma automação

1. Acesse **"Automações"** no menu lateral
2. Clique em **"Nova Automação"**
3. Defina o **nome** da automação (ex: "Boas-vindas novos leads")
4. Selecione o **gatilho** (evento que inicia)
5. Adicione **ações** (o que acontece)
6. Opcionalmente, adicione **condições** para ramificar
7. **Ative** a automação
8. Clique em **"Salvar"**

[screenshot:Módulo de Automações|/automations]

## Gatilhos disponíveis

### Contatos
- **Contato criado** — Quando um novo contato é adicionado ao CRM
- **Contato atualizado** — Quando dados de um contato são alterados

### Tags
- **Tag adicionada** — Quando uma tag específica é adicionada a um contato
- **Tag removida** — Quando uma tag é removida de um contato

### Pipeline
- **Deal criado** — Quando um novo deal é adicionado ao pipeline
- **Deal movido** — Quando um deal muda de etapa
- **Deal ganho** — Quando um deal é marcado como ganho
- **Deal perdido** — Quando um deal é marcado como perdido

### Mensagens
- **Mensagem recebida (WhatsApp)** — Quando uma mensagem chega no WhatsApp
- **E-mail recebido** — Quando um e-mail é recebido

### Formulários
- **Formulário submetido** — Quando alguém preenche um formulário

### Webhooks
- **Evento de webhook** — Quando um webhook de entrada é acionado (Hotmart, etc.)

## Ações disponíveis (20+)

### 💬 Mensagens
- **Enviar E-mail** — Envie e-mails com templates, variáveis ({{nome}}, {{email}}) e formatação rica
- **Enviar WhatsApp** — Envie mensagens de WhatsApp com texto, mídia e botões
- **Enviar DM Instagram** — Envie DMs com texto, quick replies e imagens
- **Enviar SMS** — Envie SMS via Twilio ou Vonage
- **Enviar Enquete** — Envie pergunta interativa com até 4 opções e ações diferentes por resposta
- **Notificar Admin** — Notifique um administrador via notificação push ou e-mail

### 📇 CRM & Dados
- **Adicionar Tag** — Aplique uma tag ao contato automaticamente
- **Remover Tag** — Remova uma tag do contato
- **Definir Campo** — Atualize qualquer campo do contato (status, fonte, notas, etc.)
- **Atualizar Lead Score** — Adicione, subtraia ou defina a pontuação do lead

### 🔀 Fluxo & Sequência
- **Inscrever em Sequência** — Adicione o contato a uma sequência drip (e-mails programados)
- **Remover de Sequência** — Cancele a inscrição do contato em uma sequência
- **Ir para outro Flow** — Redirecione para um fluxo visual no Flow Builder
- **Teste A/B (Split)** — Divida o tráfego entre dois caminhos com slider de porcentagem
- **Condição (Se/Senão)** — Crie ramificações lógicas baseadas em dados do contato
- **Aguardar** — Adicione delay em minutos, horas ou dias antes da próxima ação

### 👥 Equipe
- **Atribuir a Agente** — Atribua o contato a um atendente (round robin, menos ocupado ou específico)
- **Transferir p/ Humano** — Encaminhe para atendimento humano por departamento
- **Criar Tarefa** — Crie uma tarefa com título, prazo e prioridade automaticamente

### ⚙️ Avançado
- **Requisição HTTP** — Faça chamadas a APIs externas com método (GET, POST, PUT), headers e body customizáveis

## Enquetes com ramificação

A ação de **Enquete** é uma das mais poderosas — permite enviar perguntas interativas e configurar ações diferentes para cada resposta:

### Configurando uma enquete
1. Adicione a ação **"Enviar Enquete"** à automação
2. Defina a **pergunta** (ex: "Qual produto te interessa?")
3. Adicione até **4 opções** de resposta (ex: "Produto A", "Produto B", "Serviço", "Apenas olhando")
4. Para **cada opção**, configure uma ação:
   - Adicionar tag específica
   - Ir para um flow diferente
   - Enviar mensagem personalizada
   - Atualizar campo do contato
   - Inscrever em sequência
5. A resposta é salva automaticamente em um **campo do contato**

### Exemplo de funil com enquete

**Qualificação automática por interesse:**
- Enquete: "Qual seu interesse?" → Opções: Produto A, Produto B, Serviço, Apenas olhando
- Se **"Produto A"** → Tag "interesse-produto-a" + Sequência de vendas A + Score +20
- Se **"Produto B"** → Tag "interesse-produto-b" + Flow de demonstração + Score +20
- Se **"Serviço"** → Transferir para humano (equipe de vendas)
- Se **"Apenas olhando"** → Tag "browsing" + Sequência de nutrição

## Condições (Se/Senão)

A ação **Condição** permite criar ramificações lógicas na automação:

### Critérios de condição
- **Campo do contato** — Verificar status, fonte, e-mail, nome, etc.
- **Tag** — Verificar se o contato possui uma tag específica
- **Lead Score** — Comparar pontuação (maior que, menor que, igual a)
- **Resposta de enquete** — Agir baseado na resposta dada
- **Última interação** — Dias desde o último contato

### Operadores disponíveis
- Igual a / Diferente de
- Contém / Não contém
- Maior que / Menor que
- Existe / Não existe (campo preenchido ou vazio)

### Ações para cada resultado
Para **Verdadeiro** (condição atendida) e **Falso** (condição não atendida), defina ações:
- Adicionar/remover tag
- Ir para outro flow
- Enviar mensagem
- Parar automação
- Qualquer outra ação

### Exemplo de condição
**Condição**: Lead Score ≥ 70
- **Verdadeiro**: Notificar vendedor + Tag "lead-qualificado" + Criar tarefa "Ligar para lead"
- **Falso**: Inscrever em sequência de nutrição + Tag "lead-frio"

## Teste A/B (Split Test) inline

Dentro de automações, você pode dividir o fluxo para testar abordagens:

1. Adicione a ação **"Teste A/B"**
2. Defina a **porcentagem** de divisão (ex: 50/50, 70/30)
3. Configure ações diferentes para cada **variante**
4. Acompanhe as métricas de cada caminho

## Templates de automação

O sistema oferece templates prontos para cenários comuns:

- **Boas-vindas** — Envia mensagem de boas-vindas quando um contato é criado
- **Follow-up automático** — Envia follow-up X dias após último contato
- **Deal parado** — Notifica vendedor quando deal fica parado por mais de Y dias
- **Nutrição de leads** — Inscreve leads frios em sequência de nutrição
- **Recuperação de carrinho** — Envia mensagem quando carrinho é abandonado (via webhook Shopify)

## Execuções e histórico

Acompanhe todas as execuções de cada automação:

- **Data e hora** da execução
- **Contato** que disparou o gatilho
- **Evento** que iniciou (tag adicionada, deal criado, etc.)
- **Status** (sucesso, erro, em andamento)
- **Passos executados** — Quais ações foram realizadas
- **Erro** — Mensagem detalhada se algo falhou

## Boas práticas

- 🎯 **Comece simples** — Uma automação com 2-3 ações já gera valor
- 📊 **Monitore execuções** — Verifique se as automações estão funcionando
- 🔄 **Itere gradualmente** — Adicione complexidade conforme aprende
- 🏷️ **Use tags como ponte** — Tags conectam automações entre si
- 🧪 **Teste antes de ativar** — Crie um contato de teste para validar o fluxo
- 📝 **Nomeie claramente** — "Boas-vindas + Nutrição para leads de Facebook" é melhor que "Automação 1"
- ⏸️ **Desative se necessário** — Automações podem ser pausadas sem excluir

💡 **Dica**: Comece com automações simples e vá incrementando. Use enquetes para qualificar leads automaticamente e condições para personalizar a jornada.`,
  },
  {
    id: 'flow-builder',
    categoryId: 'marketing',
    title: 'Flow Builder Visual',
    icon: Workflow,
    description: 'Guia completo: construtor visual de funis estilo ManyChat para Instagram, WhatsApp e CRM.',
    readTime: '10 min',
    popular: true,
    content: `O Flow Builder é o construtor visual de automações do AG Sell, inspirado no ManyChat. Ele permite criar funis de automação de forma visual e intuitiva.

[video:🎬 Tutorial: Como usar o Flow Builder Visual|/videos/tutorial-flow-builder.mp4]

## Diferença entre Automações e Flow Builder

| Aspecto | Automações | Flow Builder |
|---------|-----------|--------------|
| Interface | Lista de ações sequenciais | Canvas visual com nós conectados |
| Visualização | Linear/texto | Gráfica/fluxograma |
| Complexidade | Simples a moderada | Moderada a complexa |
| Melhor para | Fluxos diretos | Funis com ramificações |

> Ambos podem ser combinados: uma Automação pode redirecionar para um Flow, e vice-versa.

## Visão geral

[screenshot:Flow Builder Visual|/flow-builder]

## Gerenciando seus fluxos

Ao acessar o Flow Builder, você vê a lista **"Meus Fluxos"** com todos os fluxos criados:

- Cada card mostra:
   - **Nome** do fluxo
   - **Gatilho** configurado (ícone + descrição)
   - **Número de ações** (nós) no fluxo
   - **Execuções** — Quantas vezes o fluxo foi disparado
   - **Status** — Ativo/Inativo
- Use o menu (⋮) de cada card para:
   - **Ativar/Desativar** o fluxo
   - **Editar** — Abrir no editor visual
   - **Duplicar** — Criar cópia do fluxo
   - **Excluir** — Remover o fluxo

Crie quantos fluxos quiser clicando em **"Novo Fluxo"**.

## Criando um fluxo passo a passo

### Passo 1: Escolha o gatilho

O primeiro passo é definir o que inicia seu fluxo. Os gatilhos são organizados por canal:

**📸 Instagram:**
- **Comentário em qualquer post** — Dispara quando alguém comenta em qualquer publicação
- **Comentário em post específico** — Filtra por post (via URL ou ID do post)
- **DM recebida** — Quando alguém envia mensagem direta
- **Resposta ao story (geral)** — Quando alguém responde qualquer story
- **Resposta a story específico** — Filtrado por URL ou ID do story
- **Menção em story** — Quando alguém menciona você em um story
- **Novo seguidor** — Quando alguém começa a seguir

**💬 WhatsApp:**
- **Mensagem recebida** — Qualquer mensagem
- **Palavra-chave específica** — Com modos de correspondência:
   - **Exata** — A mensagem inteira deve ser a palavra-chave
   - **Contém** — A mensagem deve conter a palavra-chave
   - **Inicia com** — A mensagem deve começar com a palavra-chave
- **Automação fonte** — Quando contato vem de automação específica
- **Origem da mensagem** — Filtra por tipo:
   - Campanha
   - Grupo
   - Broadcast
   - Mensagem direta

**📇 CRM:**
- **Novo contato criado** — Quando um contato é adicionado ao CRM
- **Formulário submetido** — Com seleção de formulário específico
- **Fonte do contato** — Filtra por origem:
   - Site
   - Anúncios (Facebook, Google)
   - Landing page
   - Indicação
   - Instagram
   - WhatsApp

### Passo 2: Adicione passos

Após definir o gatilho, adicione ações clicando no botão **"+"** entre os nós:

**Ações de mensagem:**
- 💬 **Enviar DM** — Responder via mensagem direta (Instagram/WhatsApp)
- 💬 **Responder comentário** — Responder ao comentário no post
- ✉️ **Enviar E-mail** — Enviar e-mail com assunto e conteúdo
- 📱 **Enviar WhatsApp** — Enviar mensagem de WhatsApp

**Ações de CRM:**
- 🏷️ **Adicionar Tag** — Aplicar tag ao contato
- 🏷️ **Remover Tag** — Remover tag do contato
- 📊 **Atualizar Lead Score** — Somar, subtrair ou definir pontuação
- 🔔 **Notificar equipe** — Enviar notificação para a equipe
- ✅ **Criar tarefa** — Criar tarefa vinculada ao contato

**Condições:**
- 🏷️ **Se tem tag** — Verificar presença de tag
- 🔤 **Se contém palavra-chave** — Verificar texto da mensagem
- 📊 **Se score ≥ valor** — Verificar pontuação do lead

**Espera:**
- ⏰ **Aguardar X minutos/horas/dias** — Pausar o fluxo antes de continuar

### Passo 3: Configure cada passo

Clique em qualquer nó para configurar seus parâmetros:

- **Mensagem a enviar** — Com suporte a variáveis: {{nome}}, {{email}}, {{empresa}}
- **Tag a adicionar/remover** — Seleção da lista de tags existentes
- **Palavra-chave a verificar** — Com modo de correspondência
- **Tempo de espera** — Em minutos, horas ou dias
- **Score a adicionar** — Valor positivo ou negativo
- **Tarefa** — Título, prazo e prioridade

### Passo 4: Salve e ative

1. Dê um **nome** ao seu fluxo (ex: "Funil Instagram Oferta Black Friday")
2. Ative o **switch** para que o fluxo comece a funcionar
3. Clique em **"Salvar Fluxo"**

## Editando fluxos existentes

1. Na lista "Meus Fluxos", clique em qualquer card
2. O editor visual abre com todos os nós e conexões
3. Faça as alterações desejadas
4. Clique em **"Atualizar Fluxo"** para salvar

## Exemplos de funis completos

### Funil Instagram → DM com qualificação
1. **Gatilho**: Comentário com palavra "QUERO" em post específico
2. **Ação**: Responder comentário "Mandei no DM! 🚀"
3. **Ação**: Enviar DM com oferta detalhada + link
4. **Ação**: Adicionar tag "interesse-instagram"
5. **Ação**: Atualizar score +20
6. **Espera**: 24 horas
7. **Condição**: Se tem tag "comprou" → Parar
8. **Ação**: Enviar DM de follow-up com urgência
9. **Espera**: 48 horas
10. **Condição**: Se score ≥ 50 → Notificar vendedor
11. **Ação**: Criar tarefa "Ligar para lead do Instagram"

### Funil WhatsApp de qualificação
1. **Gatilho**: Palavra-chave "INFO" (contém)
2. **Ação**: Enviar WhatsApp de boas-vindas + catálogo
3. **Ação**: Adicionar tag "lead-whatsapp"
4. **Ação**: Atualizar score +20
5. **Espera**: 30 minutos
6. **Condição**: Se respondeu → Tag "engajado" + Score +10
7. **Ação**: Criar tarefa "Follow-up em 48h"

### Funil CRM de onboarding
1. **Gatilho**: Formulário "Cadastro" submetido
2. **Ação**: Enviar e-mail de boas-vindas
3. **Ação**: Adicionar tag "onboarding"
4. **Espera**: 1 dia
5. **Ação**: Enviar WhatsApp "Tudo certo com o cadastro?"
6. **Espera**: 3 dias
7. **Ação**: Enviar e-mail com tutorial
8. **Ação**: Atualizar score +30

## Boas práticas

- 🎯 **Nomeie fluxos claramente** — "Funil Instagram Black Friday" > "Flow 1"
- 🧪 **Teste com contato fictício** antes de ativar
- ⏰ **Use esperas com moderação** — Muitas esperas podem fazer o contato esfriar
- 🔀 **Combine canais** — Instagram → WhatsApp → E-mail para máximo alcance
- 📊 **Monitore execuções** — Verifique se os fluxos estão disparando corretamente

💡 **Dica**: Combine o Flow Builder com enquetes das Automações para criar funis de qualificação interativos e altamente personalizados.`,
  },
  {
    id: 'sequences',
    categoryId: 'marketing',
    title: 'Sequências (Drip Campaigns)',
    icon: ListChecks,
    description: 'Guia completo: criar sequências de nutrição, configurar passos, inscrever contatos e boas práticas.',
    readTime: '6 min',
    content: `As Sequências permitem criar campanhas de nutrição com envios automáticos em intervalos programados — o famoso "drip marketing".

[presentation:sequences]

## O que são Sequências?

São séries de mensagens (e-mail, WhatsApp, SMS) enviadas automaticamente em intervalos configuráveis. Diferente de automações que reagem a eventos, sequências seguem um **cronograma fixo** após a inscrição.

### Casos de uso ideais
- 📧 **Nutrição de leads** — Sequência de 7 e-mails educativos ao longo de 30 dias
- 👋 **Onboarding** — Série de boas-vindas para novos clientes
- 🔄 **Follow-up pós-venda** — Mensagens de acompanhamento após compra
- 📚 **Curso por e-mail** — Aulas enviadas semanalmente
- 🎯 **Reengajamento** — Sequência para contatos inativos

## Criando uma Sequência

1. Acesse **"Sequências"** no menu lateral
2. Clique em **"Nova Sequência"**
3. Defina:
   - **Nome** — Identificação clara (ex: "Nutrição Lead Frio - 14 dias")
   - **Descrição** — Objetivo da sequência
4. Adicione **passos** (mensagens)
5. **Ative** a sequência

## Configurando passos

Cada passo da sequência define:

### Canal de envio
- ✉️ **E-mail** — Defina assunto e conteúdo HTML
- 💬 **WhatsApp** — Defina texto da mensagem
- 📱 **SMS** — Defina texto do SMS

### Conteúdo da mensagem
- Texto com variáveis dinâmicas: {{nome}}, {{email}}, {{empresa}}
- Formatação rica para e-mails
- Emojis e formatação WhatsApp para mensagens

### Delay (intervalo)
- Tempo de espera **antes** do envio deste passo
- Configurável em: **minutos**, **horas** ou **dias**
- Exemplo: Passo 1 (imediato) → Passo 2 (2 dias) → Passo 3 (5 dias) → Passo 4 (7 dias)

### Exemplo de sequência

| Passo | Delay | Canal | Conteúdo |
|-------|-------|-------|----------|
| 1 | Imediato | E-mail | Boas-vindas + links úteis |
| 2 | 2 dias | WhatsApp | "Já conferiu nosso material?" |
| 3 | 5 dias | E-mail | Case de sucesso de cliente |
| 4 | 7 dias | WhatsApp | Oferta especial com deadline |
| 5 | 10 dias | E-mail | Último lembrete + urgência |

## Inscrevendo contatos

Contatos podem ser inscritos em sequências de três formas:

### 1. Manualmente
1. Acesse a lista de contatos
2. Selecione os contatos desejados
3. Use a ação "Inscrever em sequência"
4. Selecione a sequência

### 2. Via Automação
- Na criação de automações, use a ação **"Inscrever em Sequência"**
- Selecione a sequência de destino
- O contato que disparou a automação será inscrito automaticamente

### 3. Via Flow Builder
- Adicione um nó de ação **"Inscrever em Sequência"** no fluxo visual

## Removendo contatos

Contatos podem ser removidos de sequências:
- **Manualmente** — Acesse a sequência e remova o contato
- **Via Automação** — Use a ação "Remover de Sequência"
- **Automaticamente** — Configure condições de saída (ex: se comprou, sair da sequência)

## Boas práticas

- 📅 **Planeje o cronograma** antes de criar — Defina quantos passos e intervalos
- ✍️ **Personalize o conteúdo** — Use {{nome}} e referências ao contexto
- 🎯 **Segmente** — Crie sequências diferentes para perfis diferentes
- 📊 **Monitore métricas** — Aberturas, cliques, respostas
- 🔀 **Combine canais** — Alterne entre e-mail e WhatsApp para melhor engajamento
- ⏹️ **Defina condições de saída** — Remova contatos que já converteram

💡 **Dica**: Combine sequências com Lead Scoring para criar jornadas inteligentes. Contatos com score alto saem da sequência de nutrição e vão para abordagem direta.`,
  },
  {
    id: 'whatsapp-flows',
    categoryId: 'marketing',
    title: 'WhatsApp Flows',
    icon: ListChecks,
    description: 'Guia completo: formulários interativos dentro do WhatsApp para coleta de dados.',
    readTime: '4 min',
    content: `WhatsApp Flows são formulários interativos enviados diretamente no WhatsApp, permitindo coletar dados estruturados sem que o contato precise acessar links externos.

## O que são Flows?

São formulários que o contato preenche **dentro do próprio WhatsApp**, nativamente. Diferente de enviar um link para um formulário web, os Flows oferecem experiência nativa com campos interativos.

## Criando um Flow

1. Acesse **"WhatsApp Flows"** no menu lateral
2. Clique em **"Novo Flow"**
3. Configure:
   - **Nome** — Identificação interna
   - **Descrição** — Para que serve este flow
4. Monte o formulário com o **builder visual**
5. Adicione campos conforme necessário
6. **Salve** e **publique**

[screenshot:Builder de WhatsApp Flows|/whatsapp-flows]

## Tipos de campos disponíveis

- **Texto** — Resposta livre (nome, e-mail, endereço)
- **Seleção** — Lista de opções (plano de interesse, como conheceu)
- **Data** — Seletor de data nativo (data de nascimento, agendamento)
- **Número** — Apenas números (telefone, quantidade, CPF)

## Visualizando submissões

1. Na lista de Flows, clique no flow desejado
2. Acesse a aba **"Submissões"**
3. Visualize todas as respostas recebidas com:
   - Nome do contato
   - Data e hora da submissão
   - Todos os campos preenchidos
4. Os dados são automaticamente **vinculados ao contato** no CRM

## Uso em automações

Flows podem ser integrados com automações:
- Use como **ação** em automações para solicitar dados
- As respostas podem **disparar gatilhos** de outras automações
- Dados coletados podem ser usados em **condições** para ramificação

## Boas práticas

- 📝 **Seja breve** — Formulários curtos têm maior taxa de conclusão
- 🎯 **Peça só o essencial** — Não peça dados desnecessários
- 📱 **Teste no celular** — Verifique como o flow aparece no WhatsApp
- 🔄 **Use com automações** — Automatize ações baseadas nas respostas

💡 **Dica**: WhatsApp Flows são ideais para agendamentos, pesquisas rápidas e qualificação de leads diretamente no WhatsApp.`,
  },
  {
    id: 'lead-scoring',
    categoryId: 'marketing',
    title: 'Lead Scoring',
    icon: Target,
    description: 'Guia completo: criar regras de pontuação, classificação automática e uso em automações.',
    readTime: '6 min',
    content: `O Lead Scoring atribui pontos aos contatos automaticamente baseado em suas ações e engajamento, permitindo identificar os leads mais qualificados.

[presentation:lead-scoring]

## Como funciona

Cada ação do lead no sistema gera pontos (positivos ou negativos). A pontuação acumulada indica o **nível de interesse e engajamento** do lead.

### Exemplos de pontuação padrão
- **+10** — Abriu e-mail
- **+15** — Visitou formulário
- **+20** — Clicou em link do e-mail
- **+25** — Respondeu mensagem de WhatsApp
- **+30** — Interagiu no Instagram (DM, comentário)
- **+50** — Submeteu formulário de captura
- **+50** — Respondeu enquete de qualificação
- **-10** — Não abriu e-mail em 30 dias
- **-20** — Não respondeu mensagem em 14 dias

## Classificação automática

Os leads são classificados automaticamente baseado na pontuação:

- 🟢 **Qualificado (Hot)** — 70 pontos ou mais → Pronto para abordagem de vendas
- 🟡 **Morno (Warm)** — Entre 40 e 69 pontos → Precisa de mais nutrição
- 🔴 **Frio (Cold)** — Menos de 40 pontos → Ainda não está engajado

[screenshot:Configuração de regras de Lead Scoring|/lead-scoring]

## Configurando regras

1. Acesse **"Lead Scoring"** no menu lateral
2. Clique em **"Nova Regra"**
3. Configure:
   - **Nome** — Descrição da regra (ex: "Abriu e-mail de campanha")
   - **Tipo de evento** — Selecione o evento que aciona a regra
   - **Pontos** — Valor positivo ou negativo
   - **Condições adicionais** — Filtros opcionais
4. **Ative** a regra

### Tipos de eventos disponíveis
- E-mail aberto / clicado
- WhatsApp recebido / respondido
- Instagram — DM / comentário / follow
- Formulário submetido
- Deal criado / movido / ganho
- Tag adicionada / removida
- Inatividade (sem interação por X dias)

## Onde o score aparece

O Lead Score é exibido em múltiplos lugares:

- **Inbox** — Ao lado do nome do contato no chat, permitindo priorizar atendimentos
- **Ficha do contato** — Na seção de informações, com indicador visual de cor
- **Filtros de contatos** — Filtre por faixa de pontuação
- **Tabela de contatos** — Coluna de score ordenável
- **Pipeline** — Nos cards de deals vinculados a contatos

## Usando Lead Score em automações

O score é uma ferramenta poderosa para automações:

### Como gatilho
- "Quando score atingir 70" → Notificar vendedor
- "Quando score cair abaixo de 20" → Inscrever em reengajamento

### Como condição
- "Se score ≥ 50" → Enviar proposta comercial
- "Se score < 30" → Enviar conteúdo educativo

### Como ação
- "Adicionar +20 ao score" → Quando submeteu formulário
- "Definir score para 0" → Quando foi marcado como desqualificado

## Boas práticas

- 📊 **Revise as regras periodicamente** — Ajuste pontuações baseado em resultados reais
- 🎯 **Não inflacione scores** — Pontuações altas demais perdem significado
- ⚖️ **Balance positivos e negativos** — Inatividade deve reduzir o score
- 📈 **Use como critério de priorização** — Leads com score alto primeiro
- 🤖 **Automatize ações** baseadas em faixas de score
- 📋 **Documente as regras** para a equipe entender o significado de cada faixa

💡 **Dica**: Use o score como gatilho em automações. Exemplo: quando um lead atingir 70 pontos, crie automaticamente uma tarefa para o vendedor ligar.`,
  },
  {
    id: 'forms',
    categoryId: 'marketing',
    title: 'Formulários de captura',
    icon: FileText,
    description: 'Guia completo: criar formulários, editor de campos, estilos, templates e integrações.',
    readTime: '5 min',
    content: `Crie formulários personalizados para capturar leads em seu site, landing pages ou compartilhados por WhatsApp e e-mail.

[presentation:forms]

## Visão geral

Na página de **Formulários**, você encontra:
- Lista de todos os formulários criados
- Contagem de submissões por formulário
- Status (ativo/inativo)
- Link público de cada formulário

[screenshot:Página de Formulários|/forms]

## Criando um formulário

### 1. Informações básicas
1. Clique em **"Novo Formulário"**
2. Defina:
   - **Nome** — Identificação interna (ex: "Cadastro Newsletter")
   - **Descrição** — Texto exibido ao visitante sobre o formulário

### 2. Adicionando campos
Use o **editor visual** de campos:

- **Nome** — Campo de texto para nome
- **E-mail** — Com validação de formato
- **Telefone** — Com máscara e DDI internacional
- **WhatsApp** — Número de WhatsApp
- **Texto livre** — Resposta aberta
- **Seleção** — Dropdown com opções
- **Caixa de seleção** — Checkbox (ex: "Aceito os termos")
- **Campos personalizados** — Qualquer campo adicional

Para cada campo, configure:
- **Rótulo** — Texto visível (ex: "Seu nome completo")
- **Placeholder** — Texto de exemplo dentro do campo
- **Obrigatório** — Se o campo deve ser preenchido
- **Ordem** — Posição na lista de campos

### 3. Estilização
Personalize a aparência do formulário:
- **Cores** — Fundo, texto, botão
- **Botão de envio** — Texto e cor
- **Texto de sucesso** — Mensagem após submissão
- **Redirecionamento** — URL para redirecionar após envio

### 4. Templates
Use templates prontos como ponto de partida:
- Cadastro básico (nome + e-mail)
- Contato comercial (nome + e-mail + telefone + mensagem)
- Newsletter (e-mail)
- Agendamento (nome + telefone + data)

## Compartilhando formulários

Cada formulário tem um **link público único**:

1. Copie o link do formulário
2. Compartilhe por:
   - **Site/Landing page** — Incorpore via iframe ou link
   - **WhatsApp** — Envie o link em mensagens
   - **E-mail** — Inclua em campanhas
   - **Redes sociais** — Publique em posts e stories
   - **QR Code** — Gere um QR Code com o link
   - **Anúncios** — Use como URL de destino

## Submissões

Quando alguém preenche o formulário:

1. Um **contato é criado automaticamente** no CRM (se não existir)
2. Se o contato já existir (pelo e-mail), os dados são **atualizados**
3. A submissão é registrada na aba **"Submissões"** do formulário
4. Tags configuradas são **aplicadas automaticamente**
5. **Automações** com gatilho "Formulário submetido" são disparadas

## Integrações com automações

Formulários se integram com todo o ecossistema:

- **Gatilho de automação** — "Quando formulário X for submetido"
- **Gatilho de Flow** — "Quando formulário for submetido"
- **Lead Score** — Submissão pode somar pontos automaticamente
- **Tags** — Aplique tags automaticamente aos contatos que preencherem

## Boas práticas

- 📝 **Peça o mínimo necessário** — Menos campos = mais submissões
- 🎨 **Personalize as cores** — Combine com a identidade visual do seu site
- ✅ **Use campos obrigatórios** com moderação — Apenas para dados essenciais
- 📊 **Monitore submissões** — Taxas de abandono indicam problemas
- 🔗 **Combine com automações** — Formulário → Tag → Sequência de nutrição

💡 **Dica**: Formulários com 3-5 campos têm as maiores taxas de conversão. Peça mais dados gradualmente após o primeiro contato.`,
  },
  {
    id: 'ab-tests',
    categoryId: 'marketing',
    title: 'Testes A/B',
    icon: SplitSquareVertical,
    description: 'Guia completo: criar testes, comparar variantes, métricas e boas práticas para otimização.',
    readTime: '4 min',
    content: `Os Testes A/B permitem comparar duas versões de uma mensagem para descobrir qual tem melhor desempenho e otimizar suas comunicações.

[presentation:ab-tests]

## Como funciona

1. Você cria **duas versões** (variante A e variante B) de uma mensagem
2. O sistema envia **metade para cada variante** (ou proporção customizada)
3. As métricas são coletadas automaticamente
4. O sistema identifica o **vencedor** baseado nos resultados

## Criando um teste

1. Acesse **"Testes A/B"** no menu lateral
2. Clique em **"Novo Teste"**
3. Configure:
   - **Nome** — Identificação do teste (ex: "Teste assunto e-mail Black Friday")
   - **Canal** — WhatsApp, E-mail ou Instagram
4. Crie a **Variante A** — Primeira versão da mensagem
5. Crie a **Variante B** — Segunda versão (altere apenas UMA variável)
6. Defina os **destinatários**
7. Clique em **"Iniciar Teste"**

## Métricas coletadas

O sistema acompanha automaticamente:

- **Envios** — Quantidade enviada de cada variante
- **Aberturas** (e-mail) — Taxa de abertura de cada versão
- **Respostas** — Taxa de resposta de cada variante
- **Cliques** — Taxa de cliques em links
- **Conversões** — Conversões geradas por cada variante
- **Vencedor** — Variante com melhor performance geral

## O que testar

### Em e-mails
- **Assunto** — Diferente redação do assunto
- **CTA** — Texto do botão ("Comprar agora" vs "Ver oferta")
- **Layout** — Com imagem vs sem imagem
- **Horário** — Manhã vs tarde

### Em WhatsApp
- **Texto** — Abordagem formal vs informal
- **Emoji** — Com vs sem emojis
- **Extensão** — Mensagem curta vs detalhada
- **CTA** — Diferentes chamadas para ação

### Em Instagram
- **DM** — Diferentes aberturas
- **Resposta a comentário** — Diferentes textos de resposta

## Testes A/B em automações (inline)

Além de testes independentes, você pode usar **Split Tests** dentro de automações:

1. Na criação de automação, adicione a ação **"Teste A/B"**
2. Configure a porcentagem de divisão (ex: 50/50, 70/30)
3. Defina ações diferentes para cada caminho
4. Monitore qual caminho gera mais resultado

## Boas práticas

- 🔬 **Teste UMA variável por vez** — Se mudar assunto E conteúdo, não saberá o que causou a diferença
- 📊 **Aguarde volume** — Pelo menos 100 envios por variante para resultados confiáveis
- 🏆 **Use o vencedor** — Aplique o aprendizado nas próximas comunicações
- 🔄 **Teste continuamente** — Sempre há espaço para otimização
- 📝 **Documente resultados** — Crie um banco de aprendizados para a equipe

💡 **Dica**: Testes A/B também estão disponíveis como ação inline dentro de automações (Split Test), permitindo testar caminhos completos, não apenas mensagens.`,
  },
  {
    id: 'growth-tools',
    categoryId: 'marketing',
    title: 'Growth Tools',
    icon: Megaphone,
    description: 'Guia completo: links de captura, QR Codes, widgets para site e métricas de conversão.',
    readTime: '5 min',
    content: `Growth Tools são ferramentas de captura de leads projetadas para atrair contatos para o seu WhatsApp e CRM de forma automatizada.

[presentation:growth-tools]

## Tipos de ferramentas

### 🔗 Links de captura

Gere links personalizados que iniciam conversa no WhatsApp:

1. Acesse **"Growth Tools"** no menu lateral
2. Clique em **"Novo Growth Tool"**
3. Selecione **"Link"**
4. Configure:
   - **Nome** — Identificação interna
   - **Número de WhatsApp** — Para qual número direcionar
   - **Mensagem pré-preenchida** — Texto que aparece pronto para enviar (ex: "Olá! Vi sua oferta e quero saber mais.")
5. Copie o link gerado

**Como funciona:**
- O visitante clica no link
- O WhatsApp abre com a mensagem pré-preenchida
- Ao enviar, o contato é criado automaticamente no CRM
- Automações configuradas são disparadas

**Onde usar:**
- Bio do Instagram
- Posts em redes sociais
- E-mails
- Assinatura de e-mail
- Anúncios pagos

### 📱 QR Codes

Gere QR Codes dinâmicos vinculados ao seu WhatsApp:

1. Crie um Growth Tool do tipo **"QR Code"**
2. Configure número, mensagem e nome
3. O QR Code é gerado automaticamente
4. Baixe em alta resolução para uso impresso

**Onde usar:**
- Materiais impressos (folhetos, cartões)
- Vitrines e pontos de venda
- Eventos e feiras
- Apresentações
- Embalagens de produtos

### 🖥️ Widgets para site

Botões flutuantes de WhatsApp para incorporar no seu site:

1. Crie um Growth Tool do tipo **"Widget"**
2. Configure:
   - **Cores** — Combine com seu site
   - **Posição** — Canto inferior direito ou esquerdo
   - **Mensagem** — Texto de abertura
   - **Ícone** — WhatsApp ou personalizado
3. Copie o **código embed** (HTML/JavaScript)
4. Cole no seu site

## Métricas

Cada ferramenta rastreia automaticamente:

- **Cliques** — Quantas vezes foi acessada/escaneada
- **Conversões** — Contatos gerados (que efetivamente enviaram mensagem)
- **Taxa de conversão** — Cliques ÷ Conversões

## Integração com automações

Growth Tools se conectam ao ecossistema:
- Contatos capturados podem **disparar automações**
- Tags podem ser **aplicadas automaticamente** ao contato gerado
- O contato entra no **pipeline** automaticamente

## Boas práticas

- 🎯 **Uma ferramenta por campanha** — Para medir performance de cada canal
- 📝 **Personalize a mensagem** — Contextualize com a campanha/oferta
- 📊 **Compare performance** — Identifique quais canais geram mais leads
- 🔄 **Combine com automações** — Novos contatos devem entrar em fluxos de nutrição

💡 **Dica**: Use Growth Tools com automações para que novos contatos entrem automaticamente em fluxos de nutrição e qualificação.`,
  },
  {
    id: 'sms-marketing',
    categoryId: 'marketing',
    title: 'SMS Marketing',
    icon: Megaphone,
    description: 'Campanhas SMS em massa, automações e mensagens bidirecionais.',
    readTime: '6 min',
    content: `O módulo de **SMS Marketing** permite enviar campanhas de texto em massa, criar automações baseadas em SMS e gerenciar conversas bidirecionais — tudo integrado ao CRM.

[presentation:sms-marketing]

## Campanhas SMS

1. Acesse **SMS Marketing** no menu lateral
2. Clique em **"Nova Campanha"**
3. Selecione destinatários (todos, por tag, por segmento)
4. Escreva a mensagem (até 160 caracteres)
5. Envie agora ou agende

### Métricas
- Enviados, Entregues, Respostas, Taxa de entrega

## Automações SMS
- Carrinho abandonado, boas-vindas, follow-up, reengajamento
- Integre SMS como ação em qualquer automação ou sequência

## Two-Way Messaging
- Respostas de SMS aparecem no Inbox
- Responda pelo Inbox e o contato recebe por SMS

## Configuração
Configure Twilio ou Vonage em **Canais** → **SMS** com Account SID, Auth Token e número de envio.

💡 **Dica**: Use SMS como fallback — se WhatsApp não entregar em 30 min, envie por SMS automaticamente.`,
  },
  {
    id: 'conditional-content',
    categoryId: 'marketing',
    title: 'Conteúdo Condicional',
    icon: Vote,
    description: 'Blocos de conteúdo dinâmico que mudam conforme o perfil do contato.',
    readTime: '5 min',
    content: `O **Conteúdo Condicional** cria blocos dinâmicos em e-mails que mudam com base no contato.

## Condições disponíveis
- **Tag** — Contato possui ou não uma tag
- **Lead Score** — Acima/abaixo de um valor
- **Status** — Lead, Cliente, Churned
- **Campo customizado** — Qualquer campo

## Criar bloco
1. Acesse Conteúdo Condicional → "Novo Bloco"
2. Defina condição
3. Escreva conteúdo verdadeiro e alternativo (fallback)
4. Use o código gerado nos templates

## Preview
Editor lado a lado: Se verdadeiro vs Se falso

💡 **Dica**: Ofertas de upgrade para Starter, features avançadas para Enterprise — tudo no mesmo e-mail.`,
  },
  {
    id: 'landing-pages',
    categoryId: 'marketing',
    title: 'Landing Pages',
    icon: Globe,
    description: 'Crie landing pages de captura com integração direta ao CRM.',
    readTime: '5 min',
    content: `O módulo de **Landing Pages** permite criar páginas de captura de leads sem ferramentas externas.

## Criar Landing Page
1. Acesse Landing Pages → "Nova Landing Page"
2. Defina título, slug (URL) e descrição
3. Edite conteúdo HTML no editor
4. Configure formulário de captura
5. Publique

## Integração com CRM
Formulário preenchido → Contato criado automaticamente → Tags aplicadas → Automações disparadas

## Métricas
- Visualizações, conversões, taxa de conversão

💡 **Dica**: Use para campanhas específicas (Black Friday, lançamento) com URLs personalizadas.`,
  },
  {
    id: 'flow-analytics',
    categoryId: 'marketing',
    title: 'Analytics no Flow Builder',
    icon: BarChart3,
    description: 'Métricas em tempo real por nó do Flow Builder: entradas, saídas, conversões e taxas.',
    readTime: '5 min',
    popular: true,
    content: `O **Analytics no Flow Builder** permite visualizar métricas de performance diretamente sobre cada nó do seu fluxo de automação, eliminando a necessidade de adivinhar onde os leads estão parando.

## O que você consegue ver

Cada nó do fluxo exibe um overlay com métricas em tempo real:

- **Entradas** — Quantos contatos entraram no nó
- **Saídas** — Quantos seguiram para o próximo nó
- **Conversões** — Quantos realizaram a ação esperada
- **Taxa de conversão** — Percentual de sucesso do nó

## Como ativar

1. Acesse **Flow Builder** e abra um fluxo existente
2. O overlay de analytics aparece automaticamente sobre cada nó
3. Passe o mouse sobre qualquer nó para ver métricas detalhadas
4. Use os dados para identificar **gargalos** e **pontos de perda**

## Casos de uso

### Identificar gargalos
Se um nó de "Enviar WhatsApp" tem 500 entradas mas apenas 50 cliques, o conteúdo precisa ser otimizado.

### Comparar caminhos
Em fluxos com condicionais, compare qual caminho tem melhor performance.

### Otimizar timers
Se muitos leads saem após um nó de espera, reduza o delay.

## Tabela de dados

Os dados são armazenados na tabela \`flow_node_analytics\` com campos:
- \`node_id\` — Identificador único do nó
- \`entries\`, \`exits\`, \`conversions\` — Contadores
- \`last_updated_at\` — Última atualização

💡 **Dica**: Revise os analytics semanalmente para identificar oportunidades de otimização nos seus fluxos mais importantes.`,
  },
  {
    id: 'automation-timeline',
    categoryId: 'marketing',
    title: 'Histórico de Execução de Automações',
    icon: ListChecks,
    description: 'Timeline visual mostrando cada automação e etapa por onde um contato passou.',
    readTime: '4 min',
    popular: true,
    content: `O **Histórico de Execução** é uma timeline visual que mostra exatamente por quais automações cada contato passou e em qual etapa está ou parou.

## O que aparece na timeline

Para cada evento, a timeline exibe:

- **Ação executada** — Envio de e-mail, WhatsApp, tag adicionada, etc.
- **Status** — Completado ✅, Falhado ❌, Aguardando ⏳
- **Automação** — Nome do fluxo que gerou o evento
- **Data/hora** — Quando aconteceu (com tempo relativo)
- **Detalhes** — Metadados adicionais (erro, dados enviados)

## Onde encontrar

1. Acesse **Automações** no menu lateral
2. Abra os detalhes de qualquer automação
3. O painel de **Timeline de Execução** mostra todos os eventos

## Ícones por tipo de ação

| Ação | Ícone |
|------|-------|
| Enviar e-mail | 📧 |
| Enviar WhatsApp | 💬 |
| Adicionar/remover tag | 🏷️ |
| Notificação | 🔔 |
| Condição (If/Else) | 🔀 |
| Aguardar (Wait) | ⏰ |
| Trigger (entrada) | ⚡ |

## Diagnóstico de problemas

Use a timeline para:

- **Identificar falhas** — Veja onde automações estão quebrando
- **Entender a jornada** — Saiba exatamente o caminho do contato
- **Depurar condicionais** — Verifique se as condições estão funcionando corretamente
- **Medir tempos** — Veja quanto tempo cada etapa está levando

💡 **Dica**: Combine a timeline com os analytics do Flow Builder para uma visão completa da performance das suas automações.`,
  },
  {
    id: 'site-tracking-trigger',
    categoryId: 'marketing',
    title: 'Site Tracking como Trigger de Automação',
    icon: Globe,
    description: 'Dispare automações quando um contato visitar uma página específica do seu site.',
    readTime: '4 min',
    content: `O **Site Tracking como Trigger** permite disparar automações automaticamente quando um contato visita uma página específica do seu site. É a ponte entre comportamento online e ação automática.

## Como funciona

1. **Contato visita seu site** (com snippet de tracking instalado)
2. **Evento é registrado** na tabela \`site_events\`
3. **Trigger detecta** a visita na página configurada
4. **Automação dispara** — e-mail, WhatsApp, notificação, etc.

## Configurando o trigger no Flow Builder

1. Acesse **Flow Builder** → Crie ou edite um fluxo
2. Como nó de entrada, selecione **"Página Visitada"** ou **"Evento no Site"**
3. Configure a URL ou evento específico

### Trigger: Página Visitada
- **URL da página** — Ex: \`/pricing\`, \`/produto-x\`, \`/checkout\`
- Dispara quando qualquer contato identificado visitar essa URL

### Trigger: Evento no Site
- **Nome do evento** — Ex: \`button_click\`, \`video_play\`, \`scroll_50\`
- Dispara quando o evento personalizado é rastreado via snippet JS

## Exemplos práticos

### Visitou página de preços
Contato visita \`/pricing\` → Aguarda 2h → Se não comprou → Envia WhatsApp com oferta especial

### Abandonou checkout
Contato visita \`/checkout\` → Aguarda 30min → Se não converteu → Envia e-mail de recuperação

### Viu produto específico
Contato visita \`/produto-x\` → Adiciona tag "interesse-produto-x" → Insere em sequência de nutrição

## Pré-requisitos

- **Site Tracking ativo** — O snippet JS deve estar instalado no site
- **Contato identificado** — O visitante precisa ter sido identificado (ex: via formulário)

💡 **Dica**: Combine triggers de página visitada com condicionais de tag para criar fluxos altamente segmentados.`,
  },
  {
    id: 'flow-ab-tests',
    categoryId: 'marketing',
    title: 'Testes A/B de Fluxos Completos',
    icon: SplitSquareVertical,
    description: 'Compare fluxos de automação inteiros e descubra qual converte mais.',
    readTime: '4 min',
    content: `O **Teste A/B de Fluxos** permite comparar dois fluxos de automação completos para descobrir qual gera mais conversões, não apenas mensagens isoladas.

## Diferença: A/B de Mensagens vs A/B de Fluxos

| Aspecto | A/B de Mensagens | A/B de Fluxos |
|---------|-----------------|--------------|
| O que testa | Uma mensagem (assunto, texto) | Caminho inteiro (sequência de ações) |
| Escopo | Um nó | Fluxo completo |
| Métricas | Abertura, clique | Conversão end-to-end |

## Como criar

1. Acesse **Automações** no menu lateral
2. Abra a aba **"Testes A/B de Fluxos"**
3. Clique em **"Novo Teste"**
4. Configure:
   - **Nome** — Identificação do teste
   - **Fluxo A** — Primeiro fluxo a ser testado
   - **Fluxo B** — Segundo fluxo alternativo
   - **Divisão** — Percentual de contatos para cada fluxo (50/50 por padrão)
5. Inicie o teste

## Métricas comparadas

| Métrica | Descrição |
|---------|-----------|
| Entradas | Quantos contatos entraram em cada fluxo |
| Conversões | Quantos completaram a ação desejada |
| Taxa | Conversões ÷ Entradas |
| Vencedor | Fluxo com maior taxa de conversão |

## Exemplos de testes

- **Velocidade de follow-up**: Fluxo A (resposta em 1h) vs Fluxo B (resposta em 24h)
- **Canal preferido**: Fluxo A (WhatsApp primeiro) vs Fluxo B (E-mail primeiro)
- **Nutrição longa vs curta**: Fluxo A (7 e-mails) vs Fluxo B (3 e-mails)

## Boas práticas

- 📊 **Aguarde volume** — Pelo menos 100 entradas por fluxo
- 🔬 **Mude uma variável** — Facilita identificar o que causou a diferença
- 🏆 **Aplique o vencedor** — Desative o perdedor e escale o ganhador
- 📅 **Duração mínima** — Execute por pelo menos 2 semanas

💡 **Dica**: Use testes A/B de fluxos para decisões estratégicas — qual canal usar primeiro, quanto tempo esperar, quantos touchpoints ter.`,
  },
  {
    id: 'email-conditional-content',
    categoryId: 'marketing',
    title: 'Conteúdo Condicional em E-mails',
    icon: Mail,
    description: 'Blocos dinâmicos em e-mails que mudam conforme tags, score ou status do contato.',
    readTime: '4 min',
    content: `O **Conteúdo Condicional** permite criar blocos dentro do e-mail que mostram conteúdos diferentes conforme as características de cada contato.

## Como funciona

Em vez de criar múltiplos e-mails, você cria UM template com blocos condicionais:

- **Se o contato tem a tag "VIP"** → Mostra oferta exclusiva
- **Se o score > 80** → Mostra CTA de compra direta
- **Se o status é "lead"** → Mostra conteúdo de nutrição

## Tipos de condição

| Condição | Exemplo |
|----------|---------|
| **Tag** | Contato tem a tag "cliente-ativo" |
| **Score** | Lead score maior que 70 |
| **Status** | Status é "ativo" ou "inativo" |
| **Campo** | Cidade = "São Paulo" |

## Criando conteúdo condicional

1. Acesse **Conteúdo Condicional** no menu ou use dentro do editor de e-mail
2. Defina o **tipo de condição** (tag, score, status)
3. Configure o **critério** (qual tag, qual valor de score, etc.)
4. Escreva o **conteúdo quando verdadeiro** — HTML que aparece se a condição for atendida
5. Escreva o **conteúdo quando falso** — HTML alternativo (fallback)
6. Copie o **código gerado** e cole no template de e-mail

## Preview lado a lado

O editor mostra uma preview em tempo real com dois painéis:
- **✅ Quando verdadeiro** — O que o contato vê se atende à condição
- **❌ Quando falso** — O que aparece caso contrário

## Exemplos práticos

### Oferta por segmento
- Tag "premium" → Desconto de 30%
- Sem tag → Desconto de 10%

### CTA por score
- Score > 80 → "Compre agora com desconto"
- Score ≤ 80 → "Saiba mais sobre nosso produto"

### Idioma por região
- Tag "br" → Conteúdo em português
- Tag "en" → Conteúdo em inglês

💡 **Dica**: Use conteúdo condicional para personalizar sem complexidade — um template, múltiplas experiências.`,
  },
  {
    id: 'chatbot-builder',
    categoryId: 'marketing',
    title: 'Chatbot Builder',
    icon: Bot,
    description: 'Crie chatbots inteligentes com fluxo visual, menus, IA e transferência para humanos.',
    readTime: '8 min',
    content: `O **Chatbot Builder** permite criar chatbots personalizados que respondem automaticamente em canais como WhatsApp, Instagram e Telegram — sem necessidade de programação.

## Conceito

Um chatbot é composto por **nós** (blocos de ação) conectados em sequência. Cada nó executa uma ação específica: enviar mensagem, exibir menu, coletar dados, aplicar tags ou transferir para um agente humano.

## Criando um Chatbot

1. Acesse **Chatbot Builder** no menu lateral
2. Clique em **"Novo Chatbot"**
3. Defina o **nome** e a **descrição**
4. Adicione nós ao fluxo arrastando da barra lateral

## Tipos de Nós

### Mensagens
- **Boas-vindas** — Mensagem inicial quando o chatbot é ativado
- **Texto** — Envia uma mensagem de texto simples
- **Menu** — Exibe opções numeradas para o usuário escolher

### Coleta de Dados
- **Pedir Input** — Solicita informação do usuário (nome, e-mail, telefone)
- **Condição** — Avalia uma regra (tag, score, resposta) e bifurca o fluxo

### Ações
- **Adicionar Tag** — Aplica uma tag ao contato
- **Remover Tag** — Remove uma tag do contato
- **Webhook** — Chama uma URL externa
- **Delay** — Aguarda um tempo antes de continuar

### IA
- **Resposta IA** — Usa inteligência artificial para gerar uma resposta contextual
- **Missão IA** — IA executa uma tarefa específica (qualificar, agendar, etc.)

### Transferência
- **Transferir Departamento** — Redireciona para um departamento específico
- **Transferir Agente** — Redireciona para um agente específico
- **Transferir Humano** — Encaminha para atendimento humano
- **Encerrar Conversa** — Finaliza a interação
- **Sem Interação** — Ação executada quando não há resposta do usuário

## Regras de Ativação

Cada chatbot pode ter **regras** que determinam quando ele é ativado:

- **Departamentos** — Ativa apenas para conversas de departamentos específicos
- **Horário de Funcionamento** — Ativa apenas dentro/fora do horário comercial
- **Tags de Inclusão** — Ativa apenas para contatos com tags específicas
- **Tags de Exclusão** — Não ativa para contatos com determinadas tags
- **Canais** — Ativa apenas em canais específicos (WhatsApp, Instagram, etc.)

## Boas Práticas

- 🤖 **Comece simples** — Um menu de opções + transferência já resolve 80% dos casos
- 📝 **Colete dados** — Use nós de input para capturar informações antes de transferir
- 🏷️ **Use tags** — Marque contatos conforme o caminho percorrido no chatbot
- ⏰ **Configure horários** — Ative chatbots diferentes dentro e fora do expediente
- 🧠 **Use IA com moderação** — Respostas de IA são poderosas mas devem ter fallback humano

💡 **Dica**: Combine o Chatbot Builder com as Automações para criar jornadas completas — o chatbot qualifica e a automação nutre o lead.`,
  },
  {
    id: 'funnel-planner',
    categoryId: 'marketing',
    title: 'Planejador de Funil',
    icon: Workflow,
    description: 'Planeje e organize seus funis de marketing e vendas com etapas visuais e métricas.',
    readTime: '5 min',
    content: `O **Planejador de Funil** permite criar e organizar visualmente seus funis de marketing e vendas, desde a captação de tráfego até a conversão final.

## Como funciona

1. Acesse **Planejador de Funil** no menu lateral
2. Clique em **"Novo Funil"**
3. Defina nome e descrição do funil
4. Adicione etapas ao funil

## Tipos de Etapas

| Tipo | Cor | Descrição |
|------|-----|-----------|
| 🔵 Tráfego | Azul | Fonte de visitantes (anúncios, orgânico, etc.) |
| 🟣 Landing Page | Roxo | Página de captura |
| 🟡 Automação | Amarelo | Fluxo automatizado de nutrição |
| 🟢 Conversão | Verde | Ponto de venda/conversão |
| ⚫ Personalizado | Cinza | Etapa customizada |

## Para cada etapa, defina

- **Nome** e **descrição**
- **Métricas** — KPIs relevantes (visitantes, leads, taxa de conversão)
- **Links** — URLs das páginas, ferramentas ou dashboards associados

## Boas Práticas

- 📊 **Defina métricas claras** para cada etapa do funil
- 🔗 **Vincule links** às ferramentas reais usadas em cada etapa
- 🎯 **Identifique gargalos** — onde a conversão cai mais?

💡 **Dica**: Use o Planejador de Funil em conjunto com o BI do Funil para planejar e depois medir os resultados reais.`,
  },
  {
    id: 'campaign-code-share',
    categoryId: 'marketing',
    title: 'Compartilhar Automação por Código',
    icon: Zap,
    description: 'Exporte e importe automações completas entre contas usando um código único.',
    readTime: '3 min',
    content: `O recurso de **Compartilhamento por Código** permite exportar e importar automações completas entre contas do AG Sell.

## Exportando uma Automação

1. Acesse a página de **Automações**
2. Clique no botão **"Exportar/Importar"** no topo
3. A automação selecionada será codificada em um **código único**
4. Clique em **"Copiar"** para copiar o código para a área de transferência

## Importando uma Automação

1. Na página de **Automações**, clique em **"Exportar/Importar"**
2. Selecione a aba **"Importar"**
3. Cole o **código** recebido no campo de texto
4. Clique em **"Importar"**
5. A automação será criada automaticamente na sua conta

## O que é transferido

- ✅ Nome da automação
- ✅ Tipo de gatilho e configuração
- ✅ Todas as ações e suas configurações
- ❌ Dados específicos (contatos, tags, IDs internos)

⚠️ **Importante**: Após importar, revise as ações para ajustar IDs de tags, formulários e configurações específicas da sua conta.

💡 **Dica**: Use este recurso para compartilhar automações de sucesso entre membros da equipe ou entre organizações de uma agência.`,
  },
  {
    id: 'automation-metrics',
    categoryId: 'marketing',
    title: 'Métricas de Automação',
    icon: Zap,
    description: 'Dashboard granular com sucesso/falha por canal, etapa e automação.',
    readTime: '5 min',
    content: `O dashboard de **Métricas de Automação** mostra a performance detalhada de cada automação, com dados granulares por canal e etapa.

## Visão Geral

Na tela principal, você encontra:

- **Seletor de automação** — Filtre por automação específica ou veja todas
- **Cards de resumo** — Total de execuções, sucesso, falhas e taxa geral
- **Gráfico por canal** — Comparativo de performance entre WhatsApp, E-mail e SMS

## Métricas por Etapa

A tabela detalha cada etapa da automação:

| Métrica | Descrição |
|---------|-----------|
| Enviados | Total de execuções da etapa |
| Entregues | Entregas bem-sucedidas |
| Falhados | Entregas que falharam |
| Abertos | Mensagens/e-mails abertos |
| Clicados | Links clicados |
| Taxa de Sucesso | Percentual de entregas bem-sucedidas |

## Métricas por Canal

Resumo agregado por canal de comunicação:
- 💚 **WhatsApp** — Taxa de entrega, aberturas
- 📧 **E-mail** — Taxa de entrega, aberturas, cliques
- 📱 **SMS** — Taxa de entrega

## Gráfico de Distribuição

Gráfico de pizza mostrando a proporção entre execuções com sucesso, falha e pendentes.

💡 **Dica**: Monitore as taxas de falha regularmente. Falhas frequentes em WhatsApp podem indicar problemas na instância conectada.`,
  },
];
