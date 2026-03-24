import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene8Migration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({ frame: frame - 20, fps, config: { damping: 10, stiffness: 80 } });
  const progressWidth = interpolate(frame, [40, 140], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: "20%",
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${badgeScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "20px 60px",
            borderRadius: 20,
            border: "2px solid rgba(74,222,128,0.3)",
            backgroundColor: "rgba(74,222,128,0.05)",
          }}
        >
          <span style={{ fontSize: 60, fontWeight: 900, color: "#4ADE80" }}>
            ⏱️ MENOS DE 2 HORAS
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "45%",
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 38, color: "#fff", fontWeight: 700 }}>
          Contatos, tags e automações migrados
        </span>
      </div>

      {/* Progress bar */}
      <Sequence from={40}>
        <div
          style={{
            position: "absolute",
            top: "58%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
          }}
        >
          <div style={{ width: "100%", height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)" }}>
            <div
              style={{
                width: `${progressWidth}%`,
                height: "100%",
                borderRadius: 6,
                backgroundColor: "#4ADE80",
                boxShadow: "0 0 20px rgba(74,222,128,0.3)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>Migração</span>
            <span style={{ fontSize: 16, color: "#4ADE80", fontWeight: 700 }}>{Math.floor(progressWidth)}%</span>
          </div>
        </div>
      </Sequence>

      <Sequence from={120}>
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 30,
            opacity: interpolate(frame - 120, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {["Sem downtime", "Sem perder leads", "Sem dor de cabeça"].map((t) => (
            <div
              key={t}
              style={{
                padding: "10px 24px",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.5)",
                fontSize: 18,
              }}
            >
              ✓ {t}
            </div>
          ))}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
