import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const Scene3Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });

  const stats = [
    { label: "Followers", value: "12.4K", delay: 30 },
    { label: "Messages", value: "847", delay: 40 },
    { label: "Comments", value: "2.1K", delay: 50 },
    { label: "Automations", value: "5", delay: 60 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #f8f8f8 0%, #f0ecec 100%)", fontFamily }}>
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#9B1C1C", textTransform: "uppercase", letterSpacing: 2 }}>
          Step 2 — Connected Account (instagram_basic)
        </span>
      </div>

      {/* Profile Card */}
      <div style={{
        position: "absolute", top: 100, left: 80, width: 500,
        transform: `scale(${cardScale})`,
        background: "white", borderRadius: 16, padding: 32,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
            padding: 3,
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "#333" }}>AG</span>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>@agsell.oficial</span>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#3B82F6",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "white", fontSize: 10 }}>✓</span>
              </div>
            </div>
            <span style={{ fontSize: 14, color: "#888" }}>AG Sell • Business Account</span>
          </div>
        </div>

        {/* Green connected badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          padding: "8px 16px", borderRadius: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#166534" }}>Conectada e ativa</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        position: "absolute", top: 100, right: 80,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: 440,
      }}>
        {stats.map((s, i) => {
          const sOp = interpolate(frame, [s.delay, s.delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sScale = spring({ frame: frame - s.delay, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              opacity: sOp, transform: `scale(${sScale})`,
              background: "white", borderRadius: 14, padding: "24px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#1a1a1a" }}>{s.value}</div>
              <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Permissions used annotation */}
      <div style={{
        position: "absolute", bottom: 60, left: 80, right: 80,
        opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        display: "flex", gap: 12, flexWrap: "wrap" as const,
      }}>
        {["instagram_basic", "pages_show_list", "business_management"].map((perm, i) => (
          <div key={i} style={{
            background: "rgba(155,28,28,0.08)", border: "1px solid rgba(155,28,28,0.15)",
            padding: "8px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: "#9B1C1C", fontFamily: "monospace",
          }}>
            {perm}
          </div>
        ))}
        <div style={{ fontSize: 13, color: "#888", display: "flex", alignItems: "center", marginLeft: 8 }}>
          ← Permissions used in this view
        </div>
      </div>
    </AbsoluteFill>
  );
};
