import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MetaDemoVideo } from "./MetaDemoVideo";

// Total: 120+180+150+210+180+150 = 990 scene frames - 5*20 = 100 transition frames = 890
export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={3090}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="meta-demo"
      component={MetaDemoVideo}
      durationInFrames={890}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
