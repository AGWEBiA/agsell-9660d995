import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene11Guarantee: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shieldScale = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          borderRadius: "50%",
          backgroundColor: "#4ADE80",
          opacity: 0.05,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "18%",
          width: "100%",
          textAlign: "center",
          transform: `scale(${shieldScale})`,
        }}
      >
        <span style={{ fontSize: 100 }}>🛡️</span>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginTop: 16 }}>
          Garantia de Migração
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.5)", marginTop: 12, maxWidth: 700, margin: "12px auto 0" }}>
          Perdeu qualquer dado? Devolvemos o primeiro mês.
          <br />
          <span style={{ color: "#4ADE80", fontWeight: 700 }}>Sem perguntas. O risco é 100% nosso.</span>
        </div>
      </div>

      <Sequence from={80}>
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 40,
            opacity: interpolate(frame - 80, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {[
            { icon: "📋", text: "Sem Contrato Anual" },
            { icon: "🔓", text: "Sem Multas" },
            { icon: "✊", text: "Você é Livre" },
          ].map((badge) => (
            <div
              key={badge.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 28px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <span style={{ fontSize: 28 }}>{badge.icon}</span>
              <span style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      </Sequence>

      <Sequence from={140}>
        <div
          style={{
            position: "absolute",
            bottom: "6%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 140, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            "Se não vendermos mais para você, não merecemos sua assinatura."
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
