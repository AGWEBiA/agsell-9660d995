import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const Scene2OAuth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step indicator
  const step = frame < 60 ? 1 : frame < 120 ? 2 : 3;

  const panelOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const panelScale = spring({ frame, fps, config: { damping: 20, stiffness: 150 } });

  // Button click animation at frame 50
  const btnClick = frame >= 48 && frame <= 54 ? 0.95 : 1;
  
  // Loading spinner appears at frame 60
  const loadingOp = interpolate(frame, [60, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spinnerRotation = (frame - 60) * 8;

  // Facebook login modal at frame 80
  const fbModalOp = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fbModalScale = spring({ frame: frame - 80, fps, config: { damping: 15 } });

  // Success checkmark at frame 140
  const successOp = interpolate(frame, [140, 155], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const successScale = spring({ frame: frame - 140, fps, config: { damping: 10, stiffness: 200 } });

  // Permission list items stagger
  const permItems = [
    { label: "instagram_basic", desc: "Read profile info", delay: 95 },
    { label: "instagram_manage_messages", desc: "Send & receive DMs", delay: 105 },
    { label: "instagram_manage_comments", desc: "Read & reply comments", delay: 115 },
    { label: "pages_show_list", desc: "List connected pages", delay: 125 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #f8f8f8 0%, #f0ecec 100%)", fontFamily }}>
      {/* Header label */}
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#9B1C1C", textTransform: "uppercase", letterSpacing: 2 }}>
          Step 1 — OAuth Connection
        </span>
      </div>

      {/* Main panel - AG Sell Settings */}
      <div style={{
        position: "absolute", top: 100, left: 80, width: 800, 
        opacity: panelOp, transform: `scale(${panelScale})`,
        background: "white", borderRadius: 16, padding: 40,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px 0" }}>Conectar Instagram</h2>
        <p style={{ fontSize: 16, color: "#666", margin: "0 0 30px 0" }}>
          Vincule sua conta do Instagram Business para gerenciar mensagens e automações.
        </p>

        {/* Connect button */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
          color: "white", padding: "14px 32px", borderRadius: 12,
          fontSize: 18, fontWeight: 600,
          transform: `scale(${btnClick})`,
          cursor: "pointer",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="18" cy="6" r="1.5" fill="white"/>
          </svg>
          Conectar com Instagram
        </div>

        {/* Loading state */}
        {frame >= 60 && frame < 140 && (
          <div style={{
            opacity: loadingOp, marginTop: 20,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 20, height: 20, border: "3px solid #E1306C",
              borderTopColor: "transparent", borderRadius: "50%",
              transform: `rotate(${spinnerRotation}deg)`,
            }} />
            <span style={{ fontSize: 14, color: "#666" }}>Autenticando via Meta...</span>
          </div>
        )}

        {/* Success */}
        {frame >= 140 && (
          <div style={{
            opacity: successOp, marginTop: 20,
            display: "flex", alignItems: "center", gap: 12,
            background: "#f0fdf4", padding: "12px 20px", borderRadius: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${successScale})`,
            }}>
              <span style={{ color: "white", fontSize: 16 }}>✓</span>
            </div>
            <span style={{ fontSize: 15, color: "#166534", fontWeight: 500 }}>
              Conta conectada com sucesso — @agsell.oficial
            </span>
          </div>
        )}
      </div>

      {/* Facebook/Meta Login Modal (right side) */}
      {frame >= 80 && (
        <div style={{
          position: "absolute", top: 120, right: 80, width: 500,
          opacity: fbModalOp, transform: `scale(${fbModalScale})`,
          background: "white", borderRadius: 12, overflow: "hidden",
          boxShadow: "0 12px 50px rgba(0,0,0,0.15)", border: "1px solid #e5e5e5",
        }}>
          {/* FB Header */}
          <div style={{ background: "#1877F2", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "white", fontSize: 22, fontWeight: 700 }}>f</span>
            <span style={{ color: "white", fontSize: 16, fontWeight: 600 }}>Log in with Facebook</span>
          </div>

          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 14, color: "#444", margin: "0 0 16px 0" }}>
              AG Sell is requesting the following permissions:
            </p>

            {permItems.map((item, i) => {
              const itemOp = interpolate(frame, [item.delay, item.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const itemX = interpolate(
                spring({ frame: frame - item.delay, fps, config: { damping: 20 } }),
                [0, 1], [30, 0]
              );
              return (
                <div key={i} style={{
                  opacity: itemOp, transform: `translateX(${itemX}px)`,
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0", borderBottom: i < permItems.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: frame >= item.delay + 15 ? "#22c55e" : "#ddd",
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "monospace" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}

            {/* Allow button */}
            {frame >= 130 && (
              <div style={{
                marginTop: 20,
                opacity: interpolate(frame, [130, 138], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}>
                <div style={{
                  background: "#1877F2", color: "white", textAlign: "center",
                  padding: "12px 0", borderRadius: 8, fontSize: 15, fontWeight: 600,
                  transform: `scale(${frame >= 135 && frame <= 139 ? 0.96 : 1})`,
                }}>
                  Allow
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
