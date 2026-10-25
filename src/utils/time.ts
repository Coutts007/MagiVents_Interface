/**
 * Times are stored by the server in UTC and shown in Africa/Nairobi (EAT, UTC+3 all year: Kenya has no
 * daylight saving), whatever time zone the visitor's device is set to.
 */
export const NAIROBI_TZ = 'Africa/Nairobi';
const NAIROBI_OFFSET = '+03:00';

/** "2030-03-01T12:00" typed in a datetime-local field, read as Nairobi time -> ISO string in UTC. */
export function nairobiInputToIso(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(`${value.length === 16 ? `${value}:00` : value}${NAIROBI_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** ISO timestamp -> "2030-03-01T12:00" in Nairobi time, for a datetime-local field. */
export function isoToNairobiInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: NAIROBI_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** ISO timestamp -> "Sat 1 Mar, 12:00" in Nairobi time */
export function formatNairobiDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: NAIROBI_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}

/** 93784 seconds -> "1d 2h 3m", 3784 -> "1h 03m 04s", 64 -> "1m 04s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${minutes}m ${pad(seconds)}s`;
}

/** "HH:MM" -> minutes after midnight, or null */
function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/**
 * How long an event runs from its start to its end time. An end at or before the start is on the next day
 * (18:00 to 02:00 is 8 hours), so evening events that run past midnight need no date of their own.
 */
export function eventDuration(start: string, end: string): { minutes: number; nextDay: boolean } | null {
  const from = minutesOf(start);
  const to = minutesOf(end);
  if (from === null || to === null || from === to) return null;
  const nextDay = to < from;
  return { minutes: (nextDay ? to + 24 * 60 : to) - from, nextDay };
}

/** 510 -> "8 hours 30 minutes", 45 -> "45 minutes", 60 -> "1 hour" */
export function formatRunTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  return [hours ? part(hours, 'hour') : '', rest ? part(rest, 'minute') : ''].filter(Boolean).join(' ');
}
