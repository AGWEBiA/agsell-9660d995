import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const CHECKOUTS = [
  { name: "Hotmart", color: "#FF6B35" },
  { name: "Kiwify", color: "#00C853" },
  { name: "Eduzz", color: "#7C4DFF" },
  { name: "Stripe", color: "#635BFF" },
];

export const Scene5Integrations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 24, color: "#E63329", letterSpacing: 6, fontWeight: 700 }}>
          INTEGRAÇÕES NATIVAS
        </span>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginTop: 14 }}>
          Os maiores checkouts do Brasil
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "38%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {CHECKOUTS.map((c, i) => {
          const delay = 20 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          return (
            <div
              key={c.name}
              style={{
                width: 200,
                height: 200,
                borderRadius: 24,
                border: `2px solid ${c.color}40`,
                backgroundColor: `${c.color}0A`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${s})`,
                opacity: s,
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.name}</span>
            </div>
          );
        })}
      </div>

      <Sequence from={80}>
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 80, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 34, color: "rgba(255,255,255,0.6)" }}>
            Checkout abandonado?{" "}
            <span style={{ color: "#4ADE80", fontWeight: 700 }}>O WhatsApp dispara em segundos.</span>
          </span>
        </div>
      </Sequence>

      <Sequence from={130}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 130, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.3)", letterSpacing: 4 }}>
            PIX GERADO → AG SELL SABE → AUTOMAÇÃO ATIVADA
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
