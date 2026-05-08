/**
 * GUIA DE AUTOMAÇÕES — FONTE ÚNICA DA VERDADE
 * ============================================
 * Este arquivo é a única fonte do guia detalhado de automações exibido na
 * Central de Ajuda. Sempre que uma nova trigger ou action for adicionada ao
 * sistema (em src/pages/Automations.tsx ou em
 * src/components/automations/AutomationActionsEditor.tsx), atualize as listas
 * abaixo (TRIGGER_GUIDES / ACTION_GUIDES). Os artigos da Central de Ajuda são
 * gerados automaticamente a partir destas listas — não há texto duplicado.
 */
import {
  Workflow, Zap, GitBranch, Mail, MessageSquare, Instagram, Phone, Bell,
  Tag, PenLine, Star, TrendingUp, ListPlus, ListMinus, Vote, Shuffle,
  SplitSquareVertical, Clock, UserCheck, Headphones, UserPlus, Globe,
  FileText, MousePointerClick, Eye, FormInput, Trophy, MessageCircle,
  Activity, type LucideIcon, Heart, FileDown
} from 'lucide-react';
import type { HelpArticle, HelpCategory } from './helpCenterData';

export const AUTOMATION_GUIDE_CATEGORY: HelpCategory = {
  id: 'automation-guide',
  title: 'Guia de Automações',
  icon: Workflow,
  description:
    'Manual operacional detalhado de cada gatilho e ação disponível no construtor de automações. Use como referência diária do time.',
};

