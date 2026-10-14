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
