import {
  Palette, MessageCircle, Vote, Smile, Sticker,
  MapPin, Contact2, Mic, AtSign, Sparkles
} from 'lucide-react';

/**
 * Lista única de "Novidades" usada como destaque nas páginas de vendas
 * (Index, /vendas e /apresentacao). Mantém uma fonte de verdade.
 */
export const WHATS_NEW_ITEMS = [
  {
    icon: Palette,
    title: 'Formulários com Visual Customizável',
    desc: 'Adapte cores, tipografia, bordas e espaçamento dos seus formulários para combinar 100% com o layout do site onde forem incorporados.',
    badge: 'Forms',
  },
  {
    icon: MessageCircle,
    title: 'Botões e Listas Interativas no WhatsApp',
    desc: 'Envie mensagens com botões clicáveis e listas de opções nativas do WhatsApp para qualificar leads em segundos.',
    badge: 'WhatsApp',
  },
  {
    icon: Vote,
    title: 'Enquetes que Disparam Automações',
    desc: 'Crie enquetes (até 12 opções) e use o voto de cada contato como gatilho para automações segmentadas.',
    badge: 'WhatsApp',
  },
  {
    icon: Smile,
    title: 'Reações por Emoji',
    desc: 'Reaja automaticamente a mensagens recebidas e use reações em fluxos para confirmações rápidas e humanizadas.',
    badge: 'WhatsApp',
  },
  {
    icon: Sticker,
    title: 'Figurinhas com Fallback Inteligente',
    desc: 'Envie stickers em campanhas e fluxos. Se a figurinha falhar, o sistema entrega imagem equivalente automaticamente.',
    badge: 'WhatsApp',
  },
  {
    icon: MapPin,
    title: 'Localização e Cartões de Contato',
    desc: 'Compartilhe coordenadas (com link para mapa) e vCards de contato direto pelo Flow Builder e pelo Inbox.',
    badge: 'WhatsApp',
  },
  {
    icon: Mic,
    title: 'Áudio PTT, Vídeo e Documentos',
    desc: 'Suporte completo a mensagens de voz (PTT), vídeos com legenda e documentos PDF/Office em campanhas e atendimento.',
    badge: 'WhatsApp',
  },
  {
    icon: AtSign,
    title: 'Menções em Grupos (incluindo @all)',
    desc: 'Mencione membros específicos ou todos do grupo. O Inbox mostra quem foi mencionado em cada mensagem recebida.',
    badge: 'WhatsApp',
  },
];

interface WhatsNewSectionProps {
  /**
   * Variante visual: 'default' (escuro padrão), 'compact' (sem container/título — só grid).
   */
  variant?: 'default' | 'compact';
  className?: string;
}

export function WhatsNewSection({ variant = 'default', className = '' }: WhatsNewSectionProps) {
  if (variant === 'compact') {
    return (
      <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {WHATS_NEW_ITEMS.map((item, i) => (
          <NewCard key={i} item={item} />
        ))}
      </div>
    );
  }

  return (
    <section
      id="novidades"
      className={`relative overflow-hidden py-16 md:py-24 border-t border-white/5 ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Novidades · Recém-lançado
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Mais conversão no <span className="text-primary">WhatsApp</span> e
            formulários <span className="text-primary">100% no seu visual</span>
          </h2>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed">
            Nossas últimas entregas foram pensadas para você fechar mais com menos esforço:
            interatividade nativa do WhatsApp e formulários que conversam com a identidade do seu site.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {WHATS_NEW_ITEMS.map((item, i) => (
            <NewCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewCard({ item }: { item: typeof WHATS_NEW_ITEMS[number] }) {
  const Icon = item.icon;
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-primary/30 hover:bg-white/[0.04] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      </div>
      <h3 className="font-semibold text-sm text-white mb-2 leading-snug">
        {item.title}
      </h3>
      <p className="text-xs text-white/55 leading-relaxed">
        {item.desc}
      </p>
    </div>
  );
}
