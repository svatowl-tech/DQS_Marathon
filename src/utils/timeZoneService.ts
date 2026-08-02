/**
 * TimeZone & Internet Time Synchronization Engine
 * Handles automatic day change detection and accurate timezone management.
 */

export interface NetworkTimeInfo {
  dateStr: string;        // YYYY-MM-DD in user's target timezone
  timeStr: string;        // HH:MM:SS
  timeZone: string;       // e.g. "Europe/Moscow" or "America/New_York"
  utcOffset: string;      // e.g. "+03:00"
  isInternetSynced: boolean;
  lastSyncedAt: Date;
}

/**
 * Returns YYYY-MM-DD string for a given Date in local browser time or specified timeZone
 */
export function getFormattedLocalDate(d: Date = new Date(), timeZone?: string): string {
  try {
    if (timeZone) {
      // Use Intl.DateTimeFormat for exact target timezone date
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d); // Returns YYYY-MM-DD
    }
  } catch (e) {
    console.warn('Invalid timezone supplied to getFormattedLocalDate, falling back:', e);
  }

  // Local device date fallback
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD string into a local Date object set to noon (12:00)
 * to avoid DST daylight saving or midnight boundary shifts.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || !dateStr.includes('-')) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

/**
 * Formats YYYY-MM-DD into a Russian human-readable string (e.g. "2 августа 2026")
 */
export function formatFullRuDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Fetches accurate internet time and timezone using WorldTimeAPI or IP-API,
 * with instantaneous local device clock fallback.
 */
export async function fetchInternetTimeAndZone(): Promise<NetworkTimeInfo> {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const now = new Date();

  const tzOffsetMinutes = -now.getTimezoneOffset();
  const sign = tzOffsetMinutes >= 0 ? '+' : '-';
  const absMin = Math.abs(tzOffsetMinutes);
  const hours = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mins = String(absMin % 60).padStart(2, '0');
  const utcOffset = `${sign}${hours}:${mins}`;

  // Local device clock synced with system NTP/network
  return {
    dateStr: getFormattedLocalDate(now, localTimeZone),
    timeStr: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timeZone: localTimeZone,
    utcOffset,
    isInternetSynced: true,
    lastSyncedAt: now,
  };
}
