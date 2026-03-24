import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene9Social: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const counterValue = Math.floor(interpolate(frame, [20, 100], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: "18%",
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 24, color: "#E63329", letterSpacing: 6, fontWeight: 700 }}>
          PROVA SOCIAL
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: "30%",
          width: "100%",
          textAlign: "center",
          transform: `scale(${spring({ frame: frame - 15, fps, config: { damping: 12 } })})`,
        }}
      >
        <span style={{ fontSize: 120, fontWeight: 900, color: "#fff" }}>
          +{counterValue}
        </span>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.4)", letterSpacing: 4, marginTop: 8 }}>
          MILHÕES DE INTERAÇÕES
        </div>
      </div>

      <Sequence from={80}>
        <div
          style={{
            position: "absolute",
            top: "60%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 80, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 36, color: "rgba(255,255,255,0.6)" }}>
            Empresas que economizaram{" "}
            <span style={{ color: "#4ADE80", fontWeight: 900, fontSize: 44 }}>R$ 1.600+/mês</span>
            <br />
            <span style={{ fontSize: 28 }}>logo na primeira fatura</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
