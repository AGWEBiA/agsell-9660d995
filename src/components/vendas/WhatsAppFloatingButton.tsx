import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const WHATSAPP_NUMBER = '5522992545278';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, meu nome é [seu nome]. Estou na página da AG SELL e preciso de mais informações.')}`;

export function WhatsAppFloatingButton() {
  const handleClick = () => {
    try {
      supabase.functions.invoke('track-event', {
        body: {
          organization_id: '00000000-0000-0000-0000-000000000000',
          event_name: 'whatsapp_button_click',
          page_url: window.location.href,
          event_data: { referrer: document.referrer },
        },
      });
    } catch (_) {
      // fire-and-forget
    }
  };

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-white font-semibold shadow-lg shadow-black/30 hover:bg-[#1ebe5b] transition-all hover:scale-105 group"
    >
      <MessageCircle className="h-6 w-6 fill-white stroke-white" />
      <span className="hidden sm:inline text-sm">Atendimento</span>
    </a>
  );
}
