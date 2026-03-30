import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const Scene5Automations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = [
    { label: "Trigger", sub: "New Comment", x: 100, y: 220, color: "#E1306C", delay: 10 },
    { label: "Condition", sub: "Has keyword?", x: 380, y: 220, color: "#F59E0B", delay: 25 },
    { label: "Send DM", sub: "Auto reply", x: 660, y: 140, color: "#833AB4", delay: 40 },
    { label: "Add Tag", sub: '"interested"', x: 660, y: 300, color: "#22C55E", delay: 50 },
  ];

  const connections = [
    { from: { x: 220, y: 240 }, to: { x: 380, y: 240 }, delay: 20 },
    { from: { x: 500, y: 220 }, to: { x: 660, y: 160 }, delay: 35, label: "Yes" },
    { from: { x: 500, y: 260 }, to: { x: 660, y: 320 }, delay: 45, label: "No" },
  ];

  // Log entries stagger
  const logs = [
    { icon: "✅", text: "@maria commented → DM sent", time: "just now", delay: 80 },
    { icon: "✅", text: "@joao commented → Tagged 'interested'", time: "2 min ago", delay: 95 },
    { icon: "⏳", text: "@ana commented → Processing...", time: "5 min ago", delay: 110 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #f8f8f8 0%, #f0ecec 100%)", fontFamily }}>
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#9B1C1C", textTransform: "uppercase", letterSpacing: 2 }}>
          Step 4 — Automations (instagram_manage_comments)
        </span>
      </div>

      {/* Flow canvas */}
      <div style={{
        position: "absolute", top: 90, left: 80, right: 80, height: 380,
        background: "white", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
            🔄 Comment Auto-Reply Flow
          </span>
        </div>

        {/* SVG connections */}
        <svg style={{ position: "absolute", top: 60, left: 0, width: "100%", height: "100%" }}>
          {connections.map((c, i) => {
            const progress = interpolate(frame, [c.delay, c.delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const endX = c.from.x + (c.to.x - c.from.x) * progress;
            const endY = c.from.y + (c.to.y - c.from.y) * progress;
            return (
              <g key={i}>
                <line
                  x1={c.from.x} y1={c.from.y} x2={endX} y2={endY}
                  stroke="#ddd" strokeWidth={2} strokeDasharray="6 4"
                />
                {progress >= 0.5 && c.label && (
                  <text
                    x={(c.from.x + c.to.x) / 2} y={(c.from.y + c.to.y) / 2 - 10}
                    fill="#888" fontSize={12} textAnchor="middle"
                  >
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((n, i) => {
          const nOp = interpolate(frame, [n.delay, n.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const nScale = spring({ frame: frame - n.delay, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              position: "absolute", top: n.y, left: n.x,
              opacity: nOp, transform: `scale(${nScale})`,
              background: "white", borderRadius: 12, padding: "16px 20px",
              border: `2px solid ${n.color}`,
              boxShadow: `0 4px 16px ${n.color}22`,
              minWidth: 120, textAlign: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: n.color }}>{n.label}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{n.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Execution Logs */}
      <div style={{
        position: "absolute", bottom: 80, left: 80, right: 80,
        background: "white", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Execution Log</span>
        </div>
        {logs.map((l, i) => {
          const lOp = interpolate(frame, [l.delay, l.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              opacity: lOp, padding: "10px 24px",
              display: "flex", alignItems: "center", gap: 10,
              borderBottom: i < logs.length - 1 ? "1px solid #f8f8f8" : "none",
            }}>
              <span>{l.icon}</span>
              <span style={{ fontSize: 13, color: "#444", flex: 1 }}>{l.text}</span>
              <span style={{ fontSize: 11, color: "#bbb" }}>{l.time}</span>
            </div>
          );
        })}
      </div>

      {/* Permission tags */}
      <div style={{
        position: "absolute", bottom: 30, left: 80,
        opacity: interpolate(frame, [70, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        display: "flex", gap: 8,
      }}>
        {["instagram_manage_comments", "instagram_manage_messages"].map((p, i) => (
          <div key={i} style={{
            background: "rgba(155,28,28,0.08)", border: "1px solid rgba(155,28,28,0.15)",
            padding: "6px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 500, color: "#9B1C1C", fontFamily: "monospace",
          }}>
            {p}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
