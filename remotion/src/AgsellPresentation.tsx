// Vídeo de apresentação AG Sell — narração + música + mockups
// 56s narração; ~58s total. Roteiro vs cenas:
//  0-7s    Hook         "Você está perdendo vendas..."
//  7-15s   CRM          "...gerencia funil... pipeline visual e pontuação"
// 15-25s   Inbox        "...WhatsApp, Instagram, email, ligações em um único inbox"
// 25-35s   Flow         "...automações poderosas com Flow Builder"
// 35-45s   AI           "...agentes de inteligência artificial 24/7"
// 45-52s   Solution     "...com a estratégia de quem já faturou múltiplos 8 dígitos"
// 52-58s   CTA          "Pare de improvisar. Comece a escalar. AG Sell."
import { AbsoluteFill, Audio, staticFile, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SceneHook } from './agsell/SceneHook';
import { SceneCRM } from './agsell/SceneCRM';
import { SceneInbox } from './agsell/SceneInbox';
import { SceneFlow } from './agsell/SceneFlow';
import { SceneAI } from './agsell/SceneAI';
import { SceneSolution } from './agsell/SceneSolution';
import { SceneCTA } from './agsell/SceneCTA';
import { loadFont } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] });

const TRANS = 12; // overlap frames between scenes

export const AgsellPresentation: React.FC = () => {
  const frame = useCurrentFrame();
  // Música: fade-in 1s, base 0.18, cai para 0.10 quando narração ativa (frame > 15)
  const musicVol = interpolate(frame, [0, 30, 60, 1680, 1740], [0, 0.22, 0.12, 0.12, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={210}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneCRM />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <SceneInbox />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <SceneFlow />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <SceneAI />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <SceneSolution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Narração começa no frame 0 */}
      <Audio src={staticFile('audio/narration.mp3')} volume={1.0} />
      {/* Música de fundo (volume baixo, fade in/out) */}
      <Audio src={staticFile('audio/music.mp3')} volume={musicVol} />
    </AbsoluteFill>
  );
};
