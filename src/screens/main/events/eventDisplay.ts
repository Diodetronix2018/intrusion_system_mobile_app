import type { EventStatus } from './buildEventItems';

/**
 * `"YYYY-MM-DD HH:mm:ss"` (device-local, no timezone marker) -> a
 * user-readable `"<time> · <date>"`, e.g. `"6:56 PM · 18 Sep 2026"`.
 */
export function formatEventTimestamp(datetime?: string): string {
  if (!datetime) return '';
  // `new Date()` needs a `T` separator to parse this reliably across engines.
  const parsed = new Date(datetime.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return datetime;

  const time = parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const date = parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time} · ${date}`;
}

export function eventStatusColor(
  status: EventStatus,
  colors: { success: string; warning: string; failed: string; primary: string },
): string {
  switch (status) {
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'failed':
      return colors.failed;
    default:
      return colors.primary;
  }
}
