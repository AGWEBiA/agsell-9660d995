// Avaliação de janela de agendamento de chatbot.
// Usado no client (preview) e pode ser portado para edge functions.

export interface ChatbotSchedule {
  enabled?: boolean;
  timezone?: string;          // IANA, ex: "America/Sao_Paulo"
  days?: number[];            // 0=Dom..6=Sáb
  start?: string;             // "HH:mm"
  end?: string;               // "HH:mm"
  action_outside?: 'pause' | 'fallback_human' | 'send_message';
  off_hours_message?: string;
}

export type ScheduleDecision =
  | { allow: true; reason: 'disabled' | 'in_window' }
  | {
      allow: false;
      reason: 'out_of_window';
      action: 'pause' | 'fallback_human' | 'send_message';
      off_hours_message?: string;
    };

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseHHMM(value: string | undefined, fallback: number): number {
  if (!value || !HHMM_RE.test(value)) return fallback;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function nowInTimezone(tz: string, date = new Date()): { dow: number; minutes: number } {
  // Intl com hour12=false retorna o relógio local na timezone alvo
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz || 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const wd = parts.find(p => p.type === 'weekday')?.value || 'Sun';
  const hh = Number(parts.find(p => p.type === 'hour')?.value || '0');
  const mm = Number(parts.find(p => p.type === 'minute')?.value || '0');
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dow: map[wd] ?? 0, minutes: (hh % 24) * 60 + (mm % 60) };
}

export function evaluateChatbotSchedule(
  schedule: ChatbotSchedule | undefined | null,
  now: Date = new Date(),
): ScheduleDecision {
  if (!schedule || !schedule.enabled) {
    return { allow: true, reason: 'disabled' };
  }

  const tz = schedule.timezone || 'America/Sao_Paulo';
  const { dow, minutes } = nowInTimezone(tz, now);
  const days = schedule.days && schedule.days.length > 0 ? schedule.days : [0, 1, 2, 3, 4, 5, 6];
  const start = parseHHMM(schedule.start, 0);
  const end = parseHHMM(schedule.end, 24 * 60);

  const dayOk = days.includes(dow);
  // Suporta janela cruzando meia-noite (start > end)
  const inWindow = start <= end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end;

  if (dayOk && inWindow) return { allow: true, reason: 'in_window' };

  return {
    allow: false,
    reason: 'out_of_window',
    action: schedule.action_outside || 'pause',
    off_hours_message: schedule.off_hours_message,
  };
}
