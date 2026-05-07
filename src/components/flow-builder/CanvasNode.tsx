import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Settings, X, StickyNote } from 'lucide-react';
import type { FlowNode } from './flowNodeTypes';
import { triggerOptions, actionOptions, conditionOptions, WEEKDAYS } from './flowNodeTypes';

interface CanvasNodeProps {
  node: FlowNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPortMouseDown: (port: 'default' | 'yes' | 'no', e: React.MouseEvent) => void;
  onInputMouseUp: () => void;
  isConnecting: boolean;
  analytics?: { entries_count: number; conversions_count: number; errors_count: number };
  onResizeStart?: (e: React.MouseEvent) => void;
  nodeScale?: number;
}

// Map subtypes to icon background colors (SellFlux style)
const ICON_BG_COLORS: Record<string, string> = {
  // WhatsApp related
  send_whatsapp: 'bg-green-600',
  send_whatsapp_group: 'bg-green-600',
  whatsapp_received: 'bg-green-600',
  whatsapp_keyword: 'bg-green-600',
  whatsapp_automation: 'bg-green-600',
  add_to_whatsapp_group: 'bg-green-600',
  // Tags
  tag_added: 'bg-zinc-700',
  tag_removed: 'bg-zinc-700',
  add_tag: 'bg-zinc-700',
  remove_tag: 'bg-zinc-700',
  // Timer
  timer: 'bg-zinc-800',
  // Edit group
  edit_whatsapp_group: 'bg-zinc-600',
  // Email
  send_email_marketing: 'bg-blue-600',
  send_email_performance: 'bg-blue-600',
  // Instagram
  instagram_comment: 'bg-pink-600',
  instagram_dm: 'bg-pink-600',
  send_instagram_dm: 'bg-pink-600',
  // Conditions
  conditional: 'bg-amber-600',
  if_tag: 'bg-amber-600',
  if_keyword: 'bg-amber-600',
  if_score: 'bg-amber-600',
};

