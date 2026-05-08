import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

export const crm_articles: HelpArticle[] = [
  {
    id: 'contacts',
    categoryId: 'crm',
    title: 'Gerenciando contatos',
    icon: Users,
    description: 'Guia completo: criar, importar, filtrar, segmentar e gerenciar contatos no CRM.',
    readTime: '8 min',
    popular: true,
    content: `Os contatos são a base do seu CRM. Aqui você gerencia todas as informações dos seus leads e clientes.

[presentation:contacts]

## Visão geral da página de Contatos

Ao acessar **"Contatos"** no menu, você vê:

- **Barra de busca** — Pesquise por nome, e-mail, telefone ou WhatsApp
- **Filtros** — Filtre por status, tags, empresa, fonte e data
- **Botão "Novo Contato"** — Criar contato manualmente
- **Botão "Importar"** — Importar contatos via CSV
- **Tabela de contatos** — Com nome, e-mail, telefone, status, tags e data de criação

[screenshot:Página de Contatos do CRM|/contacts]

## Criando um contato manualmente

1. Clique no botão **"Novo Contato"**
2. Preencha os campos obrigatórios:
   - **Nome** (obrigatório)
   - **Sobrenome** (opcional)
3. Preencha os campos opcionais:
   - **E-mail** — Para campanhas de e-mail e identificação
   - **Telefone** — Para contato telefônico
   - **WhatsApp** — Para mensagens via WhatsApp (formato: +55DDDNÚMERO)
   - **Empresa** — Vincule a uma empresa cadastrada
   - **Cargo** — Posição na empresa
   - **Fonte** — De onde veio o lead (site, indicação, anúncio, etc.)
   - **Status** — Novo, Ativo, Inativo
   - **Notas** — Observações livres sobre o contato
4. Adicione **tags** para segmentação
5. Clique em **"Salvar"**

> O campo WhatsApp é especialmente importante: ele conecta o contato ao canal de comunicação mais usado no Brasil.

## Importação em massa (CSV)

Para importar uma base de contatos existente:

1. Na página de Contatos, clique em **"Importar"**
2. Selecione seu arquivo **CSV** (separado por vírgula ou ponto-e-vírgula)
3. O sistema exibe uma **prévia das colunas** detectadas
4. **Mapeie os campos**: associe cada coluna do CSV a um campo do CRM
   - first_name → Nome
   - last_name → Sobrenome
   - email → E-mail
   - phone → Telefone
   - whatsapp → WhatsApp
5. Revise o mapeamento e clique em **"Confirmar importação"**
6. Acompanhe o progresso na tela (processados, sucesso, erros)

### Dicas para importação

- O arquivo deve ter **cabeçalhos** na primeira linha
- O campo **Nome** é obrigatório — linhas sem nome serão ignoradas
- Formatos de telefone aceitos: (11)99999-9999, 11999999999, +5511999999999
- Se houver erros, o sistema mostrará quais linhas falharam e o motivo
- Contatos com e-mail duplicado podem ser tratados como atualização

⚠️ **Limite**: A importação processa até 1.000 linhas por vez. Para bases maiores, divida em múltiplos arquivos.

## Detalhes do contato

Ao clicar em um contato na lista, você abre a **ficha completa** com:

### Informações pessoais
Todos os dados cadastrais do contato (editáveis a qualquer momento).

### Timeline de atividades
Histórico cronológico completo com:
- 💬 Mensagens de WhatsApp enviadas e recebidas
- ✉️ E-mails enviados e recebidos
- 📸 Interações no Instagram
- 📋 Tarefas vinculadas ao contato
- 🔀 Movimentações no pipeline
- 📝 Notas e observações da equipe
- 🏷️ Tags adicionadas ou removidas
- 🤖 Ações de automações executadas

### Lead Score
Pontuação automática baseada no engajamento do contato (configurável no módulo Lead Scoring).

### Tags
Etiquetas coloridas para segmentação. Você pode adicionar e remover tags diretamente na ficha.

### Deals vinculados
Lista de negócios do pipeline associados ao contato.

[screenshot:Lista de contatos com detalhes|/contacts]

## Filtrando contatos

Use os filtros para encontrar segmentos específicos:

- **Status** — Novo, Ativo, Inativo
- **Tags** — Filtre por uma ou mais tags
- **Empresa** — Contatos de uma empresa específica
- **Fonte** — De onde o lead veio (site, indicação, anúncio)
- **Data** — Criados em um período específico
- **Lead Score** — Acima ou abaixo de uma pontuação

## Ações em massa

Selecione múltiplos contatos na tabela para executar ações em lote:
- Adicionar tag
- Remover tag
- Alterar status
- Excluir contatos

## Boas práticas

- 🏷️ **Use tags** para segmentar contatos desde o início — facilita campanhas futuras
- 📱 **Preencha o WhatsApp** de todos os contatos para aproveitar o canal mais eficiente
- 🔄 **Mantenha dados atualizados** — dados desatualizados prejudicam automações
- 📊 **Monitore o Lead Score** para priorizar contatos com maior potencial
- 🗂️ **Vincule a empresas** quando aplicável (essencial para vendas B2B)

💡 **Dica**: Use tags coloridas para segmentar seus contatos. Isso facilita a criação de campanhas direcionadas e automações personalizadas.`,
  },
  {
    id: 'companies',
    categoryId: 'crm',
    title: 'Cadastro de empresas',
    icon: Building2,
    description: 'Guia completo para organizar empresas, vincular contatos e acompanhar negócios B2B.',
    readTime: '5 min',
    content: `O módulo de Empresas permite organizar seus contatos por organização, essencial para vendas B2B.

[presentation:companies]

## Visão geral

Na página de **Empresas**, você encontra:

- **Tabela de empresas** com nome, domínio, setor, porte e contatos vinculados
- **Busca** por nome ou domínio
- **Botão "Nova Empresa"** para cadastro manual

[screenshot:Página de Empresas|/companies]

## Criando uma empresa

1. Clique em **"Nova Empresa"**
2. Preencha os campos:
   - **Nome** (obrigatório) — Razão social ou nome fantasia
   - **Domínio** — Site da empresa (ex: empresa.com.br)
   - **Setor/Indústria** — Ramo de atuação (tecnologia, saúde, varejo, etc.)
   - **Porte** — Micro, Pequena, Média, Grande
   - **E-mail** — E-mail corporativo principal
   - **Telefone** — Telefone comercial
   - **Endereço** — Endereço físico
   - **Cidade, Estado, País** — Localização
   - **Notas** — Observações internas sobre a empresa
3. Clique em **"Salvar"**

## Vinculando contatos a empresas

Existem duas formas de vincular contatos:

### Na criação/edição do contato
1. Ao criar ou editar um contato, selecione a empresa no campo **"Empresa"**
2. O contato será automaticamente vinculado

### Na página da empresa
1. Abra a empresa desejada
2. Na seção de contatos vinculados, visualize todos os contatos associados
3. Para adicionar novos, edite o contato e selecione esta empresa

## Dados da empresa no CRM

Ao abrir uma empresa, você vê:

- **Informações cadastrais** — Todos os dados preenchidos
- **Contatos vinculados** — Lista de pessoas associadas à empresa
- **Deals ativos** — Negócios em andamento com esta empresa
- **Histórico** — Atividades e interações de todos os contatos da empresa

## Uso em vendas B2B

Em vendas B2B, é comum interagir com múltiplos decisores de uma mesma empresa:

1. Cadastre a empresa com dados completos
2. Vincule todos os contatos (CEO, gerente, comprador, etc.)
3. Crie deals no pipeline vinculados à empresa
4. Acompanhe todas as interações de todos os contatos no histórico

> Uma empresa pode ter múltiplos contatos vinculados e múltiplos deals simultâneos. Isso permite acompanhar o relacionamento completo com a organização.

## Filtrando empresas

Use a barra de busca para encontrar empresas por:
- Nome (parcial ou completo)
- Domínio do site

💡 **Dica**: Preencha o campo "Domínio" com o site da empresa. Isso ajuda na identificação automática e integração com ferramentas externas.`,
  },
  {
    id: 'pipeline',
    categoryId: 'crm',
    title: 'Pipeline de vendas (Kanban)',
    icon: Kanban,
    description: 'Guia completo: criar deals, arrastar entre etapas, filtrar, métricas e boas práticas.',
    readTime: '7 min',
    popular: true,
    content: `O Pipeline é o coração do seu processo de vendas, com visualização Kanban intuitiva para acompanhar cada negociação.

[presentation:pipeline]

## Conceito do Pipeline

O pipeline representa seu **funil de vendas** — o caminho que um lead percorre desde o primeiro contato até o fechamento. Cada coluna representa uma **etapa** do funil, e cada card é um **deal** (negócio/oportunidade).

## Etapas padrão

O pipeline vem com etapas pré-configuradas que você pode personalizar:

- **Novo** → Lead recém-chegado que precisa de qualificação
- **Qualificado** → Lead com fit confirmado, pronto para abordagem
- **Proposta** → Proposta comercial enviada ao lead
- **Negociação** → Em negociação ativa (preço, prazo, condições)
- **Fechado** → Negócio concluído com sucesso (ganho)

[screenshot:Pipeline Kanban com etapas do funil|/pipeline]

## Criando um deal

1. Clique no botão **"+"** na coluna desejada (ou "Novo Deal" no topo)
2. Preencha os campos:
   - **Título** (obrigatório) — Nome descritivo do negócio (ex: "Implementação CRM - Empresa X")
   - **Valor** — Valor monetário do negócio
   - **Moeda** — BRL, USD, EUR, etc.
   - **Contato** — Vincule a um contato do CRM
   - **Empresa** — Vincule a uma empresa
   - **Probabilidade** — Chance de fechamento (0-100%)
   - **Data prevista** — Quando espera fechar o negócio
   - **Notas** — Observações internas
3. Clique em **"Criar"**

> O deal é criado na etapa selecionada e pode ser movido para outras etapas conforme a negociação avança.

## Movendo deals entre etapas

### Arrastar e soltar (drag-and-drop)
- Clique e segure o card do deal
- Arraste para a coluna de destino
- Solte para confirmar a mudança

### Edição manual
- Abra o deal clicando no card
- Altere a etapa no campo "Etapa"
- Salve as alterações

Cada movimentação é **registrada no histórico** do deal e do contato vinculado, criando um rastro completo da jornada.

## Detalhes do deal

Ao clicar em um deal, você vê:

- **Informações do negócio** — Título, valor, etapa, probabilidade, data prevista
- **Contato e empresa vinculados** — Com links para acessar rapidamente
- **Histórico de movimentações** — Quando e por quem o deal foi movido
- **Notas** — Observações da equipe
- **Tarefas vinculadas** — Atividades pendentes para avançar o deal

## Filtros do Pipeline

Use os filtros para visualizar deals específicos:

- **Etapa** — Mostrar apenas deals de uma ou mais etapas
- **Valor** — Faixa de valor (mínimo/máximo)
- **Responsável** — Deals atribuídos a um membro específico
- **Data prevista** — Deals com fechamento previsto em um período
- **Contato/Empresa** — Deals de um contato ou empresa específica
- **Status** — Aberto, ganho, perdido

## Métricas do Pipeline

O pipeline calcula automaticamente:

- **Valor total por etapa** — Soma dos deals em cada coluna
- **Número de deals por etapa** — Quantidade de negócios em cada fase
- **Taxa de conversão** — Percentual de deals que avançam entre etapas
- **Ticket médio** — Valor médio dos deals

Essas métricas também aparecem no **Dashboard** e no **Analytics** para análise mais profunda.

## Boas práticas

- 🔄 **Atualize diariamente** — Mova deals conforme a negociação evolui
- 📝 **Adicione notas** em cada movimentação para registrar o contexto
- 📅 **Defina datas previstas** realistas para previsão de receita
- 🎯 **Use probabilidades** para calcular receita ponderada
- ✅ **Crie tarefas** para cada deal (ex: "Enviar proposta", "Follow-up")
- 🏷️ **Vincule contatos** para manter o histórico completo
- 📊 **Analise gargalos** — Se muitos deals ficam parados em uma etapa, há um problema no processo

⚠️ **Deals parados**: Deals que ficam mais de 7 dias sem movimentação são sinalizados. Configure automações para alertar a equipe quando isso acontecer.

💡 **Dica**: Mantenha o pipeline atualizado movendo os deals conforme a negociação avança. Isso garante métricas precisas no Analytics e previsões de receita confiáveis.`,
  },
  {
    id: 'tags',
    categoryId: 'crm',
    title: 'Usando tags',
    icon: Tags,
    description: 'Guia completo: criar tags coloridas, aplicar a contatos, usar em automações e filtros.',
    readTime: '4 min',
    content: `Tags são etiquetas coloridas que ajudam a organizar, segmentar e automatizar ações com seus contatos.

[presentation:tags]

## O que são Tags?

Tags funcionam como **rótulos** que você aplica aos contatos para categorizá-los. Um contato pode ter múltiplas tags simultaneamente. Exemplos de uso:

- **Interesse**: "interesse-produto-a", "interesse-servico-b"
- **Fase**: "lead-quente", "cliente-ativo", "churn"
- **Origem**: "facebook-ads", "google-ads", "indicacao"
- **Segmento**: "b2b", "b2c", "premium"

## Criando tags

1. Acesse **"Tags"** no menu lateral
2. Clique em **"Nova Tag"**
3. Defina o **nome** da tag (ex: "lead-quente")
4. Escolha uma **cor** para identificação visual
5. Clique em **"Salvar"**

[screenshot:Página de gerenciamento de Tags|/tags]

### Convenções de nomenclatura

Recomendamos usar nomes descritivos e padronizados:
- Use **letras minúsculas** e **hifens** (ex: lead-quente, interesse-crm)
- Agrupe por **prefixos** (ex: origem-facebook, origem-google)
- Evite nomes genéricos (ex: "tag1", "importante")

## Aplicando tags aos contatos

### Manualmente
1. Abra o contato desejado
2. No campo **"Tags"**, clique para adicionar
3. Selecione uma ou mais tags da lista
4. As tags são salvas automaticamente

### Via importação CSV
- Adicione uma coluna "tags" no CSV com os nomes separados por vírgula
- As tags serão criadas automaticamente se não existirem

### Via automações
- Use a ação **"Adicionar Tag"** em automações e flows
- Automatize a segmentação baseada em eventos

## Usando tags em automações

Tags são peças fundamentais nas automações:

### Como gatilho
- **"Tag adicionada"** — Dispare uma automação quando uma tag específica for adicionada a um contato
- **"Tag removida"** — Dispare quando uma tag for removida

### Como ação
- **"Adicionar Tag"** — Aplique tags automaticamente
- **"Remover Tag"** — Remova tags automaticamente

### Como condição
- **"Se tem tag X"** — Ramifique o fluxo baseado na presença de uma tag
- **"Se não tem tag X"** — Condição inversa

### Em filtros de campanhas
- Ao criar campanhas de e-mail ou WhatsApp, filtre destinatários por tags
- Combine múltiplas tags com lógica E/OU

## Usando tags em filtros

Em todas as telas do CRM, você pode filtrar por tags:
- **Contatos** — Filtre a tabela por uma ou mais tags
- **Pipeline** — Veja deals de contatos com tags específicas
- **Campanhas** — Selecione destinatários por tags

## Boas práticas

- 🎨 **Use cores distintas** por categoria (ex: azul para origem, verde para interesse, vermelho para urgência)
- 📋 **Documente o significado** de cada tag para a equipe
- 🔄 **Automatize a aplicação** — Evite depender de marcação manual
- 🗑️ **Limpe tags obsoletas** periodicamente
- 📊 **Analise segmentos** — Tags permitem comparar performance entre grupos

💡 **Dica**: As tags com cores distintas facilitam a identificação visual rápida dos segmentos no CRM. Defina uma paleta de cores padronizada.`,
  },
  {
    id: 'tasks',
    categoryId: 'crm',
    title: 'Tarefas',
    icon: CheckSquare,
    description: 'Guia completo: criar tarefas, prazos, prioridades, calendário e automação de tarefas.',
    readTime: '5 min',
    content: `O módulo de Tarefas permite organizar as atividades da sua equipe com prazos, prioridades e visualização em calendário.

[presentation:tasks]

## Visão geral

Na página de **Tarefas**, você encontra:

- **Lista de tarefas** com filtros por status, prioridade e responsável
- **Visualização em calendário** para planejamento temporal
- **Botão "Nova Tarefa"** para criação manual
- **Contadores** de tarefas pendentes, em progresso e concluídas

[screenshot:Módulo de Tarefas|/tasks]

## Criando uma tarefa

1. Clique em **"Nova Tarefa"**
2. Preencha os campos:
   - **Título** (obrigatório) — Descrição clara da atividade (ex: "Follow-up com João sobre proposta")
   - **Descrição** — Detalhes adicionais sobre o que fazer
   - **Prazo** — Data e hora limite
   - **Prioridade** — Baixa, Média ou Alta
   - **Responsável** — Membro da equipe que executará
3. Opcionalmente vincule a:
   - **Contato** — Para follow-ups e ações relacionadas a leads
   - **Deal** — Para ações necessárias no pipeline
4. Clique em **"Salvar"**

## Status das tarefas

- **Pendente** — Criada mas ainda não iniciada
- **Em progresso** — Sendo executada
- **Concluída** — Finalizada com sucesso
- **Atrasada** — Passou do prazo sem ser concluída (indicador visual vermelho)

## Visualização em calendário

- Alterne entre **Lista** e **Calendário** no topo da página
- No calendário, cada tarefa aparece na data do prazo
- **Cores** indicam a prioridade:
   - 🟢 Verde — Baixa prioridade
   - 🟡 Amarelo — Média prioridade
   - 🔴 Vermelho — Alta prioridade
- **Arraste tarefas** entre datas para reagendar rapidamente

## Vinculando tarefas a contatos e deals

Tarefas vinculadas aparecem:
- Na **timeline do contato** — Equipe vê todas as atividades pendentes
- Na **ficha do deal** — Ações necessárias para avançar o negócio
- Nas **notificações** — Alertas quando o prazo se aproxima

## Automação de tarefas

Crie tarefas automaticamente usando:

### Automações
- Adicione a ação **"Criar Tarefa"** em qualquer automação
- Defina título, prazo e prioridade dinamicamente
- Exemplo: "Quando um deal for movido para 'Proposta', criar tarefa 'Enviar proposta' com prazo de 2 dias"

### Flow Builder
- Adicione o nó **"Criar Tarefa"** em fluxos visuais

### Gatilhos comuns
- Deal parado há mais de X dias → Criar tarefa de follow-up
- Novo contato criado → Criar tarefa de qualificação
- Formulário submetido → Criar tarefa de contato inicial

## Notificações de prazo

O sistema notifica automaticamente:
- 🔔 **24 horas antes** do prazo — Lembrete preventivo
- 🔴 **No vencimento** — Alerta de tarefa vencendo
- ⚠️ **Após o prazo** — Tarefa aparece como atrasada

## Boas práticas

- ✅ **Uma tarefa por ação** — Evite tarefas genéricas como "Fazer follow-up em todos os leads"
- 📅 **Defina prazos realistas** — Tarefas sem prazo tendem a ser esquecidas
- 🎯 **Use prioridades** com critério — Nem tudo é "alta prioridade"
- 🔗 **Vincule a contatos/deals** — Mantém o contexto e facilita o acompanhamento
- 🤖 **Automatize criação** — Tarefas automáticas garantem que nada seja esquecido

💡 **Dica**: Use tarefas com prazos para garantir que nenhum follow-up seja esquecido. A combinação de tarefas + automações cria um sistema à prova de esquecimentos.`,
  },
];
