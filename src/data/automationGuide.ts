/**
 * GUIA DE AUTOMAÇÕES — FONTE ÚNICA DA VERDADE
 * ============================================
 */
import {
  Workflow, Zap, GitBranch, Mail, MessageSquare, Instagram, Phone, Bell,
  Tag, PenLine, Star, TrendingUp, ListPlus, ListMinus, Vote, Shuffle,
  SplitSquareVertical, Clock, UserCheck, Headphones, UserPlus, Globe,
  FileText, MousePointerClick, Eye, FormInput, Trophy, MessageCircle,
  Activity, type LucideIcon, Heart, FileDown
} from 'lucide-react';
import type { HelpArticle, HelpCategory } from '@/types/help';

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
  short: string;
  when: string;
  howToConfigure: string[]; // Passo a passo detalhado
  inputs: string[];
  fields?: string[];
  example: string;
  tips?: string[];
  caveats?: string[];
}

export const TRIGGER_GUIDES: ItemGuide[] = [
  {
    value: 'form_submitted',
    label: 'Formulário Submetido',
    icon: FormInput,
    short: 'Captura leads em tempo real através de formulários nativos ou integrados.',
    when: 'Este gatilho é acionado imediatamente após a submissão bem-sucedida de um formulário. O motor de eventos identifica o `form_id` e cruza com as regras de automação ativas.',
    howToConfigure: [
      'Acesse o Construtor de Automações.',
      'Selecione "Adicionar Gatilho" e escolha "Formulário Submetido".',
      'No painel lateral, selecione o formulário específico que deseja monitorar.',
      'Verifique em Configurações > Formulários se os campos estão mapeados corretamente para as colunas do CRM.'
    ],
    inputs: [
      '**Formulário:** Selecione o formulário específico na lista.',
      '**Filtro de Reentrada:** Defina se o lead pode entrar no fluxo várias vezes.'
    ],
    fields: [
      'Variáveis disponíveis: `{{form_name}}`, `{{submission_id}}`, `{{utm_source}}`, `{{utm_campaign}}`.'
    ],
    example: 'Lead preenche o formulário de "Solicitação de Orçamento". A automação identifica o valor, adiciona a tag "Fundo de Funil" e cria um negócio.',
    tips: [
      'Use UTMs para saber qual anúncio gerou o lead.',
      'Combine com a ação "Aguardar" para um toque mais humano.'
    ],
    caveats: [
      'Para formulários externos (ex: Typeform), use Webhook de Entrada.'
    ],
  },
  {
    value: 'tag_added',
    label: 'Tag Adicionada',
    icon: Tag,
    short: 'Automação baseada em segmentação e eventos manuais.',
    when: 'Dispara quando o objeto "Contato" recebe uma nova etiqueta, seja manualmente, via API ou outra automação.',
    howToConfigure: [
      'Selecione o gatilho "Tag Adicionada".',
      'Digite ou selecione a tag exata que servirá de gatilho.',
      'Defina se o fluxo deve rodar toda vez ou apenas na primeira vez que a tag for adicionada.'
    ],
    inputs: [
      '**Tag Gatilho:** A etiqueta que ativará o fluxo.',
      '**Execução Única:** Sim/Não.'
    ],
    example: 'Vendedor marca contato com "PAGAMENTO-APROVADO". Sistema envia instruções de acesso automaticamente.',
    tips: [
      'Use prefixos como `TRG-` para identificar tags que disparam fluxos.',
      'Use tags de controle para evitar duplicidade de envio.'
    ],
    caveats: [
      'Remover a tag não ativa este gatilho.'
    ],
  },
  {
    value: 'deal_stage_changed',
    label: 'Negócio Mudou de Estágio',
    icon: TrendingUp,
    short: 'Gatilho de progresso no funil de vendas.',
    when: 'Ocorre no momento do "drop" do card no Kanban de vendas.',
    howToConfigure: [
      'Selecione o funil (Pipeline) desejado.',
      'Opcionalmente, defina um estágio de origem.',
      'Defina o estágio de destino que ativa a automação.'
    ],
    inputs: [
      '**Pipeline:** Selecione o funil específico.',
      '**Estágio de Destino:** A coluna que dispara a ação.'
    ],
    example: 'Deal movido para "Contrato Enviado". Envia e-mail automático com link do contrato.',
    tips: [
      'Automatize tarefas burocráticas entre estágios para ganhar agilidade.',
      'Notifique o gestor em casos de movimentação para estágios críticos.'
    ],
    caveats: [
      'Evite loops onde a ação move o deal de volta para o estágio gatilho.'
    ],
  },
  {
    value: 'whatsapp_received',
    label: 'WhatsApp Recebido',
    icon: MessageSquare,
    short: 'Criação de menus e respostas automáticas (Chatbot).',
    when: 'Dispara quando uma mensagem chega ao WhatsApp e contém termos configurados.',
    howToConfigure: [
      'Insira as palavras-chave separadas por vírgula.',
      'Selecione o tipo de correspondência (Exata, Contém, Inicia com).',
      'Defina se vale para todas as instâncias ou uma específica.'
    ],
    inputs: [
      '**Palavra-chave:** Termo que o sistema deve buscar.',
      '**Tipo de Match:** Como o sistema valida o texto.'
    ],
    example: 'Cliente envia "MENU". Sistema responde com opções numeradas.',
    tips: [
      'Sempre ofereça uma opção para falar com humano.',
      'Use palavras simples para facilitar a interação.'
    ],
    caveats: [
      'Áudios não ativam este gatilho de texto.'
    ],
  },
];

