import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const Scene4Inbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const messages = [
    { name: "Maria Silva", msg: "Olá! Gostaria de saber sobre preços", time: "2 min", unread: true, delay: 10 },
    { name: "João Santos", msg: "Quando vocês abrem?", time: "5 min", unread: true, delay: 20 },
    { name: "Ana Costa", msg: "Obrigada pela informação!", time: "12 min", unread: false, delay: 30 },
    { name: "Pedro Lima", msg: "Vocês fazem entrega?", time: "1h", unread: false, delay: 40 },
  ];

  const chatMessages = [
    { sender: "contact", text: "Olá! Gostaria de saber sobre preços do plano Pro.", delay: 60 },
    { sender: "agent", text: "Olá Maria! 😊 O plano Pro custa R$197/mês e inclui automações ilimitadas.", delay: 90 },
    { sender: "contact", text: "Tem desconto para pagamento anual?", delay: 120 },
  ];

  // AI suggestion appears at frame 150
  const aiOp = interpolate(frame, [150, 165], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const aiScale = spring({ frame: frame - 150, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #f8f8f8 0%, #f0ecec 100%)", fontFamily }}>
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#9B1C1C", textTransform: "uppercase", letterSpacing: 2 }}>
          Step 3 — Unified Inbox (instagram_manage_messages)
        </span>
      </div>

      {/* Conversation list */}
      <div style={{
        position: "absolute", top: 100, left: 80, width: 380,
        background: "white", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>📥 Inbox — Instagram</span>
        </div>
        {messages.map((m, i) => {
          const itemOp = interpolate(frame, [m.delay, m.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              opacity: itemOp,
              padding: "16px 24px", borderBottom: "1px solid #f5f5f5",
              background: i === 0 && frame > 50 ? "#fef2f2" : "transparent",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `hsl(${i * 60 + 200}, 50%, 85%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 600, color: "#555",
              }}>
                {m.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{m.name}</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{m.time}</span>
                </div>
                <span style={{ fontSize: 13, color: "#888" }}>{m.msg}</span>
              </div>
              {m.unread && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E1306C" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat panel */}
      <div style={{
        position: "absolute", top: 100, left: 490, right: 80,
        background: "white", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        height: 520,
      }}>
        {/* Chat header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#e0d4f5",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 600, color: "#555",
          }}>M</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Maria Silva</div>
            <div style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2"/>
                <circle cx="12" cy="12" r="5" stroke="#E1306C" strokeWidth="2"/>
              </svg>
              via Instagram DM
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {chatMessages.map((cm, i) => {
            const cOp = interpolate(frame, [cm.delay, cm.delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const cY = interpolate(
              spring({ frame: frame - cm.delay, fps, config: { damping: 20 } }),
              [0, 1], [20, 0]
            );
            const isAgent = cm.sender === "agent";
            return (
              <div key={i} style={{
                opacity: cOp, transform: `translateY(${cY}px)`,
                alignSelf: isAgent ? "flex-end" : "flex-start",
                maxWidth: "70%",
              }}>
                <div style={{
                  padding: "12px 18px", borderRadius: 14,
                  background: isAgent ? "#9B1C1C" : "#f5f5f5",
                  color: isAgent ? "white" : "#1a1a1a",
                  fontSize: 14,
                }}>
                  {cm.text}
                </div>
              </div>
            );
          })}

          {/* AI suggestion */}
          {frame >= 150 && (
            <div style={{
              opacity: aiOp, transform: `scale(${aiScale})`,
              alignSelf: "flex-end", maxWidth: "75%",
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "1px solid #fbbf24",
              borderRadius: 14, padding: "14px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>SendIA — AI Suggestion</span>
              </div>
              <div style={{ fontSize: 13, color: "#78350f" }}>
                "Sim! No plano anual você economiza 20%, ficando R$157/mês. Quer que eu envie o link?"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permission tag */}
      <div style={{
        position: "absolute", bottom: 40, left: 80,
        opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          background: "rgba(155,28,28,0.08)", border: "1px solid rgba(155,28,28,0.15)",
          padding: "8px 16px", borderRadius: 8,
          fontSize: 13, fontWeight: 500, color: "#9B1C1C", fontFamily: "monospace",
        }}>
          instagram_manage_messages
        </div>
      </div>
    </AbsoluteFill>
  );
};
