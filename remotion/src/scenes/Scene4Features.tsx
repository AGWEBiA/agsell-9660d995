import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const COMPARISONS = [
  { them: "HubSpot", us: "CRM AG Sell", icon: "📊" },
  { them: "ActiveCampaign", us: "E-mail AG Sell", icon: "📧" },
  { them: "ManyChat", us: "WhatsApp Nativo", icon: "💬" },
  { them: "Intercom", us: "SAC AG Sell", icon: "🎧" },
];

export const Scene4Features: React.FC = () => {
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
        <span style={{ fontSize: 24, color: "#E63329", letterSpacing: 6, fontWeight: 700 }}>
          SUPERAMOS AS GRINGAS
        </span>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginTop: 14 }}>
          O que a HubSpot <span style={{ color: "#E63329" }}>não tem</span>
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
          WhatsApp Nativo Multimídia + IA de Scoring Preditivo
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "35%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 24,
          padding: "0 120px",
        }}
      >
        {COMPARISONS.map((item, i) => {
          const delay = 30 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          return (
            <div
              key={item.them}
              style={{
                flex: 1,
                maxWidth: 340,
                padding: "28px 20px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.02)",
                textAlign: "center",
                transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                opacity: s,
              }}
            >
              <span style={{ fontSize: 40 }}>{item.icon}</span>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", marginTop: 12 }}>
                {item.them}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", margin: "4px 0" }}>→</div>
              <div style={{ fontSize: 22, color: "#4ADE80", fontWeight: 700 }}>
                {item.us}
              </div>
            </div>
          );
        })}
      </div>

      <Sequence from={150}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 150, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 30, color: "rgba(255,255,255,0.5)" }}>
            IA que <span style={{ color: "#fff", fontWeight: 900 }}>fala a nossa língua.</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
