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

/**
 * A website address as a full http(s) link ("example.co.ke" becomes "https://example.co.ke"),
 * or null when it is not a valid web address (including javascript: and other schemes).
 */
export function normalizeWebsiteUrl(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  const withScheme = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** The site's name for display, e.g. "https://www.example.co.ke/tickets" → "example.co.ke". */
export function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