export const ACTION_GUIDES: ItemGuide[] = [
  {
    value: 'send_email',
    label: 'Enviar E-mail',
    icon: Mail,
    short: 'Comunicação direta via SMTP ou Provedor.',
    when: 'Envio de materiais, confirmações, newsletters e réguas de nutrição.',
    howToConfigure: [
      'Selecione a conta de remetente configurada.',
      'Defina o assunto (use `{{nome}}` para personalizar).',
      'Escolha um template salvo ou crie o conteúdo no editor.',
      'Configure rastreamento de cliques se desejar.'
    ],
    inputs: [
      '**Remetente:** Conta de envio.',
      '**Assunto:** Título da mensagem.',
      '**Conteúdo:** Corpo do e-mail.'
    ],
    example: 'Enviar boas-vindas com cupom 5 min após o cadastro.',
    tips: [
      'Teste o envio para si mesmo antes de ativar.',
      'Evite excesso de imagens para não cair no SPAM.'
    ],
    caveats: [
      'Requer domínio verificado (SPF/DKIM).'
    ],
  },
  {
    value: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    icon: MessageSquare,
    short: 'Mensagens instantâneas para alta taxa de abertura.',
    when: 'Alertas urgentes, lembretes e vendas rápidas.',
    howToConfigure: [
      'Selecione a instância conectada.',
      'Escreva a mensagem (use emojis e variáveis).',
      'Adicione mídias (imagens, PDFs) se necessário.',
      'Use Templates se estiver fora da janela de 24h (API Oficial).'
    ],
    inputs: [
      '**Instância:** Número que enviará a mensagem.',
      '**Mensagem:** Texto da conversa.'
    ],
    example: 'Enviar lembrete de reunião 30 min antes do horário.',
    tips: [
      'Humanize a abordagem para evitar bloqueios.',
      'Use variáveis para não parecer uma mensagem em massa fria.'
    ],
    caveats: [
      'Respeite a janela de 24h da Meta para evitar custos extras ou falhas.'
    ],
  },
  {
    value: 'wait',
    label: 'Aguardar (Timer)',
    icon: Clock,
    short: 'Controle de cadência e timing do fluxo.',
    when: 'Dar espaço entre mensagens para uma jornada natural.',
    howToConfigure: [
      'Defina a duração da espera.',
      'Opcionalmente, restrinja o horário de saída (ex: "Aguardar até às 09:00").'
    ],
    inputs: [
      '**Duração:** Tempo de espera.',
      '**Janela de Saída:** Horário permitido para prosseguir.'
    ],
    example: 'Envia E-mail 1 -> Aguarda 2 dias -> Envia WhatsApp.',
    tips: [
      'Evite intervalos muito curtos entre canais diferentes.'
    ],
  },
];

