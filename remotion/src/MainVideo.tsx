import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Pain } from "./scenes/Scene2Pain";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Features } from "./scenes/Scene4Features";
import { Scene5Integrations } from "./scenes/Scene5Integrations";
import { Scene6AIScoring } from "./scenes/Scene6AIScoring";
import { Scene7FlowBuilder } from "./scenes/Scene7FlowBuilder";
import { Scene8Migration } from "./scenes/Scene8Migration";
import { Scene9Social } from "./scenes/Scene9Social";
import { Scene10Pricing } from "./scenes/Scene10Pricing";
import { Scene11Guarantee } from "./scenes/Scene11Guarantee";
import { Scene12CTA } from "./scenes/Scene12CTA";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const bgHue = interpolate(frame, [0, 3090], [0, 20]);

  return (
    <AbsoluteFill style={{ backgroundColor: `hsl(${bgHue}, 5%, 5%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + Math.sin(frame * 0.01) * 10}% ${50 + Math.cos(frame * 0.008) * 10}%, rgba(230, 51, 41, 0.03) 0%, transparent 70%)`,
        }}
      />

      <TransitionSeries>
        {/* 00:00-00:15 Hook - dollar counter */}
        <TransitionSeries.Sequence durationInFrames={420}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 00:15-00:45 Pain - Frankenstein */}
        <TransitionSeries.Sequence durationInFrames={450}>
          <Scene2Pain />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 00:45-01:10 Solution reveal */}
        <TransitionSeries.Sequence durationInFrames={360}>
          <Scene3Solution />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 01:10-01:25 Features */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene4Features />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 01:25-01:35 Integrations */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene5Integrations />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 01:35-01:48 AI Scoring */}
        <TransitionSeries.Sequence durationInFrames={270}>
          <Scene6AIScoring />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 01:48-02:00 Flow Builder */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene7FlowBuilder />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 02:00-02:12 Migration */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene8Migration />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 02:12-02:25 Social Proof */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene9Social />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 02:25-02:42 Pricing */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene10Pricing />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 02:42-02:55 Guarantee */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene11Guarantee />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* 02:55-03:25 CTA Final */}
        <TransitionSeries.Sequence durationInFrames={420}>
          <Scene12CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
