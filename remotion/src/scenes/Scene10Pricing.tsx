import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const PLANS = [
  { name: "Starter", price: "R$ 197", popular: false },
  { name: "Profissional", price: "R$ 397", popular: true },
  { name: "Enterprise", price: "R$ 997", popular: false },
];

export const Scene10Pricing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 24, color: "#E63329", letterSpacing: 6, fontWeight: 700 }}>
          A PARTE MAIS IMPRESSIONANTE
        </span>
        <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", marginTop: 12 }}>
          Na gringa, custaria <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)" }}>R$ 2.000+/mês</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "30%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {PLANS.map((plan, i) => {
          const delay = 25 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          return (
            <div
              key={plan.name}
              style={{
                width: 320,
                padding: "36px 24px",
                borderRadius: 24,
                border: plan.popular ? "2px solid #E63329" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: plan.popular ? "rgba(230,51,41,0.06)" : "rgba(255,255,255,0.02)",
                textAlign: "center",
                transform: `scale(${s}) translateY(${plan.popular ? -10 : 0}px)`,
                opacity: s,
                position: "relative",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "4px 20px",
                    backgroundColor: "#E63329",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: 2,
                  }}
                >
                  MAIS POPULAR
                </div>
              )}
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", fontWeight: 700, marginBottom: 16 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                /mês
              </div>
            </div>
          );
        })}
      </div>

      <Sequence from={120}>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 120, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.5)" }}>
            É uma decisão <span style={{ color: "#fff", fontWeight: 900 }}>matemática</span>,
            não apenas emocional.
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
