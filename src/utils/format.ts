/** Formats an amount in Kenyan shillings, e.g. 1500 -> "KSh 1,500". Free (0) shows "Free" unless `zeroLabel` is null. */
export function formatKES(amount: number, zeroLabel: string | null = 'Free'): string {
  if (amount === 0 && zeroLabel !== null) return zeroLabel;
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}

/** First letter of the first two names, e.g. "Amani Wanjiru Otieno" -> "AW", "amani" -> "A". */
export function getInitials(name: string | undefined | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';
}

/** Local calendar date as "YYYY-MM-DD", comparable with EventItem.isoDate */
export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
