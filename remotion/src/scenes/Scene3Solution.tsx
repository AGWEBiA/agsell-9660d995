import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const FEATURES = [
  { icon: "💬", label: "WhatsApp Nativo" },
  { icon: "📧", label: "E-mail Marketing" },
  { icon: "📱", label: "Instagram DM" },
  { icon: "🤖", label: "Agentes IA" },
  { icon: "📊", label: "CRM Completo" },
  { icon: "⚡", label: "Automação" },
  { icon: "📞", label: "VoIP Nativo" },
  { icon: "🎯", label: "Lead Scoring" },
];

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });
  const glowSize = interpolate(frame, [15, 80], [0, 900], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [15, 50, 100], [0, 0.2, 0.05], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: glowSize,
          height: glowSize,
          marginLeft: -glowSize / 2,
          marginTop: -glowSize / 2,
          borderRadius: "50%",
          backgroundColor: "#E63329",
          opacity: glowOpacity,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 22, color: "#E63329", letterSpacing: 8, fontWeight: 700 }}>
          A SOLUÇÃO
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: "25%",
          width: "100%",
          textAlign: "center",
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <div style={{ fontSize: 130, fontWeight: 900, color: "#fff", letterSpacing: -3 }}>
          AG <span style={{ color: "#E63329" }}>Sell</span>
        </div>
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", marginTop: 14, letterSpacing: 3 }}>
          A PRIMEIRA PLATAFORMA ALL-IN-ONE DE VERDADE
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Construída para o empresário brasileiro
        </div>
      </div>

      <Sequence from={60}>
        <div
          style={{
            position: "absolute",
            top: "58%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "0 180px",
          }}
        >
          {FEATURES.map((f, i) => {
            const delay = i * 5;
            const s = spring({ frame: frame - 60 - delay, fps, config: { damping: 15 } });
            return (
              <div
                key={f.label}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "1px solid rgba(230,51,41,0.25)",
                  backgroundColor: "rgba(230,51,41,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transform: `scale(${s}) translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                  opacity: s,
                }}
              >
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <span style={{ fontSize: 20, color: "#fff", fontWeight: 700 }}>{f.label}</span>
              </div>
            );
          })}
        </div>
      </Sequence>

      <Sequence from={160}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 160, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
            Tudo em <span style={{ color: "#4ADE80", fontWeight: 900 }}>uma única tela.</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