export function CanvasNode({
  node,
  onMouseDown,
  onEdit,
  onDelete,
  onPortMouseDown,
  onInputMouseUp,
  isConnecting,
  analytics,
  onResizeStart,
  nodeScale = 1,
}: CanvasNodeProps) {
  if (!node.position) return null;

  const getTriggerInfo = () => triggerOptions.find(t => t.id === node.subtype);
  const getActionInfo = () => [...actionOptions, ...conditionOptions].find(a => a.id === node.subtype);

  const getNodeSummary = () => {
    const c = node.config;
    const statusLabels: Record<string, string> = {
      cart_abandoned: 'Abandonou carrinho', purchase_approved: 'Compra aprovada',
      purchase_completed: 'Compra realizada', boleto_generated: 'Boleto gerado',
      refund: 'Reembolso', new: 'Novo lead', engaged: 'Engajado',
      qualified: 'Qualificado', customer: 'Cliente', inactive: 'Inativo',
    };
    switch (node.subtype) {
      case 'timer':
        if (c.timer_mode === 'specific_date' && c.specific_date) return `Em ${String(c.specific_date)}`;
        return `${c.duration || 1} ${c.unit === 'hours' ? 'h' : c.unit === 'days' ? 'dias' : 'min'}`;
      case 'warmup': return `${c.leads_per_minute || 1} leads/min`;
      case 'send_email_marketing':
      case 'send_email_performance':
        return c.subject ? `"${String(c.subject)}"` : '';
      default:
        if (c.message) return `"${String(c.message).slice(0, 30)}..."`;
        if (c.tag_name) return `Tag: ${String(c.tag_name)}`;
        return '';
    }
  };

  const info = node.type === 'trigger' ? getTriggerInfo() : getActionInfo();
  if (!info) return null;
  const Icon = info.icon;
  const summary = getNodeSummary();
  const isCondition = node.type === 'condition';
  const NODE_WIDTH = Math.round(180 * nodeScale);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  const handleDeleteMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit();
  };

  const handleSettingsMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Touch + Mouse interaction model:
  //  - Mouse: short click (<220ms, <5px move) → open settings. Otherwise drag.
  //  - Touch: tap (<300ms, <8px move) → open settings. Long-press (>350ms) → start drag.
  // Telemetry is recorded on window.__flowBuilderTelemetry for inspection.
  const CLICK_MOVE_THRESHOLD = 5;
  const CLICK_HOLD_THRESHOLD_MS = 220;
  const TAP_MOVE_THRESHOLD = 8;
  const TAP_MAX_MS = 300;
  const LONG_PRESS_MS = 350;

  const recordTelemetry = (event: string, extra: Record<string, unknown> = {}) => {
    try {
      const w = window as unknown as { __flowBuilderTelemetry?: { events: Array<Record<string, unknown>>; counts: Record<string, number> } };
      if (!w.__flowBuilderTelemetry) {
        w.__flowBuilderTelemetry = { events: [], counts: {} };
      }
      const t = w.__flowBuilderTelemetry;
      t.counts[event] = (t.counts[event] || 0) + 1;
      t.events.push({ ts: Date.now(), event, nodeId: node.id, subtype: node.subtype, ...extra });
      if (t.events.length > 200) t.events.shift();
      // Detect false positive: user moved a lot but no edit/drag fired
      if (event === 'click_aborted_no_action') {
        // eslint-disable-next-line no-console
        console.warn('[FlowBuilder] False-positive interaction (no edit/drag fired)', { nodeId: node.id, ...extra });
      }
    } catch { /* noop */ }
  };

  const handleBodyMouseDown = (e: React.MouseEvent) => {
    // Ignore synthetic mouse events that follow touch (handled by touch handler)
    // Only left button
    if (e.button !== 0) {
      onMouseDown(e);
      return;
    }
    onMouseDown(e);
    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = Date.now();
    let moved = false;
    recordTelemetry('mouse_down');

    const onMove = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - startX) > CLICK_MOVE_THRESHOLD || Math.abs(ev.clientY - startY) > CLICK_MOVE_THRESHOLD) {
        if (!moved) recordTelemetry('drag_started');
        moved = true;
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const elapsed = Date.now() - startTime;
      if (!moved && elapsed < CLICK_HOLD_THRESHOLD_MS) {
        recordTelemetry('click_opened_edit', { elapsed });
        onEdit();
      } else if (!moved) {
        recordTelemetry('click_aborted_no_action', { elapsed, reason: 'held_too_long' });
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleBodyTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startTime = Date.now();
    let moved = false;
    let dragMode = false;
    recordTelemetry('touch_start');

    const longPressTimer = window.setTimeout(() => {
      if (!moved) {
        dragMode = true;
        recordTelemetry('long_press_drag_start');
        // Begin drag by synthesizing the same event the canvas expects.
        onMouseDown({
          stopPropagation: () => {},
          preventDefault: () => {},
          clientX: startX,
          clientY: startY,
          button: 0,
        } as unknown as React.MouseEvent);
        // Haptic hint if available
        try { (navigator as Navigator & { vibrate?: (p: number) => void }).vibrate?.(15); } catch { /* noop */ }
      }
    }, LONG_PRESS_MS);

    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (!t) return;
      if (Math.abs(t.clientX - startX) > TAP_MOVE_THRESHOLD || Math.abs(t.clientY - startY) > TAP_MOVE_THRESHOLD) {
        moved = true;
      }
    };
    const onEnd = () => {
      window.clearTimeout(longPressTimer);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      const elapsed = Date.now() - startTime;
      if (dragMode) {
        recordTelemetry('long_press_drag_end', { elapsed });
        return;
      }
      if (!moved && elapsed < TAP_MAX_MS) {
        recordTelemetry('tap_opened_edit', { elapsed });
        onEdit();
      } else {
        recordTelemetry('tap_aborted_no_action', { elapsed, moved });
      }
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  // Note node special rendering
  if (node.subtype === 'note') {
    const noteColorMap: Record<string, { bg: string; border: string; text: string }> = {
      yellow: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: 'rgba(250,204,21,0.9)' },
      green: { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)', text: 'rgba(74,222,128,0.9)' },
      blue: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: 'rgba(96,165,250,0.9)' },
      pink: { bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.4)', text: 'rgba(244,114,182,0.9)' },
      red: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', text: 'rgba(248,113,113,0.9)' },
      purple: { bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)', text: 'rgba(192,132,252,0.9)' },
    };
    const colorKey = (node.config.color as string) || 'yellow';
    const colors = noteColorMap[colorKey] || noteColorMap.yellow;
    const noteW = (node.config.width as number) || 260;
    const noteH = (node.config.height as number) || 120;

    return (
      <div
        className="absolute select-none group"
        style={{
          left: node.position.x,
          top: node.position.y,
          width: noteW,
          height: noteH,
          zIndex: 0,
        }}
      >
        <div
          className="w-full h-full rounded-xl cursor-move relative"
          style={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onEdit}
        >
          <button
            onClick={handleDeleteClick}
            onMouseDown={handleDeleteMouseDown}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            onClick={handleSettingsClick}
            onMouseDown={handleSettingsMouseDown}
            className="absolute top-2 right-2 h-6 w-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <Settings className="h-3.5 w-3.5" style={{ color: colors.text }} />
          </button>
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <StickyNote className="h-3.5 w-3.5" style={{ color: colors.text }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>Nota</span>
            </div>
            <p className="text-xs text-white/70 flex-1 overflow-hidden leading-relaxed">
              {node.config.text ? String(node.config.text) : 'Duplo clique para editar...'}
            </p>
          </div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(e);
            }}
            style={{ borderRight: `3px solid ${colors.border}`, borderBottom: `3px solid ${colors.border}`, borderRadius: '0 0 10px 0' }}
          />
        </div>
      </div>
    );
  }

  // ── SellFlux-style node: centered icon, label below, badges ──
  const iconBg = ICON_BG_COLORS[node.subtype] || 'bg-zinc-700';
  const iconBoxSize = Math.round(44 * nodeScale);
  const iconInnerSize = Math.round(22 * nodeScale);
  const fontSize = Math.max(9, Math.round(11 * nodeScale));
  const summaryFontSize = Math.max(8, Math.round(9 * nodeScale));

  // Count groups or relevant info for subtitle
  const getSubtitle = () => {
    const c = node.config;
    if (c.groups && Array.isArray(c.groups)) return `${(c.groups as unknown[]).length} grupo${(c.groups as unknown[]).length !== 1 ? 's' : ''}`;
    if (c.group_jid) return '1 grupo';
    if (summary) return summary;
    return '';
  };

  const subtitle = getSubtitle();

  return (
    <div
      className="absolute select-none"
      style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH }}
    >
      {/* Input port */}
      <div
        className={cn("absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 transition-all",
          isConnecting ? "border-primary bg-primary/30 scale-125 cursor-crosshair" : "border-white/20 bg-[#1a1a2e]"
        )}
        onMouseUp={onInputMouseUp}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>

      {/* Node body — SellFlux centered style */}
      <div
        className="relative rounded-xl cursor-move group transition-colors"
        onMouseDown={handleBodyMouseDown}
        onDoubleClick={onEdit}
      >
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          onMouseDown={handleDeleteMouseDown}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 ring-2 ring-background"
          title="Excluir nó"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Settings button — always visible, larger and more prominent */}
        <button
          onClick={handleSettingsClick}
          onMouseDown={handleSettingsMouseDown}
          className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity z-20 hover:bg-primary shadow-md ring-2 ring-background"
          title="Configurar"
        >
          <Settings className="h-3 w-3" />
        </button>

        {/* Centered icon box */}
        <div className="flex flex-col items-center">
          <div
            className={cn('rounded-xl flex items-center justify-center shadow-lg', iconBg)}
            style={{ width: iconBoxSize, height: iconBoxSize }}
          >
            <Icon style={{ width: iconInnerSize, height: iconInnerSize }} className="text-white" />
          </div>

          {/* Label + subtitle */}
          <p
            className="font-semibold text-white text-center mt-1.5 leading-tight truncate w-full"
            style={{ fontSize }}
          >
            {info.label}
            {subtitle && (
              <span className="text-white/50 font-normal"> | {subtitle}</span>
            )}
          </p>

          {/* Timer extra info */}
          {node.subtype === 'timer' && node.config.days && Array.isArray(node.config.days) && (
            <p className="text-white/30 text-center truncate w-full" style={{ fontSize: summaryFontSize }}>
              {(node.config.days as string[]).map(d => {
                const day = WEEKDAYS.find(w => w.value === d);
                return day ? day.label.slice(0, 3) + '.' : d;
              }).join(', ')}
            </p>
          )}

          {/* Analytics badges — SellFlux colored badges */}
          {analytics && (
            <div className="flex gap-1 mt-1.5">
              <span className="inline-flex items-center justify-center min-w-[18px] h-[16px] rounded text-[8px] font-bold px-1 bg-green-600 text-white">{analytics.entries_count}</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[16px] rounded text-[8px] font-bold px-1 bg-yellow-500 text-white">{analytics.conversions_count}</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[16px] rounded text-[8px] font-bold px-1 bg-red-600 text-white">{analytics.errors_count}</span>
            </div>
          )}

          {/* Condition branches */}
          {isCondition && (
            <div className="mt-1.5 flex gap-1.5 w-full">
              <div className="flex-1 rounded bg-green-900/40 py-0.5 text-center text-green-400 text-[9px] border border-green-700/30">✅ Sim</div>
              <div className="flex-1 rounded bg-red-900/40 py-0.5 text-center text-red-400 text-[9px] border border-red-700/30">❌ Não</div>
            </div>
          )}
        </div>
      </div>

      {/* Output ports */}
      {isCondition ? (
        <div className="flex justify-between px-6 mt-1">
          <div
            className="flex flex-col items-center gap-0.5 cursor-crosshair"
            onMouseDown={(e) => onPortMouseDown('yes', e)}
          >
            <div className="h-5 w-5 rounded-full border-2 border-green-500/50 bg-[#1a1a2e] flex items-center justify-center hover:border-green-400 hover:bg-green-500/20 transition-all">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            </div>
          </div>
          <div
            className="flex flex-col items-center gap-0.5 cursor-crosshair"
            onMouseDown={(e) => onPortMouseDown('no', e)}
          >
            <div className="h-5 w-5 rounded-full border-2 border-red-500/50 bg-[#1a1a2e] flex items-center justify-center hover:border-red-400 hover:bg-red-500/20 transition-all">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-1">
          <div
            className="h-5 w-5 rounded-full border-2 border-white/20 bg-[#1a1a2e] flex items-center justify-center cursor-crosshair hover:border-primary hover:bg-primary/20 transition-all"
            onMouseDown={(e) => onPortMouseDown('default', e)}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      )}
    </div>
  );
}