import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const STEPS = [
  { label: "Lead não abriu e-mail", action: "→ Mande WhatsApp", color: "#E63329" },
  { label: "Clicou mas não comprou", action: "→ Tarefa pro vendedor", color: "#F59E0B" },
  { label: "Vendedor liga via VoIP", action: "→ Tudo automático", color: "#4ADE80" },
];

export const Scene7FlowBuilder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: 70,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 24, color: "#F59E0B", letterSpacing: 6, fontWeight: 700 }}>
          FLOW BUILDER
        </span>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginTop: 14 }}>
          Funis complexos, visualmente
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
        }}
      >
        {STEPS.map((step, i) => {
          const delay = 30 + i * 30;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          return (
            <div key={step.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 12,
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: `${step.color}15`,
                    border: `2px solid ${step.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 900,
                    color: step.color,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)" }}>{step.label}</div>
                  <div style={{ fontSize: 26, color: step.color, fontWeight: 900 }}>{step.action}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: 30,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    marginLeft: 24,
                    marginBottom: 12,
                    opacity: s,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <Sequence from={140}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 140, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}>
            Sem código. Sem complicação. <span style={{ color: "#4ADE80", fontWeight: 700 }}>100% visual.</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
