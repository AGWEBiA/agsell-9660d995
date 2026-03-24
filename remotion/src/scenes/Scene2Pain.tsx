import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const TOOLS = [
  { name: "ActiveCampaign", price: "E-mail", color: "#356AE6" },
  { name: "ManyChat", price: "Instagram", color: "#0084FF" },
  { name: "SellFlux", price: "WhatsApp", color: "#8B5CF6" },
  { name: "Intercom", price: "Suporte", color: "#6AFDEF" },
  { name: "HubSpot", price: "CRM", color: "#FF7A59" },
  { name: "ChatGPT API", price: "IA", color: "#10A37F" },
];

export const Scene2Pain: React.FC = () => {
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
          transform: `translateY(${interpolate(frame, [0, 25], [30, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        <span style={{ fontSize: 26, color: "#E63329", fontWeight: 700, letterSpacing: 6 }}>
          O PROBLEMA
        </span>
        <div style={{ fontSize: 54, fontWeight: 900, color: "#fff", marginTop: 16 }}>
          O "Frankenstein" Digital
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
          Ferramentas que custam caro, não se falam e fazem sua equipe perder vendas
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "32%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 20,
          padding: "0 80px",
          flexWrap: "wrap",
        }}
      >
        {TOOLS.map((tool, i) => {
          const delay = 30 + i * 12;
          const appear = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
          const crossDelay = 150 + i * 8;
          const crossProgress = interpolate(frame, [crossDelay, crossDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={tool.name}
              style={{
                width: 260,
                padding: "24px 20px",
                borderRadius: 16,
                border: `1px solid ${tool.color}33`,
                backgroundColor: `${tool.color}08`,
                textAlign: "center",
                transform: `scale(${appear})`,
                opacity: appear,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                {tool.name}
              </div>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>
                {tool.price}
              </div>

              {crossProgress > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `rgba(230, 51, 41, ${crossProgress * 0.25})`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 90,
                      fontWeight: 900,
                      color: "#E63329",
                      opacity: crossProgress,
                      transform: `scale(${interpolate(crossProgress, [0, 1], [2, 1])}) rotate(${interpolate(crossProgress, [0, 1], [-15, 0])}deg)`,
                    }}
                  >
                    ✕
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "Cada roda quer ir pra um lado" */}
      <Sequence from={220}>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 220, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame - 220, [0, 25], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          <span style={{ fontSize: 34, color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
            Sua equipe gasta mais tempo{" "}
            <span style={{ color: "#E63329", fontWeight: 700 }}>gerenciando dados</span>
            <br />
            do que <span style={{ color: "#fff", fontWeight: 700 }}>fechando contratos.</span>
          </span>
        </div>
      </Sequence>

      {/* Leads "vazando" visual */}
      <Sequence from={300}>
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 300, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.3)", letterSpacing: 4 }}>
            LEADS PERDIDOS • TIMING ERRADO • DADOS FRAGMENTADOS
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
