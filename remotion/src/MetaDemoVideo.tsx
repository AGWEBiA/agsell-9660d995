import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1Intro } from "./scenes-meta/Scene1Intro";
import { Scene2OAuth } from "./scenes-meta/Scene2OAuth";
import { Scene3Dashboard } from "./scenes-meta/Scene3Dashboard";
import { Scene4Inbox } from "./scenes-meta/Scene4Inbox";
import { Scene5Automations } from "./scenes-meta/Scene5Automations";
import { Scene6Closing } from "./scenes-meta/Scene6Closing";

export const MetaDemoVideo: React.FC = () => {
  const transitionDuration = 20;
  const t = springTiming({ config: { damping: 200 }, durationInFrames: transitionDuration });

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene2OAuth />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={t} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene3Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene4Inbox />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={t} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene5Automations />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene6Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
