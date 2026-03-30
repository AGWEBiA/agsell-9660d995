import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgGradient = `linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 50%, #1a1a1a 100%)`;

  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const titleY = interpolate(
    spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 100 } }),
    [0, 1], [60, 0]
  );
  const titleOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subtitleOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(
    spring({ frame: frame - 35, fps, config: { damping: 20 } }),
    [0, 1], [40, 0]
  );

  const metaBadgeOp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const metaBadgeScale = spring({ frame: frame - 55, fps, config: { damping: 12, stiffness: 150 } });

  // Instagram gradient accent line
  const lineWidth = interpolate(frame, [10, 50], [0, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: bgGradient, fontFamily, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Subtle grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        {/* AG Sell Logo */}
        <div style={{
          transform: `scale(${logoScale})`,
          width: 120, height: 120, borderRadius: 24,
          background: "linear-gradient(135deg, #9B1C1C, #C53030)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 20px 60px rgba(155, 28, 28, 0.4)",
        }}>
          <span style={{ color: "white", fontSize: 48, fontWeight: 700 }}>AG</span>
        </div>

        {/* Instagram gradient line */}
        <div style={{
          width: lineWidth, height: 4, borderRadius: 2,
          background: "linear-gradient(90deg, #833AB4, #E1306C, #F77737)",
        }} />

        {/* Title */}
        <div style={{ transform: `translateY(${titleY}px)`, opacity: titleOp, textAlign: "center" }}>
          <h1 style={{ color: "white", fontSize: 64, fontWeight: 700, margin: 0, letterSpacing: -1 }}>
            Instagram Integration
          </h1>
        </div>

        {/* Subtitle */}
        <div style={{ transform: `translateY(${subtitleY}px)`, opacity: subtitleOp, textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 28, margin: 0, fontWeight: 400 }}>
            How AG Sell uses Instagram API permissions
          </p>
        </div>

        {/* Meta badge */}
        <div style={{
          opacity: metaBadgeOp, transform: `scale(${metaBadgeScale})`,
          background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 28px",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>Prepared for</span>
          <span style={{ color: "white", fontSize: 20, fontWeight: 600 }}>Meta App Review</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
