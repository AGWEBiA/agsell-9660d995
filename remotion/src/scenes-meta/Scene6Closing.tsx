import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const Scene6Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const perms = [
    { name: "instagram_basic", use: "Display connected account profile", icon: "👤" },
    { name: "instagram_manage_messages", use: "Unified inbox & automated DMs", icon: "💬" },
    { name: "instagram_manage_comments", use: "Monitor & auto-reply to comments", icon: "📝" },
    { name: "pages_show_list", use: "Identify linked Facebook Page", icon: "📄" },
    { name: "pages_read_engagement", use: "Performance reports & metrics", icon: "📊" },
    { name: "business_management", use: "Verify business assets", icon: "🏢" },
  ];

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleScale = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 50%, #1a1a1a 100%)",
      fontFamily, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 1200 }}>
        {/* Title */}
        <div style={{
          opacity: titleOp, transform: `scale(${titleScale})`,
          textAlign: "center", marginBottom: 50,
        }}>
          <h2 style={{ color: "white", fontSize: 44, fontWeight: 700, margin: 0 }}>
            Permissions Summary
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, margin: "8px 0 0 0" }}>
            Each permission is essential for AG Sell's Instagram features
          </p>
        </div>

        {/* Permission grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>
          {perms.map((p, i) => {
            const delay = 20 + i * 10;
            const pOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const pX = interpolate(
              spring({ frame: frame - delay, fps, config: { damping: 20 } }),
              [0, 1], [i % 2 === 0 ? -40 : 40, 0]
            );
            return (
              <div key={i} style={{
                opacity: pOp, transform: `translateX(${pX}px)`,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "18px 24px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: "#E1306C",
                    fontFamily: "monospace",
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                    {p.use}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 50,
          opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #9B1C1C, #C53030)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>AG</span>
          </div>
          <div>
            <div style={{ color: "white", fontSize: 20, fontWeight: 700 }}>AG Sell</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>agsell.lovable.app</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
