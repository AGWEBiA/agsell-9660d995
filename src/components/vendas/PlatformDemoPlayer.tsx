import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import crmShot from '@/assets/vendas-feature-crm.jpg';
import omniShot from '@/assets/vendas-feature-omnichannel.jpg';
import autoShot from '@/assets/vendas-feature-automation.jpg';
import aiShot from '@/assets/vendas-feature-ai.jpg';

const FRAMES = [
  { src: crmShot, label: 'CRM & Pipeline', sub: 'Gestão completa de contatos e funil de vendas' },
  { src: omniShot, label: 'Inbox Omnichannel', sub: 'WhatsApp, E-mail, Instagram em um só lugar' },
  { src: autoShot, label: 'Flow Builder', sub: 'Automações visuais com 50+ gatilhos' },
  { src: aiShot, label: 'IA Generativa', sub: 'Agentes inteligentes 24/7' },
];

const FRAME_DURATION = 3500;

export function PlatformDemoPlayer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / FRAME_DURATION) * 100);
      setProgress(p);
      if (elapsed >= FRAME_DURATION) {
        setIndex((i) => (i + 1) % FRAMES.length);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [index, playing]);

  return (
    <div className="relative aspect-video rounded-2xl border border-primary/20 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden shadow-2xl shadow-primary/20">
      {/* Browser chrome */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-zinc-900/95 border-b border-white/5 flex items-center gap-1.5 px-3 z-20">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <div className="ml-3 px-2.5 py-0.5 rounded text-[10px] bg-white/5 text-white/50 font-mono">
          app.agsell.com.br
        </div>
      </div>

      {/* Frames */}
      <div className="absolute inset-0 pt-9">
        {FRAMES.map((f, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <img
              src={f.src}
              alt={f.label}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs text-primary font-mono uppercase tracking-widest mb-1">
                {String(i + 1).padStart(2, '0')} / {String(FRAMES.length).padStart(2, '0')}
              </p>
              <h4 className="text-2xl sm:text-3xl font-bold mb-1">{f.label}</h4>
              <p className="text-sm text-white/60">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
          </button>
          <div className="flex-1 flex gap-1.5">
            {FRAMES.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                    transitionDuration: i === index ? '50ms' : '0ms',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