interface ItemGuide {
  value: string;
  label: string;
  icon: LucideIcon;
  short: string;     // resumo de uma linha
  when: string;      // quando o sistema dispara / quando usar
  inputs: string[];  // o que o usuário precisa configurar
  fields?: string[]; // campos opcionais
  example: string;   // exemplo prático
  tips?: string[];
  caveats?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGERS (gatilhos) — espelha src/pages/Automations.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const TRIGGER_GUIDES: ItemGuide[] = [
  {
    value: 'form_submitted',
    label: 'Formulário Submetido',
    icon: FormInput,
    short: 'Dispara quando um lead envia um formulário publicado.',
    when: 'Sempre que um visitante (logado ou anônimo) clica em "Enviar" em um formulário criado em /forms.',
    inputs: ['Selecione o formulário específico que dispara o fluxo.'],
    fields: ['Todos os campos do formulário ficam disponíveis como variáveis ({{nome}}, {{email}}, {{telefone}}…).'],
    example: 'Form "Lead Magnet — eBook Vendas" → Ação: enviar e-mail com link do material + adicionar tag "lead-ebook".',
    tips: [
      'Use formulários diferentes para cada campanha — facilita medir conversão por origem.',
      'Combine com a ação "Atualizar Lead Score" para qualificar automaticamente.',
    ],
  },
  {
    value: 'tag_added',
    label: 'Tag Adicionada',
    icon: Tag,
    short: 'Dispara quando uma tag específica é adicionada a um contato.',
    when: 'No momento em que a tag entra no contato — manualmente, por importação, por outra automação ou via API.',
    inputs: ['Nome exato da tag de gatilho.'],
    example: 'Tag "Cliente VIP" adicionada → enviar WhatsApp de boas-vindas exclusivo + criar tarefa para o gerente.',
    caveats: ['A remoção da tag NÃO dispara este gatilho. Para isso use uma automação separada com a ação inversa.'],
  },
  {
    value: 'deal_stage_changed',
    label: 'Deal Mudou de Estágio',
    icon: TrendingUp,
    short: 'Dispara quando um negócio é movido entre colunas do Kanban.',
    when: 'Toda vez que o estágio de um deal é alterado (drag-and-drop ou via API).',
    inputs: ['Pipeline de origem.', 'Estágio de destino que dispara o fluxo.'],
    example: 'Deal entra em "Proposta Enviada" → enviar e-mail com a proposta + agendar follow-up em 2 dias.',
    tips: ['Combine com "Criar Tarefa" para que o vendedor receba a próxima ação automaticamente.'],
  },
  {
    value: 'contact_created',
    label: 'Contato Criado',
    icon: UserPlus,
    short: 'Dispara para todo novo contato cadastrado.',
    when: 'Em qualquer criação: import CSV, cadastro manual, formulário, webhook, integração de gateway.',
    inputs: ['Nenhum — opera para qualquer contato novo.'],
    example: 'Novo contato → enviar e-mail de boas-vindas + adicionar à sequência "Onboarding" + atribuir SDR via Round Robin.',
    caveats: ['Cuidado com loops: evite que ações dentro do fluxo criem novos contatos sem condição de parada.'],
  },
  {
    value: 'score_threshold',
    label: 'Score Atingiu Limite',
    icon: Star,
    short: 'Dispara quando o Lead Score do contato cruza um valor.',
    when: 'No exato momento em que a regra de scoring atualiza o score e ele iguala/passa o limite.',
    inputs: ['Valor mínimo de score (ex.: 80).'],
    example: 'Score ≥ 80 → notificar SDR no Inbox + criar deal no estágio "Lead Qualificado".',
    tips: ['Configure regras de scoring em /lead-scoring antes de criar este fluxo.'],
  },
  {
    value: 'email_opened',
    label: 'E-mail Aberto',
    icon: Eye,
    short: 'Dispara quando o destinatário abre um e-mail enviado.',
    when: 'Pixel de tracking confirma a abertura do e-mail (campanha ou transacional).',
    inputs: ['Opcional: filtrar por campanha específica.'],
    example: 'Abriu e-mail "Promoção Black Friday" → enviar WhatsApp com link de checkout em 1h.',
    caveats: ['Apple Mail Privacy Protection pode inflar abertura — use junto a "E-mail Clicado" para qualificar melhor.'],
  },
  {
    value: 'email_clicked',
    label: 'Link Clicado no E-mail',
    icon: MousePointerClick,
    short: 'Dispara quando um link rastreado do e-mail é clicado.',
    when: 'Logo após o clique. Cada link contém um redirect rastreado.',
    inputs: ['Opcional: URL específica do link.'],
    example: 'Clicou no link "Quero saber mais" → adicionar tag "interesse-alto" + iniciar sequência de nutrição.',
  },
  {
    value: 'whatsapp_received',
    label: 'WhatsApp Recebido (palavra-chave)',
    icon: MessageSquare,
    short: 'Dispara quando o contato envia uma mensagem de WhatsApp contendo a palavra/frase.',
    when: 'Mensagem inbound chega via webhook (Evolution API ou Meta Cloud API) e bate com a regra de match.',
    inputs: [
      'Palavra-chave ou frase.',
      'Tipo de match: contém, igual a, começa com, termina com.',
      'Instância de WhatsApp (opcional, para canal específico).',
    ],
    example: 'Mensagem contém "preço" → enviar PDF de tabela + transferir para humano.',
    tips: [
      'Use match "igual a" para palavras curtas evitarem falso positivo.',
      'Combine com chatbot para fluxo conversacional completo.',
    ],
  },
  {
    value: 'instagram_dm',
    label: 'DM Recebida no Instagram',
    icon: Instagram,
    short: 'Dispara quando um seguidor envia DM contendo a palavra-chave.',
    when: 'Webhook do Instagram (Graph API) recebe a mensagem e o match é positivo.',
    inputs: ['Palavra-chave.', 'Tipo de match.'],
    example: 'DM contém "ebook" → enviar link do material via DM (respeita janela de 24h).',
    caveats: [
      'Janela de 24h da Meta: respostas após esse período exigem template aprovado.',
      'Necessário IGSID — só funciona após 1ª interação do contato.',
    ],
  },
  {
    value: 'instagram_comment',
    label: 'Comentário no Instagram',
    icon: MessageCircle,
    short: 'Dispara quando comentam um post com a palavra-chave.',
    when: 'Webhook recebe novo comentário e o texto bate com a regra.',
    inputs: ['Post-alvo (ID ou todos).', 'Palavra-chave.'],
    example: 'Comentário "EU QUERO" no post de lançamento → responder DM com link + adicionar tag "lead-lancamento".',
  },
  {
    value: 'page_visited',
    label: 'Página Visitada no Site',
    icon: Eye,
    short: 'Dispara quando o contato visita uma URL específica.',
    when: 'Site Tracking detecta a visita (script instalado no site).',
    inputs: ['URL ou padrão (ex.: /pricing).'],
    example: 'Visitou /pricing 3x em 7 dias → notificar SDR + criar tarefa "Ligar".',
    tips: ['Combine com "Win Probability" para priorizar leads quentes.'],
  },
  {
    value: 'site_event',
    label: 'Evento no Site',
    icon: Activity,
    short: 'Dispara em evento customizado registrado pela API de tracking.',
    when: 'Evento (ex.: "added_to_cart", "video_75pct") é enviado via track-event.',
    inputs: ['Nome do evento.', 'Filtros opcionais por valor/atributo.'],
    example: 'Evento "abandoned_cart" → enviar WhatsApp em 30min com cupom + sequência de recuperação por e-mail.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS (ações) — espelha src/components/automations/AutomationActionsEditor.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const ACTION_GUIDES: ItemGuide[] = [
  {
    value: 'send_email',
    label: 'Enviar E-mail',
    icon: Mail,
    short: 'Envia um e-mail transacional ou de marketing para o contato do fluxo.',
    when: 'Use para confirmações, nutrição, follow-up e comunicação one-to-one automatizada.',
    inputs: ['Caixa remetente (mailbox).', 'Assunto.', 'Conteúdo HTML/texto (suporta variáveis {{nome}}, etc.).'],
    fields: ['Template visual (Email Template Builder).', 'Anexos.', 'Preview text.'],
    example: 'Após "Formulário Submetido", enviar e-mail com o material prometido em até 30 segundos.',
    tips: ['Use domínio próprio verificado para melhor entregabilidade.'],
  },
  {
    value: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    icon: MessageSquare,
    short: 'Envia mensagem WhatsApp via instância (Evolution API ou Meta Cloud API).',
    when: 'Confirmação de compra, lembrete, recuperação, atendimento ativo.',
    inputs: ['Instância WhatsApp.', 'Texto da mensagem (variáveis suportadas).'],
    fields: ['Mídia (imagem, vídeo, áudio, documento).', 'Botões interativos (Cloud API).', 'Template aprovado (fora de janela 24h).'],
    example: 'Após compra → "Olá {{nome}}, seu pedido #{{order_id}} foi confirmado. Acompanhe em {{link}}."',
    caveats: ['Fora de janela de 24h: obrigatório usar template aprovado pela Meta.'],
  },
  {
    value: 'send_instagram_dm',
    label: 'Enviar DM no Instagram',
    icon: Instagram,
    short: 'Envia mensagem direta para o contato via Graph API.',
    when: 'Resposta automática a comentários, entrega de leads magnet, atendimento.',
    inputs: ['Conta Instagram conectada.', 'Texto da DM.'],
    caveats: ['Necessário IGSID (só após 1ª interação) e respeitar janela de 24h.'],
    example: 'Comentou "QUERO" → DM com link do material em 2s.',
  },
  {
    value: 'send_sms',
    label: 'Enviar SMS',
    icon: Phone,
    short: 'Envia SMS via Zenvia/Twilio (consome créditos de comunicação).',
    when: 'Lembretes urgentes, OTP, confirmação de evento.',
    inputs: ['Texto (até 160 caracteres por segmento).'],
    example: 'Lembrete: "Sua consulta é amanhã às 14h. Confirme respondendo SIM."',
    tips: ['1 SMS = 1 crédito. Acompanhe em /communication-credits.'],
  },
  {
    value: 'send_notification',
    label: 'Notificar Admin',
    icon: Bell,
    short: 'Envia notificação interna para usuários da sua organização.',
    when: 'Alertar equipe sobre lead quente, falha em integração, deal de alto valor.',
    inputs: ['Usuários a notificar.', 'Mensagem.'],
    example: 'Score ≥ 90 → notificar gerente comercial no sininho do sistema.',
  },
  {
    value: 'add_tag',
    label: 'Adicionar Tag',
    icon: Tag,
    short: 'Adiciona uma ou mais tags ao contato.',
    when: 'Segmentar contatos por comportamento, origem ou estágio.',
    inputs: ['Tag(s) a adicionar.'],
    example: 'Abriu 3 e-mails da campanha → tag "engajado-campanha-x".',
  },
  {
    value: 'remove_tag',
    label: 'Remover Tag',
    icon: Tag,
    short: 'Remove tag(s) do contato.',
    when: 'Limpar tags obsoletas, desinscrever de segmento.',
    inputs: ['Tag(s) a remover.'],
    example: 'Comprou produto → remover tag "lead-frio".',
  },
  {
    value: 'set_custom_field',
    label: 'Definir Campo Personalizado',
    icon: PenLine,
    short: 'Atribui valor a um campo customizado do contato.',
    when: 'Persistir dados de comportamento, preferência ou enriquecimento.',
    inputs: ['Campo (criado em /crm-settings).', 'Valor (texto, número, data ou variável).'],
    example: 'Última compra → set "ultima_compra_data" = {{today}}.',
  },
  {
    value: 'update_score',
    label: 'Atualizar Lead Score',
    icon: Star,
    short: 'Soma ou subtrai pontos do score do contato.',
    when: 'Reforçar pontuação dentro de fluxos específicos sem editar regras globais.',
    inputs: ['Operação (somar/subtrair/definir).', 'Valor.'],
    example: 'Visitou /pricing → +20 pontos. Pediu unsubscribe → -50 pontos.',
  },
  {
    value: 'create_deal',
    label: 'Criar Deal no Pipeline',
    icon: TrendingUp,
    short: 'Cria um novo negócio no pipeline de vendas.',
    when: 'Conversão de lead em oportunidade comercial.',
    inputs: ['Pipeline.', 'Estágio inicial.', 'Valor (opcional).', 'Responsável.'],
    example: 'Score atingiu 80 → criar deal no estágio "Qualificado", responsável via Round Robin.',
  },
  {
    value: 'subscribe_sequence',
    label: 'Inscrever em Sequência',
    icon: ListPlus,
    short: 'Inscreve o contato em uma sequência (drip) já configurada.',
    when: 'Iniciar nutrição multi-passos sem replicar lógica no fluxo.',
    inputs: ['Sequência de destino.'],
    example: 'Novo lead → inscrever na sequência "Onboarding 7 dias".',
  },
  {
    value: 'unsubscribe_sequence',
    label: 'Remover de Sequência',
    icon: ListMinus,
    short: 'Cancela a inscrição do contato em uma sequência.',
    when: 'Lead converteu, descadastrou ou trocou de jornada.',
    inputs: ['Sequência a remover.'],
    example: 'Comprou → remover da sequência de carrinho abandonado.',
  },
  {
    value: 'goto_flow',
    label: 'Ir para outro Flow',
    icon: GitBranch,
    short: 'Encaminha a execução para outro fluxo (sub-flow).',
    when: 'Modularizar fluxos grandes, reaproveitar lógica.',
    inputs: ['Fluxo de destino.'],
    example: 'Após qualificação → ir para flow "Agendamento de Reunião".',
    caveats: ['Evite loops circulares — o motor protege com limite, mas pode pausar a execução.'],
  },
  {
    value: 'send_poll',
    label: 'Enviar Enquete',
    icon: Vote,
    short: 'Envia enquete WhatsApp (Evolution API) com opções de resposta.',
    when: 'Pesquisa rápida, qualificação, NPS.',
    inputs: ['Pergunta.', 'Opções (2 a 12).', 'Múltipla escolha (sim/não).'],
    example: '"Como nos avalia?" — opções 1 a 5. Resposta vira tag de NPS.',
  },
  {
    value: 'ab_split',
    label: 'Teste A/B (Split)',
    icon: Shuffle,
    short: 'Divide contatos em variantes (A/B/C…) com pesos configuráveis.',
    when: 'Testar copy, canal, oferta ou jornada.',
    inputs: ['Variantes e percentual de cada (soma 100%).'],
    example: '50% recebe variante A (com desconto) | 50% recebe B (sem desconto). Métrica de conversão decide vencedor.',
  },
  {
    value: 'condition',
    label: 'Condição (Se/Senão)',
    icon: SplitSquareVertical,
    short: 'Bifurca o fluxo segundo regras AND/OR sobre dados do contato.',
    when: 'Personalizar próximo passo de acordo com tags, score, campo, evento.',
    inputs: ['Conjunto de condições (campo, operador, valor).', 'Lógica AND/OR.'],
    example: 'SE tag = "VIP" E score ≥ 80 → enviar oferta premium. SENÃO → fluxo padrão.',
  },
  {
    value: 'wait',
    label: 'Aguardar',
    icon: Clock,
    short: 'Pausa o fluxo por um período antes da próxima ação.',
    when: 'Espaçar mensagens, esperar comportamento, agendar follow-up.',
    inputs: ['Duração (minutos, horas, dias) ou data específica.'],
    example: 'Enviou e-mail → aguardar 2 dias → se não abriu, enviar WhatsApp.',
    tips: ['Esperas longas (>1h) são processadas pelo pg_cron — não há custo adicional.'],
  },
  {
    value: 'assign_agent',
    label: 'Atribuir a Agente',
    icon: UserCheck,
    short: 'Atribui o contato/conversa a um atendente do SAC.',
    when: 'Roteamento de leads quentes para vendedores; distribuição de atendimento.',
    inputs: ['Agente fixo OU regra (Round Robin / Lowest Load).'],
    example: 'Lead com score ≥ 70 → Round Robin entre SDRs do time comercial.',
  },
  {
    value: 'transfer_human',
    label: 'Transferir para Humano',
    icon: Headphones,
    short: 'Encaminha a conversa para a fila do SAC e pausa automações no contato.',
    when: 'Fallback de chatbot, palavra "atendente", caso complexo.',
    inputs: ['Departamento/fila (opcional).', 'Mensagem de transição.'],
    example: 'Bot não entendeu 2x → transferir para humano com mensagem "Vou te conectar a um especialista".',
  },
  {
    value: 'create_task',
    label: 'Criar Tarefa',
    icon: UserPlus,
    short: 'Cria tarefa no módulo /tasks vinculada ao contato/deal.',
    when: 'Garantir follow-up humano, ligar, enviar proposta manual.',
    inputs: ['Título.', 'Responsável.', 'Prazo.', 'Descrição.'],
    example: 'Deal moveu para "Proposta Enviada" → criar tarefa "Ligar em 48h" para responsável do deal.',
  },
  {
    value: 'http_request',
    label: 'Requisição HTTP (Webhook out)',
    icon: Globe,
    short: 'Faz POST/GET para um endpoint externo com payload customizado.',
    when: 'Integrar com sistemas próprios, ERPs, ou serviços sem conector nativo.',
    inputs: ['URL.', 'Método.', 'Headers.', 'Body (JSON com variáveis).'],
    example: 'POST para ERP com dados do deal fechado para gerar nota fiscal.',
    tips: ['Use a aba "Webhooks" para monitorar entregas e retentativas.'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Geração automática dos artigos da Central de Ajuda
// ─────────────────────────────────────────────────────────────────────────────

const renderItem = (item: ItemGuide, kind: 'Gatilho' | 'Ação') => `## ${item.label}

> ${item.short}

**Tipo:** ${kind} • **Identificador técnico:** \`${item.value}\`

### Quando dispara / quando usar
${item.when}

### Configuração obrigatória
${item.inputs.map((i) => `- ${i}`).join('\n')}
${
  item.fields && item.fields.length
    ? `\n### Campos opcionais\n${item.fields.map((f) => `- ${f}`).join('\n')}`
    : ''
}

### Exemplo prático
${item.example}
${
  item.tips && item.tips.length
    ? `\n### Boas práticas\n${item.tips.map((t) => `- ${t}`).join('\n')}`
    : ''
}
${
  item.caveats && item.caveats.length
    ? `\n### Atenção\n${item.caveats.map((c) => `- ${c}`).join('\n')}`
    : ''
}
`;

const overviewArticle: HelpArticle = {
  id: 'automation-guide-overview',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Como funcionam as automações no AG Sell',
  icon: Workflow,
  description:
    'Visão geral do motor de automações: gatilhos, ações, condições, esperas e modo de execução.',
  popular: true,
  readTime: '8 min',
  content: `As **automações** do AG Sell são fluxos visuais que executam ações em contatos quando um **gatilho** acontece. Você cria automações em (/automations) e desenha o fluxo no construtor visual (/flow-builder).

## Anatomia de uma automação

Toda automação tem **três partes**:

1. **Gatilho (Trigger)** — o evento que inicia o fluxo (ex.: "Formulário Submetido", "Tag Adicionada").
2. **Ações (Actions)** — o que será executado em sequência (enviar e-mail, criar deal, aguardar, etc.).
3. **Condições e Esperas** — controlam o caminho que cada contato percorre.

## Como o motor executa

- Quando um gatilho acontece, o sistema cria uma **execução** atrelada ao contato.
- Ações são executadas **em ordem**, uma após a outra.
- Ações de **espera longa** (mais de 1h) são agendadas via \`pg_cron\` e retomam automaticamente.
- **Condições** bifurcam o fluxo em ramos "Sim/Não" com lógica AND/OR.
- **A/B Split** divide contatos em variantes para teste estatístico.
- **Goto Flow** transfere a execução para outro fluxo (sub-flow modular).

## Canais suportados

E-mail, WhatsApp (Evolution API e Meta Cloud), Instagram DM, SMS (Zenvia/Twilio) e notificações internas. Para grupos do WhatsApp use exclusivamente Evolution API — a API oficial não suporta grupos.

## Onde monitorar

- **Linha do tempo do contato** — todos os passos executados aparecem no perfil.
- **/automations-monitor** — falhas e retentativas em tempo real.
- **/flow-analytics** — entradas, saídas e conversão por nó.

## Como baixar este guia em PDF

Você pode baixar a versão completa deste manual operacional clicando no artigo **"Baixar Guia em PDF"** na barra lateral. O arquivo é gerado com a logo da **AG Sell** e formatado para consulta rápida.

## Como manter este guia atualizado

> Este guia é gerado a partir de um único arquivo: \`src/data/automationGuide.ts\`. Sempre que um gatilho ou ação é adicionado ou alterado no sistema, basta atualizar a lista nesse arquivo e os artigos são regerados automaticamente.

## Próximos artigos

- **Catálogo de Gatilhos** — referência completa dos ${TRIGGER_GUIDES.length} gatilhos disponíveis.
- **Catálogo de Ações** — referência completa das ${ACTION_GUIDES.length} ações disponíveis.
- **Receitas prontas** — fluxos campeões para colar e adaptar.
`,
};

const triggersArticle: HelpArticle = {
  id: 'automation-guide-triggers',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: `Catálogo de Gatilhos (${TRIGGER_GUIDES.length})`,
  icon: Zap,
  description: 'Referência detalhada de cada gatilho: quando dispara, o que configurar, exemplos e cuidados.',
  popular: true,
  readTime: '15 min',
  content: `Esta é a referência completa dos gatilhos disponíveis. Cada gatilho mostra **quando dispara**, **o que configurar**, **exemplo prático**, **boas práticas** e **cuidados**.

${TRIGGER_GUIDES.map((t) => renderItem(t, 'Gatilho')).join('\n---\n\n')}
`,
};

const actionsArticle: HelpArticle = {
  id: 'automation-guide-actions',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: `Catálogo de Ações (${ACTION_GUIDES.length})`,
  icon: Workflow,
  description: 'Referência detalhada de cada ação executável dentro de um fluxo de automação.',
  popular: true,
  readTime: '20 min',
  content: `Esta é a referência completa das ações que podem ser usadas em qualquer fluxo. Cada ação inclui **quando usar**, **configuração obrigatória**, **exemplo** e **dicas**.

${ACTION_GUIDES.map((a) => renderItem(a, 'Ação')).join('\n---\n\n')}
`,
};

const recipesArticle: HelpArticle = {
  id: 'automation-guide-recipes',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Receitas prontas de automação',
  icon: Trophy,
  description: 'Fluxos consagrados (lead magnet, carrinho abandonado, NPS, recuperação) prontos para usar.',
  readTime: '10 min',
  content: `Receitas testadas em produção. Use como ponto de partida e ajuste textos/tempos.

## 1. Entrega de Lead Magnet (eBook / Aula)
**Gatilho:** Formulário Submetido (form do lead magnet)
1. Enviar e-mail com link do material.
2. Adicionar tag \`lead-{nome-do-material}\`.
3. Aguardar 2 dias.
4. Condição: abriu o e-mail?
   - **Sim:** inscrever em sequência de nutrição.
   - **Não:** enviar WhatsApp lembrando do material.

## 2. Carrinho Abandonado
**Gatilho:** Evento no Site \`abandoned_cart\`
1. Aguardar 30 minutos.
2. Enviar WhatsApp: "Esqueceu algo? Seu desconto exclusivo: {{cupom}}".
3. Aguardar 24h.
4. Condição: comprou?
   - **Sim:** remover da sequência.
   - **Não:** enviar e-mail final com urgência (24h restantes).

## 3. Qualificação por Score
**Gatilho:** Score Atingiu Limite (≥ 80)
1. Criar deal no pipeline "Vendas" → estágio "Qualificado".
2. Atribuir vendedor via Round Robin.
3. Notificar admin: "Lead quente: {{nome}}".
4. Criar tarefa: "Ligar em 24h".

## 4. NPS pós-compra
**Gatilho:** Tag Adicionada \`pedido-entregue\`
1. Aguardar 3 dias.
2. Enviar enquete WhatsApp: "Como avalia sua compra? 1 a 5".
3. Condição na resposta:
   - **9-10:** tag "promotor" + pedir review público.
   - **7-8:** tag "neutro".
   - **≤6:** tag "detrator" + transferir para humano (CS).

## 5. Reativação de Inativos
**Gatilho:** Tag Adicionada \`inativo-90d\` (via job de scoring)
1. Enviar e-mail: "Sentimos sua falta — cupom de 15%".
2. Aguardar 5 dias.
3. Condição: clicou?
   - **Não:** enviar WhatsApp + remover de listas marketing.
   - **Sim:** remover tag inativo + somar +30 ao score.
`,
};

const checklistArticle: HelpArticle = {
  id: 'automation-guide-checklist',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Checklist antes de ativar uma automação',
  icon: FileText,
  description: 'Lista de verificação operacional para evitar erros antes de ligar o fluxo em produção.',
  readTime: '4 min',
  content: `Antes de **ativar** qualquer automação em produção, valide:

## 1. Gatilho
- [ ] O evento de gatilho realmente acontece (testar manualmente).
- [ ] Filtros (palavra-chave, formulário, score) estão corretos.

## 2. Conteúdo das mensagens
- [ ] Variáveis (\`{{nome}}\`, \`{{email}}\`, etc.) estão grafadas exatamente.
- [ ] Textos foram revisados (ortografia, tom, links).
- [ ] Imagens/anexos abrem corretamente.

## 3. Canais
- [ ] Instância WhatsApp está conectada (status "ativo").
- [ ] Domínio de e-mail está verificado.
- [ ] Instagram tem permissões corretas (Live Mode + escopos).
- [ ] Créditos de SMS/VoIP suficientes.

## 4. Lógica
- [ ] Esperas (\`wait\`) têm duração realista — não enviar 5 mensagens em 1 minuto.
- [ ] Condições cobrem o caminho "senão".
- [ ] Não há loops infinitos (fluxo que dispara a si mesmo).

## 5. Compliance
- [ ] Mensagens de marketing têm opção de descadastro.
- [ ] Janela de 24h respeitada (WhatsApp/Instagram fora da janela exige template).
- [ ] LGPD: dados sensíveis não vazam em logs/HTTP request.

## 6. Teste
- [ ] Disparou em contato de teste e percorreu o fluxo inteiro.
- [ ] Conferiu /automations-monitor: nenhuma falha.
- [ ] Conferiu /flow-analytics: contagem de entradas bate.

Só então **ative** o fluxo para todos.
`,
};

export const AUTOMATION_GUIDE_ARTICLES: HelpArticle[] = [
  overviewArticle,
  triggersArticle,
  actionsArticle,
  recipesArticle,
  checklistArticle,
];
