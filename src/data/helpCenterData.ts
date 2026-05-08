import { Heart, FileDown } from 'lucide-react';
import { AUTOMATION_GUIDE_ARTICLES } from './automationGuide';
import { type HelpArticle, type HelpCategory } from '@/types/help';

// Import split articles
import { getting_started_articles } from './help/getting-started';
import { crm_articles } from './help/crm';
import { communication_articles } from './help/communication';
import { marketing_articles } from './help/marketing';
import { intelligence_articles } from './help/intelligence';
import { settings_articles } from './help/settings';
import { documentation_articles } from './help/documentation';

// Re-export types
export type { HelpArticle, HelpCategory };

// Import categories
export { helpCategories } from './help/categories';

const PDF_DOWNLOAD_ARTICLE: HelpArticle = {
  id: 'automation-pdf-download',
  categoryId: 'automation-guide',
  title: 'Baixar Guia Completo em PDF',
  icon: FileDown,
  description: 'Gere a versão mestre do Manual Operacional AG Sell com todos os gatilhos e ações.',
  popular: true,
  content: `Você está prestes a baixar a versão mestre do **Guia de Automações AG Sell**. Este arquivo foi otimizado para exportação A4 com diagramação profissional, margens de impressão e sumário inteligente.

## Conteúdo do Guia Completo
- **Catálogo de Gatilhos (Triggers):** Como configurar entradas via formulário, site tracking, WhatsApp e CRM.
- **Manual de Ações (Actions):** Detalhamento de envios multicanal, Webhooks, tags e criação de deals.
- **Receitas Prontas:** Fluxos testados de Carrinho Abandonado, NPS e Nutrição.
- **Checklist Operacional:** Lista de verificação para garantir que nada falhe antes de ativar seu fluxo.

### Instruções para Exportação
Para obter o melhor resultado:
1. Clique no botão **"Exportar A4"** localizado no topo desta página.
2. O sistema processará todo o conteúdo do manual e gerará um arquivo PDF com múltiplas páginas.
3. O sumário será gerado automaticamente com base nos tópicos do manual.

[💡] **Dica:** Se você marcou artigos como favoritos, eles aparecerão com destaque visual no sumário do PDF completo.
`
};

const FAVORITES_ARTICLE: HelpArticle = {
  id: 'help-center-favorites',
  categoryId: 'getting-started',
  title: 'Seus Favoritos',
  icon: Heart,
  description: 'Acesse rapidamente os artigos que você marcou como importantes.',
  content: `Bem-vindo à sua central de favoritos. Aqui você pode acessar rapidamente as funcionalidades que mais utiliza.

## Como usar os favoritos

Ao navegar pela Central de Ajuda ou pelo Guia de Automações, você verá um botão de **Coração (Favoritar)** no topo de cada artigo.

1. Clique no coração para adicionar à sua lista.
2. Acesse este artigo a qualquer momento para ver sua lista compilada.
3. Seus favoritos são salvos automaticamente no seu navegador.

[💡] **Exportação Personalizada:** Quando você exporta o Guia de Automações em PDF, o sistema prioriza e destaca seus itens favoritos no sumário.
`
};

export const helpArticles: HelpArticle[] = [
  ...AUTOMATION_GUIDE_ARTICLES,
  FAVORITES_ARTICLE,
  PDF_DOWNLOAD_ARTICLE,
  ...getting_started_articles,
  ...crm_articles,
  ...communication_articles,
  ...marketing_articles,
  ...intelligence_articles,
  ...settings_articles,
  ...documentation_articles,
];
