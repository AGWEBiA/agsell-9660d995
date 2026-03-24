import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dollarValue = Math.floor(interpolate(frame, [0, 200], [0, 2400], { extrapolateRight: "clamp" }));
  const formatted = dollarValue.toLocaleString("en-US");
  const counterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.2) * 0.04 + 1;
  const textOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(frame, [40, 70], [30, 0], { extrapolateRight: "clamp" });
  const redIntensity = frame > 100 ? interpolate(frame, [100, 200], [0, 0.2], { extrapolateRight: "clamp" }) : 0;
  const subOpacity = interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [140, 170], [20, 0], { extrapolateRight: "clamp" });

  // Second part: "deletar tudo" text
  const part2Opacity = interpolate(frame, [280, 310], [0, 1], { extrapolateRight: "clamp" });
  const part2Y = interpolate(frame, [280, 310], [40, 0], { extrapolateRight: "clamp" });

  // Economy flash
  const economyOpacity = interpolate(frame, [340, 370], [0, 1], { extrapolateRight: "clamp" });
  const economyScale = spring({ frame: frame - 340, fps, config: { damping: 10, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(230, 51, 41, ${redIntensity}) 0%, transparent 60%)`,
        }}
      />

      <AbsoluteFill style={{ opacity: 0.03 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 2.5 + frame * 0.3) % 100}%`,
              width: "100%",
              height: 1,
              backgroundColor: "#E63329",
            }}
          />
        ))}
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          top: "25%",
          width: "100%",
          textAlign: "center",
          opacity: counterOpacity,
          transform: `scale(${pulse})`,
        }}
      >
        <span
          style={{
            fontSize: 180,
            fontWeight: 900,
            color: frame > 150 ? "#E63329" : "#ffffff",
            letterSpacing: -4,
            textShadow: frame > 150 ? "0 0 60px rgba(230,51,41,0.5)" : "none",
          }}
        >
          ${formatted}
        </span>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.3)", marginTop: 8, letterSpacing: 6 }}>
          POR MÊS EM FERRAMENTAS GRINGAS
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "22%",
          width: "100%",
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <span style={{ fontSize: 46, fontWeight: 700, color: "#fff" }}>
          Você já sentiu aquela{" "}
          <span style={{ color: "#E63329" }}>pontada no peito</span>
          <br />
          toda vez que o dólar sobe?
        </span>
      </div>

      <Sequence from={140}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 24,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          {["IOF 6,38%", "DÓLAR A R$ 6,20", "SUPORTE EM INGLÊS"].map((t) => (
            <div
              key={t}
              style={{
                padding: "10px 24px",
                border: "1px solid rgba(230,51,41,0.3)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.5)",
                fontSize: 18,
                letterSpacing: 2,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </Sequence>

      {/* "Deletar tudo" overlay */}
      <Sequence from={280}>
        <div
          style={{
            position: "absolute",
            top: "35%",
            width: "100%",
            textAlign: "center",
            opacity: part2Opacity,
            transform: `translateY(${part2Y}px)`,
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 700, color: "#fff" }}>
            E se você pudesse <span style={{ color: "#4ADE80" }}>deletar tudo isso</span>
            <br />
            e substituir por <span style={{ color: "#4ADE80" }}>uma única plataforma?</span>
          </span>
        </div>
      </Sequence>

      <Sequence from={340}>
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            width: "100%",
            textAlign: "center",
            opacity: economyOpacity,
            transform: `scale(${economyScale})`,
          }}
        >
          <span style={{ fontSize: 80, fontWeight: 900, color: "#4ADE80", textShadow: "0 0 60px rgba(74,222,128,0.4)" }}>
            1/10 DO PREÇO
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
