import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene6AIScoring: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scoreValue = Math.floor(interpolate(frame, [40, 140], [0, 94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const barWidth = interpolate(frame, [40, 140], [0, 94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Purple/blue AI glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 500,
          height: 500,
          marginLeft: -250,
          borderRadius: "50%",
          backgroundColor: "#8B5CF6",
          opacity: 0.06,
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 70,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 24, color: "#8B5CF6", letterSpacing: 6, fontWeight: 700 }}>
          INTELIGÊNCIA ARTIFICIAL DE VERDADE
        </span>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginTop: 14 }}>
          Scoring Preditivo com IA
        </div>
      </div>

      {/* Score visualization */}
      <Sequence from={30}>
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            opacity: spring({ frame: frame - 30, fps, config: { damping: 20 } }),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>Lead Score</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: scoreValue > 70 ? "#4ADE80" : "#E63329" }}>
              {scoreValue}%
            </span>
          </div>
          <div style={{ width: "100%", height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)" }}>
            <div
              style={{
                width: `${barWidth}%`,
                height: "100%",
                borderRadius: 8,
                background: `linear-gradient(90deg, #E63329, #4ADE80)`,
                boxShadow: "0 0 20px rgba(74,222,128,0.3)",
              }}
            />
          </div>
        </div>
      </Sequence>

      <Sequence from={100}>
        <div
          style={{
            position: "absolute",
            top: "55%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 100, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.6)" }}>
            Analisa cada <span style={{ color: "#8B5CF6", fontWeight: 700 }}>clique e resposta</span>
            <br />
            e entrega o <span style={{ color: "#4ADE80", fontWeight: 900 }}>ouro mastigado</span> pro vendedor
          </span>
        </div>
      </Sequence>

      <Sequence from={170}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 170, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.3)", letterSpacing: 4 }}>
            QUEM TEM MAIS CHANCE DE COMPRAR → AGORA
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
