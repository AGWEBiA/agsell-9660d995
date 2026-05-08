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
    short: 'Gatilho de entrada via captura direta em páginas ou pop-ups.',
    when: 'Este gatilho é acionado no exato momento em que um lead clica no botão de submissão de qualquer formulário nativo do AG Sell ou integrado via SDK.',
    inputs: [
      'Selecione o formulário: Escolha na lista de formulários ativos.',
      'Mapeamento de Campos: Certifique-se de que os campos do formulário (nome, email, etc) estão mapeados para os campos correspondentes no CRM.',
      'Double Opt-in: Defina se este formulário exige confirmação de e-mail antes de seguir o fluxo.'
    ],
    fields: [
      'ID do Formulário: {{form_id}}',
      'URL da Origem: {{source_url}}',
      'Dados de UTM: {{utm_source}}, {{utm_medium}}, {{utm_campaign}}',
      'Campos Personalizados: Todos os inputs do form ficam disponíveis como variáveis globais.'
    ],
    example: 'Um lead converte no formulário "Ebook Vendas 2024". O sistema captura o e-mail, verifica se ele já existe no CRM, atualiza os dados e dispara uma sequência de nutrição imediata.',
    tips: [
      'Sempre use UTMs nos links de seus formulários para saber exatamente qual anúncio gerou o lead.',
      'Configure um redirecionamento de "Obrigado" no próprio formulário para melhorar a experiência do usuário.',
      'Use a variável {{source_url}} em condições para tratar leads que vem de páginas diferentes usando o mesmo formulário.'
    ],
    caveats: [
      'Se o mapeamento de campos estiver incorreto, os dados serão salvos como "Nota" no contato e não nos campos estruturados.',
      'Formulários externos (Typeform, WPForms) requerem integração via Webhook Inbound e não usam este gatilho nativo.'
    ],
  },
  {
    value: 'tag_added',
    label: 'Tag Adicionada',
    icon: Tag,
    short: 'Gatilho reativo para segmentação e micro-automações.',
    when: 'Dispara quando uma tag específica é aplicada a um contato. Isso pode ocorrer manualmente por um operador, via importação de planilha, por outra automação ou via requisição de API externa.',
    inputs: [
      'Tag Alvo: Escolha ou digite a tag que servirá de gatilho.',
      'Execução Única: Defina se o fluxo deve rodar toda vez que a tag for adicionada ou apenas na primeira vez.'
    ],
    example: 'O vendedor adiciona a tag "Interesse-Imóvel-Luxo" manualmente no CRM. O sistema imediatamente envia um catálogo em PDF via WhatsApp e notifica o gerente regional.',
    tips: [
      'Crie um padrão de nomenclatura para tags (ex: [STATUS] Pago, [ORIGEM] Facebook) para evitar confusão.',
      'Use tags de controle para evitar que um lead entre no mesmo fluxo várias vezes se não for desejado.'
    ],
    caveats: [
      'A remoção de uma tag NÃO ativa este fluxo.',
      'Tags adicionadas em massa (acima de 10.000 contatos) podem ter um pequeno delay no processamento do gatilho.'
    ],
  },
  {
    value: 'deal_stage_changed',
    label: 'Negócio Mudou de Estágio',
    icon: TrendingUp,
    short: 'Gatilho de movimentação de funil de vendas.',
    when: 'Disparado quando um "Deal" (Negócio) é movido de uma coluna para outra dentro do Kanban de vendas.',
    inputs: [
      'Pipeline: Selecione o funil de vendas desejado.',
      'Estágio de Origem (Opcional): Só dispara se vier de um estágio específico.',
      'Estágio de Destino: O estágio que ativa a automação.'
    ],
    example: 'O deal é movido para "Contrato Enviado". A automação envia um e-mail com o link do DocuSign e cria uma tarefa para o vendedor cobrar o cliente em 48 horas.',
    tips: [
      'Use este gatilho para automatizar tarefas administrativas burocráticas entre estágios.',
      'Mova o deal para um estágio de "Perdido" e dispare uma automação de reativação para daqui a 6 meses.'
    ],
    caveats: [
      'Movimentações via API também disparam este gatilho.',
      'Evite ações que movam o próprio deal para outro estágio dentro do mesmo fluxo, pois isso pode gerar loops infinitos.'
    ],
  },
  {
    value: 'score_threshold',
    label: 'Score Atingiu Limite',
    icon: Star,
    short: 'Gatilho de qualificação automática (Lead Scoring).',
    when: 'Ativado quando o sistema de pontuação (Lead Scoring) recalcula o valor de um contato e ele ultrapassa ou iguala o limite definido.',
    inputs: [
      'Limite de Pontuação: Valor numérico (ex: 100).',
      'Direção: Acima de, Abaixo de, ou Exatamente.'
    ],
    example: 'Um lead abre 5 e-mails e visita a página de preços 3 vezes. Seu score chega a 150 pontos. O sistema cria um Deal qualificado e notifica o SDR.',
    tips: [
      'Defina pontuações negativas para comportamentos de desinteresse (ex: página de "Trabalhe Conosco").',
      'Revise seus critérios de pontuação trimestralmente para garantir que o "Lead Quente" realmente está no momento de compra.'
    ],
    caveats: [
      'O gatilho só dispara na transição. Se o lead já tinha 100 pontos e ganha mais 10, o gatilho "Score Atingiu 100" não disparará novamente.'
    ],
  },
  {
    value: 'whatsapp_received',
    label: 'WhatsApp Recebido (Chatbot)',
    icon: MessageSquare,
    short: 'Gatilho de resposta automática para atendimento e vendas.',
    when: 'Dispara quando uma mensagem chega ao seu WhatsApp conectado e contém palavras ou frases que batem com sua configuração.',
    inputs: [
      'Palavra-chave/Frase: O texto que o sistema deve procurar.',
      'Tipo de Correspondência: Igual a, Contém, Começa com, ou Expressão Regular.',
      'Sensibilidade: Diferenciar maiúsculas/minúsculas (Opcional).'
    ],
    example: 'O cliente envia "Quero falar com um atendente". O sistema reconhece a frase, envia uma mensagem de "Aguarde um momento" e transfere a conversa para o SAC humano.',
    tips: [
      'Use "Contém" para frases naturais e "Igual a" para menus numéricos (ex: Digite 1 para Vendas).',
      'Sempre ofereça uma opção de saída para falar com um humano para evitar frustração.'
    ],
    caveats: [
      'Mensagens de áudio ou imagem não ativam este gatilho de texto.',
      'Cuidado com palavras muito comuns que podem causar disparos indesejados.'
    ],
  },
  {
    value: 'page_visited',
    label: 'Página Visitada (Site Tracking)',
    icon: Eye,
    short: 'Gatilho de intenção de compra via navegação.',
    when: 'Ativado quando um contato identificado (que já converteu em algum form ou clicou em e-mail) visita uma URL específica do seu site monitorado.',
    inputs: [
      'URL ou Padrão: Endereço completo ou parte dele (ex: /checkout).',
      'Tempo de Permanência: Só dispara se o lead ficar mais de X segundos (Opcional).'
    ],
    example: 'Um lead antigo visita a página "Nossos Planos". O sistema identifica o interesse, envia uma notificação para o vendedor e marca o contato com a tag "Intenção de Compra".',
    tips: [
      'Monitore páginas de checkout para identificar desistências antes mesmo do abandono de carrinho.',
      'Não use para todas as páginas do site, apenas para as que demonstram intenção clara.'
    ],
    caveats: [
      'Só funciona para contatos já conhecidos pelo sistema (identificados via cookie).',
      'Requer o script de Site Tracking instalado corretamente no cabeçalho do seu site.'
    ],
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
    short: 'Comunicação direta via SMTP ou Provedor de E-mail.',
    when: 'Ideal para envio de materiais ricos, confirmações de pedidos, newsletters e réguas de relacionamento de longo prazo.',
    inputs: [
      'Remetente: Selecione uma de suas contas de e-mail conectadas.',
      'Assunto: Use variáveis para personalização (ex: "Olá {{nome}}, aqui está seu guia").',
      'Corpo do E-mail: Editor Visual (Drag & Drop) ou HTML Customizado.'
    ],
    fields: [
      'Anexos: Envio de PDFs, imagens ou docs.',
      'Tempo de Disparo: Imediato ou agendado.',
      'Tracking de Abertura/Clique: Ative para gerar gatilhos posteriores.'
    ],
    example: 'Enviar um e-mail de boas-vindas com um cupom de desconto 5 minutos após o lead se cadastrar na newsletter.',
    tips: [
      'Sempre envie um e-mail de teste para você mesmo antes de ativar.',
      'Evite muitas imagens pesadas para não cair na aba de Promoções do Gmail.',
      'Use o campo "Preview Text" para aumentar sua taxa de abertura.'
    ],
    caveats: [
      'Se o seu domínio não tiver SPF/DKIM configurados, seus e-mails podem ir para o SPAM.',
      'O limite de envios diários depende do seu provedor (Google, Outlook, Amazon SES).'
    ],
  },
  {
    value: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    icon: MessageSquare,
    short: 'Mensagens instantâneas via Evolution API ou Meta Cloud.',
    when: 'Use para comunicações que exigem leitura imediata, como alertas de segurança, lembretes de reunião ou vendas rápidas.',
    inputs: [
      'Instância: Selecione o número de WhatsApp conectado.',
      'Mensagem: Texto plano com suporte a variáveis e emojis.',
      'Mídia: Envie imagens, áudios ou documentos junto com o texto.'
    ],
    fields: [
      'Botões de Resposta: Botões clicáveis para o cliente responder rápido (Apenas Meta Cloud).',
      'Template: Use templates aprovados pela Meta para envios fora da janela de 24h.'
    ],
    example: 'Enviar uma mensagem: "Olá {{nome}}, notamos que você não concluiu sua compra. Posso te ajudar?" 15 minutos após o abandono de carrinho.',
    tips: [
      'Não envie mensagens em massa para quem não te deu permissão, ou seu número será banido.',
      'Humanize a mensagem. Use variáveis como {{nome}} e evite textos muito robóticos.'
    ],
    caveats: [
      'O WhatsApp tem uma "janela de 24h". Após isso, você só pode iniciar conversa usando Templates Pagos.',
      'Mensagens enviadas via API oficial tem custo por conversão (taxa da Meta).'
    ],
  },
  {
    value: 'add_tag',
    label: 'Adicionar Tag',
    icon: Tag,
    short: 'Organização e segmentação de banco de dados.',
    when: 'Essencial para marcar o comportamento do lead e filtrar listas para campanhas futuras.',
    inputs: [
      'Tags: Lista de uma ou mais tags a serem aplicadas.'
    ],
    example: 'Adicionar a tag "Lead-Qualificado" assim que o lead preencher o formulário de orçamento.',
    tips: [
      'Use esta ação para "limpar" o lead de fluxos antigos (ex: adicionar tag "Cliente" e usar isso como condição de saída de fluxos de Prospecção).'
    ],
    caveats: [
      'Tags duplicadas não são criadas, o sistema apenas ignora se o contato já possuir a tag.'
    ],
  },
  {
    value: 'create_deal',
    label: 'Criar Negócio (Deal)',
    icon: TrendingUp,
    short: 'Integração direta entre Marketing e Vendas.',
    when: 'Transforme leads frios em oportunidades reais no seu funil de vendas automaticamente.',
    inputs: [
      'Funil (Pipeline): Selecione em qual processo o negócio será criado.',
      'Estágio: Em qual coluna o card deve aparecer.',
      'Título do Negócio: Use variáveis (ex: "Oportunidade - {{nome}}").',
      'Valor Estimado: Defina um valor padrão ou capture de um campo do formulário.'
    ],
    example: 'Lead qualificado via Score ou Formulário → Criar Deal no estágio "Triagem" e atribuir ao vendedor da vez (Round Robin).',
    tips: [
      'Atribua o deal automaticamente usando a lógica de Round Robin para garantir distribuição justa entre vendedores.'
    ],
    caveats: [
      'Certifique-se de que o contato já possui um telefone ou e-mail válido para o vendedor conseguir entrar em contato.'
    ],
  },
  {
    value: 'wait',
    label: 'Aguardar (Timer)',
    icon: Clock,
    short: 'Controle de cadência e timing do fluxo.',
    when: 'Use para dar "espaço" entre as mensagens e não parecer um robô desesperado.',
    inputs: [
      'Duração: Minutos, Horas ou Dias.',
      'Horário de Brasília: Defina se a automação deve esperar até um horário específico do dia (ex: Próximo dia útil às 09:00).'
    ],
    example: 'Lead se cadastrou → Enviar e-mail agora → **Aguardar 2 dias** → Enviar WhatsApp de acompanhamento.',
    tips: [
      'Evite esperas muito curtas (menos de 5 min) se estiver enviando mensagens sequenciais em canais diferentes.'
    ],
  },
  {
    value: 'condition',
    label: 'Condição (IF/ELSE)',
    icon: SplitSquareVertical,
    short: 'Inteligência e caminhos personalizados.',
    when: 'Crie ramificações no fluxo baseadas em dados reais do contato ou comportamento nas etapas anteriores.',
    inputs: [
      'Regra: Campo do Contato, Tag, Score ou Evento.',
      'Operador: Igual a, Diferente de, Contém, Maior que, etc.',
      'Valor de Comparação: O que o sistema deve validar.'
    ],
    example: 'SE o lead possui a tag "VIP", envie o desconto de 30%. SENÃO, envie o desconto de 10%.',
    tips: [
      'Você pode empilhar várias condições usando lógica E (AND) ou OU (OR).',
      'Use condições para verificar se o lead já comprou antes de enviar um e-mail de oferta, evitando SPAM.'
    ],
  },
  {
    value: 'http_request',
    label: 'Webhook de Saída (HTTP Request)',
    icon: Globe,
    short: 'Conectividade total com o mundo externo.',
    when: 'Envie dados para o seu ERP, Google Sheets (via Zapier/Make), Sistema de Notas Fiscais ou qualquer API externa.',
    inputs: [
      'URL do Endpoint: O endereço que receberá os dados.',
      'Método: POST, GET, PUT ou DELETE.',
      'Headers: Cabeçalhos de autenticação (ex: Authorization Bearer).',
      'JSON Body: O conteúdo dos dados que você quer enviar.'
    ],
    example: 'Ao fechar uma venda (Deal Ganho), disparar um Webhook para o seu sistema interno de logística para liberar o produto.',
    tips: [
      'Use ferramentas como Webhook.site para testar o que sua automação está enviando antes de conectar ao sistema final.'
    ],
    caveats: [
      'O sistema aguarda até 10 segundos pela resposta da sua API. Se demorar mais, será considerado timeout.'
    ],
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
  title: 'Manual de Automação AG Sell',
  icon: Workflow,
  description:
    'Documentação técnica e operacional completa do motor de fluxos e inteligência comercial.',
  popular: true,
  readTime: '12 min',
  content: `O **AG Sell** utiliza um motor de automação de eventos assíncronos que permite escalar o atendimento e as vendas sem aumentar a equipe. Este guia detalha cada componente para que você configure fluxos à prova de erros.

## Arquitetura do Motor de Fluxos

Diferente de sistemas simples, o AG Sell separa a **Lógica** da **Execução**:
1. **Trigger Engine:** Monitora em tempo real eventos no banco de dados e webhooks externos.
2. **Worker Pool:** Processa as ações em paralelo para garantir que milhares de contatos possam estar em fluxos simultâneos sem latência.
3. **Scheduler (pg_cron):** Gerencia as ações de "Aguardar", garantindo que mensagens sejam enviadas no horário exato, mesmo após dias.

## Componentes Fundamentais

### 1. Gatilhos (Triggers)
São os "pontos de entrada". Uma automação pode ter múltiplos gatilhos se desejar que caminhos diferentes levem ao mesmo resultado.

### 2. Ações (Actions)
São as "tarefas" executadas. Elas variam de comunicações externas (WhatsApp, E-mail) a atualizações internas no CRM (Tags, Deals, Score).

### 3. Ramos de Decisão (Conditions)
Permitem que a automação seja inteligente. "Se o cliente clicou, faça X. Se não clicou, faça Y".

## Variáveis Globais de Personalização

Em qualquer campo de texto, você pode usar as seguintes variáveis dinâmicas:
- \`{{nome}}\`: Nome do contato.
- \`{{email}}\`: E-mail principal.
- \`{{telefone}}\`: WhatsApp/Celular.
- \`{{deal_value}}\`: Valor do negócio atual (se houver).
- \`{{atendente_nome}}\`: Nome do usuário responsável pelo contato.

## Boas Práticas de Implementação

- **Nomenclatura:** Nomeie seus fluxos de forma clara: \`[VENDAS] - Carrinho Abandonado - Produto X\`.
- **Modo de Teste:** Sempre ative o fluxo primeiro para uma tag de teste antes de liberar para toda a base.
- **Filtros de Segurança:** Use filtros de "Apenas uma vez por contato" em fluxos de boas-vindas para evitar que o cliente receba a mesma mensagem repetidamente.

---

Para acessar o detalhamento técnico de cada item, navegue pelos catálogos de Gatilhos e Ações na barra lateral.
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