const renderItem = (item: ItemGuide, kind: 'Gatilho' | 'Ação') => `## ${item.label}

> ${item.short}

**Tipo:** ${kind} • **Identificador técnico:** \`${item.value}\`

### Quando dispara / quando usar
${item.when}

### Como configurar passo a passo
${item.howToConfigure.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

### Campos de configuração
${item.inputs.map((i) => `- ${i}`).join('\n')}
${
  item.fields && item.fields.length
    ? `\n### Campos opcionais e Variáveis\n${item.fields.map((f) => `- ${f}`).join('\n')}`
    : ''
}

### Exemplo prático de uso
${item.example}

### Dicas e Boas práticas
${item.tips?.map((t) => `- ${t}`).join('\n')}

${
  item.caveats && item.caveats.length
    ? `### ⚠️ Atenção e Restrições\n${item.caveats.map((c) => `- ${c}`).join('\n')}`
    : ''
}
`;

const overviewArticle: HelpArticle = {
  id: 'automation-guide-overview',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Manual de Automação AG Sell',
  icon: Workflow,
  description: 'Documentação técnica e operacional completa do motor de fluxos.',
  popular: true,
  readTime: '12 min',
  content: `O AG Sell utiliza um motor de automação de eventos assíncronos. Este guia detalha cada componente.

## Arquitetura do Motor
1. **Trigger Engine:** Monitora eventos em tempo real.
2. **Worker Pool:** Processa ações em paralelo.
3. **Scheduler:** Gerencia esperas e agendamentos.

## Componentes
- **Gatilhos:** Pontos de entrada.
- **Ações:** Tarefas executadas.
- **Condições:** Lógica de decisão.
`,
};

const triggersArticle: HelpArticle = {
  id: 'automation-guide-triggers',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: `Catálogo de Gatilhos`,
  icon: Zap,
  description: 'Referência detalhada de cada gatilho disponível.',
  popular: true,
  readTime: '15 min',
  content: `${TRIGGER_GUIDES.map((t) => renderItem(t, 'Gatilho')).join('\n---\n\n')}`,
};

const actionsArticle: HelpArticle = {
  id: 'automation-guide-actions',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: `Catálogo de Ações`,
  icon: Workflow,
  description: 'Referência detalhada de cada ação executável.',
  popular: true,
  readTime: '20 min',
  content: `${ACTION_GUIDES.map((a) => renderItem(a, 'Ação')).join('\n---\n\n')}`,
};

const recipesArticle: HelpArticle = {
  id: 'automation-guide-recipes',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Receitas prontas',
  icon: Trophy,
  description: 'Fluxos consagrados prontos para usar.',
  readTime: '10 min',
  content: `## 1. Entrega de Lead Magnet
1. Gatilho: Form Submetido.
2. Ação: Enviar E-mail com link.
3. Ação: Adicionar Tag.
`,
};

const checklistArticle: HelpArticle = {
  id: 'automation-guide-checklist',
  categoryId: AUTOMATION_GUIDE_CATEGORY.id,
  title: 'Checklist de Ativação',
  icon: ListChecks,
  description: 'O que verificar antes de colocar um fluxo no ar.',
  readTime: '5 min',
  content: `## Antes de Ativar
- [ ] Testou manualmente?
- [ ] Variáveis estão corretas?
- [ ] Canais estão conectados?
`,
};

export const AUTOMATION_GUIDE_ARTICLES: HelpArticle[] = [
  overviewArticle,
  triggersArticle,
  actionsArticle,
  recipesArticle,
  checklistArticle,
];
