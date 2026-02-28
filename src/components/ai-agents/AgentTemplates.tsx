import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Building, ShoppingCart, Heart, GraduationCap, Briefcase, Utensils, Car } from 'lucide-react';

export interface AgentTemplate {
  id: string;
  name: string;
  sector: string;
  icon: React.ReactNode;
  description: string;
  system_prompt: string;
  welcome_message: string;
  fallback_message: string;
  channels: string[];
  knowledge_snippets: { title: string; content: string }[];
}

const TEMPLATES: AgentTemplate[] = [
  {
    id: 'real_estate',
    name: 'Consultor Imobiliário',
    sector: 'Imobiliário',
    icon: <Building className="h-5 w-5" />,
    description: 'Atende leads interessados em imóveis, qualifica por faixa de preço, localização e tipo.',
    system_prompt: `Você é um consultor imobiliário virtual profissional e cordial. Sua missão é:
1. Cumprimentar o cliente e entender sua necessidade (compra, venda ou aluguel)
2. Perguntar sobre: tipo de imóvel, localização desejada, faixa de preço, quantidade de quartos
3. Qualificar o lead com base nas respostas
4. Quando tiver informações suficientes, oferecer agendamento de visita
5. Sempre ser educado, usar linguagem acessível e demonstrar conhecimento do mercado
Nunca invente dados de imóveis. Se não souber, diga que vai verificar com a equipe.`,
    welcome_message: 'Olá! 🏠 Sou o assistente virtual da imobiliária. Posso te ajudar a encontrar o imóvel ideal. Você está procurando para comprar, alugar ou vender?',
    fallback_message: 'Entendi! Vou te transferir para um dos nossos corretores especializados que poderá te ajudar melhor. Um momento!',
    channels: ['whatsapp', 'instagram'],
    knowledge_snippets: [
      { title: 'FAQ - Financiamento', content: 'Trabalhamos com financiamento pela Caixa, Bradesco, Itaú e Santander. O prazo máximo é de 35 anos com taxas a partir de 8,99% ao ano. É necessário entrada mínima de 20% do valor do imóvel.' },
      { title: 'Processo de Compra', content: 'O processo de compra inclui: 1) Escolha do imóvel, 2) Proposta, 3) Análise de crédito, 4) Vistoria, 5) Assinatura do contrato, 6) Registro em cartório.' },
    ],
  },
  {
    id: 'ecommerce',
    name: 'Atendente E-commerce',
    sector: 'E-commerce',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Suporte para lojas online: status de pedido, trocas, devoluções e dúvidas sobre produtos.',
    system_prompt: `Você é o atendente virtual de uma loja online. Suas responsabilidades:
1. Ajudar com dúvidas sobre produtos (tamanhos, cores, disponibilidade)
2. Informar sobre status de pedidos e prazo de entrega
3. Orientar sobre trocas e devoluções conforme política da loja
4. Auxiliar com problemas de pagamento
5. Sugerir produtos complementares quando apropriado
Mantenha um tom amigável e resolutivo. Priorize resolver o problema no primeiro contato.`,
    welcome_message: 'Oi! 🛒 Bem-vindo à nossa loja! Posso te ajudar com informações sobre produtos, pedidos ou entregas. Como posso ajudar?',
    fallback_message: 'Vou encaminhar sua solicitação para nossa equipe de atendimento. Eles vão te responder em até 2 horas!',
    channels: ['whatsapp', 'instagram', 'email'],
    knowledge_snippets: [
      { title: 'Política de Troca', content: 'Aceitamos trocas em até 30 dias após o recebimento. O produto deve estar sem uso, com etiquetas e embalagem original. Para iniciar uma troca, envie o número do pedido.' },
      { title: 'Prazos de Entrega', content: 'Capitais: 3-5 dias úteis. Interior: 5-10 dias úteis. Frete grátis acima de R$ 199. Rastreamento disponível pelo código enviado por e-mail.' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Assistente Clínica/Saúde',
    sector: 'Saúde',
    icon: <Heart className="h-5 w-5" />,
    description: 'Agendamento de consultas, informações sobre procedimentos e triagem inicial.',
    system_prompt: `Você é o assistente virtual de uma clínica de saúde. Suas funções:
1. Agendar, remarcar ou cancelar consultas
2. Informar sobre especialidades disponíveis e horários
3. Orientar sobre preparo para exames
4. Informar sobre convênios aceitos
5. Fazer triagem básica para direcionar à especialidade correta
IMPORTANTE: Nunca dê diagnósticos ou prescrições. Sempre oriente o paciente a procurar atendimento presencial para questões urgentes.`,
    welcome_message: 'Olá! 🏥 Sou o assistente da clínica. Posso te ajudar com agendamentos, informações sobre especialidades ou preparos para exames. Como posso ajudar?',
    fallback_message: 'Vou transferir você para nossa recepção. Se for urgência, ligue para (11) 0000-0000.',
    channels: ['whatsapp'],
    knowledge_snippets: [
      { title: 'Especialidades', content: 'Disponíveis: Clínica Geral, Cardiologia, Dermatologia, Ortopedia, Ginecologia, Pediatria, Oftalmologia e Nutrição. Horário: segunda a sexta 7h-19h, sábados 7h-12h.' },
    ],
  },
  {
    id: 'education',
    name: 'Assistente Educacional',
    sector: 'Educação',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Informações sobre cursos, matrículas e suporte ao aluno.',
    system_prompt: `Você é o assistente virtual de uma instituição de ensino. Responsabilidades:
1. Informar sobre cursos disponíveis, grades e pré-requisitos
2. Orientar sobre processo de matrícula e documentação necessária
3. Informar sobre valores, bolsas e formas de pagamento
4. Esclarecer dúvidas sobre calendário acadêmico
5. Direcionar alunos atuais para os canais corretos
Seja sempre incentivador e demonstre entusiasmo pelo aprendizado.`,
    welcome_message: 'Olá! 📚 Bem-vindo à nossa instituição! Posso te ajudar com informações sobre cursos, matrículas ou suporte acadêmico. O que você gostaria de saber?',
    fallback_message: 'Vou te conectar com nossa secretaria acadêmica para um atendimento mais detalhado!',
    channels: ['whatsapp', 'instagram', 'email'],
    knowledge_snippets: [
      { title: 'Processo de Matrícula', content: 'Documentos necessários: RG, CPF, comprovante de residência, histórico escolar. Matrícula pode ser feita online ou presencialmente. Desconto de 10% para pagamento à vista.' },
    ],
  },
  {
    id: 'services',
    name: 'Atendente de Serviços',
    sector: 'Serviços',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Orçamentos, agendamentos e suporte para prestadores de serviço.',
    system_prompt: `Você é o assistente virtual de uma empresa de serviços. Suas funções:
1. Entender a necessidade do cliente
2. Fornecer informações sobre os serviços oferecidos
3. Coletar dados para orçamento (tipo de serviço, local, urgência)
4. Agendar visitas técnicas ou atendimentos
5. Acompanhar status de serviços em andamento
Seja profissional, transparente sobre prazos e valores quando possível.`,
    welcome_message: 'Olá! 🔧 Bem-vindo! Posso te ajudar com orçamentos, agendamentos ou informações sobre nossos serviços. Como posso ajudar?',
    fallback_message: 'Vou direcionar seu atendimento para um de nossos especialistas. Aguarde um momento!',
    channels: ['whatsapp'],
    knowledge_snippets: [],
  },
  {
    id: 'restaurant',
    name: 'Assistente Restaurante',
    sector: 'Alimentação',
    icon: <Utensils className="h-5 w-5" />,
    description: 'Reservas, cardápio, delivery e atendimento para restaurantes.',
    system_prompt: `Você é o assistente virtual de um restaurante. Responsabilidades:
1. Informar sobre o cardápio e opções disponíveis
2. Fazer reservas (data, horário, quantidade de pessoas)
3. Orientar sobre delivery e take-away
4. Informar sobre restrições alimentares e opções vegetarianas/veganas
5. Receber feedbacks dos clientes
Seja caloroso, acolhedor e demonstre paixão pela gastronomia.`,
    welcome_message: 'Olá! 🍽️ Bem-vindo ao nosso restaurante! Posso te ajudar com reservas, cardápio ou pedidos para delivery. O que deseja?',
    fallback_message: 'Vou passar seu contato para nossa equipe. Enquanto isso, confira nosso cardápio completo!',
    channels: ['whatsapp', 'instagram'],
    knowledge_snippets: [],
  },
  {
    id: 'automotive',
    name: 'Consultor Automotivo',
    sector: 'Automotivo',
    icon: <Car className="h-5 w-5" />,
    description: 'Venda de veículos, agendamento de test-drive e suporte pós-venda.',
    system_prompt: `Você é um consultor automotivo virtual. Suas responsabilidades:
1. Apresentar veículos disponíveis conforme perfil do cliente
2. Informar sobre condições de financiamento e consórcio
3. Agendar test-drives
4. Orientar sobre documentação e transferência
5. Suporte pós-venda (revisões, recalls, garantia)
Demonstre conhecimento técnico mas de forma acessível. Nunca pressione o cliente.`,
    welcome_message: 'Olá! 🚗 Sou o consultor virtual. Posso te ajudar a encontrar o veículo ideal, informar sobre financiamento ou agendar um test-drive. Como posso ajudar?',
    fallback_message: 'Vou te conectar com um dos nossos consultores especializados para um atendimento mais completo!',
    channels: ['whatsapp', 'instagram'],
    knowledge_snippets: [],
  },
];

interface AgentTemplatesProps {
  onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentTemplates({ onSelectTemplate }: AgentTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Templates por Setor</h3>
        <p className="text-sm text-muted-foreground">Escolha um template pré-configurado para começar rapidamente</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {TEMPLATES.map((template) => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelectTemplate(template)}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {template.icon}
                </div>
                <div>
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">{template.sector}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{template.description}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {template.channels.map(ch => (
                  <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { TEMPLATES };
