/**
 * UTC-based calendar date helpers, matching the backend's TIME_ZONE=UTC day
 * boundaries for streak/goal calculations (no per-user timezone exists yet).
 */

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function mostRecentMondayUTC(from: Date = new Date()): Date {
  const day = from.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(from);
  monday.setUTCDate(from.getUTCDate() - diff);
  return monday;
}

export function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function monthRangeUTC(from: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0));
  return { start, end };
}
