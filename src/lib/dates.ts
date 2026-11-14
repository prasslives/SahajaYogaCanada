/**
 * Date helpers. The calendar is always reckoned in Toronto time, so a user
 * travelling abroad still sees the collective's calendar rather than a shifted
 * one.
 */
import { formatInTimeZone } from 'date-fns-tz';
import type { IsoDate } from '../domain/types';

export const ZONE = 'America/Toronto';

export const todayIso = (): IsoDate => formatInTimeZone(new Date(), ZONE, 'yyyy-MM-dd');

export const toDate = (iso: IsoDate): Date => new Date(`${iso}T12:00:00Z`);

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const d = toDate(iso);
  const targetDay = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(targetDay, lastDay));
  return d.toISOString().slice(0, 10);
}

export const startOfMonth = (iso: IsoDate): IsoDate => `${iso.slice(0, 7)}-01`;

export function startOfWeek(iso: IsoDate): IsoDate {
  // Weeks start on Sunday, matching how the collective's flyers read.
  return addDays(iso, -toDate(iso).getUTCDay());
}

export const monthLabel = (iso: IsoDate) => format(iso, 'MMMM yyyy');
export const dayNumber = (iso: IsoDate) => String(toDate(iso).getUTCDate());
export const isToday = (iso: IsoDate) => iso === todayIso();
export const isSameMonth = (a: IsoDate, b: IsoDate) => a.slice(0, 7) === b.slice(0, 7);

export function format(iso: IsoDate, pattern: string): string {
  return formatInTimeZone(`${iso}T12:00:00Z`, 'UTC', pattern);
}

export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Six rows of seven dates covering the month, padded with neighbouring days so
 * the grid never changes height between months.
 */
export function monthMatrix(monthIso: IsoDate): IsoDate[][] {
  const first = startOfMonth(monthIso);
  const gridStart = startOfWeek(first);
  const weeks: IsoDate[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const row: IsoDate[] = [];
    for (let day = 0; day < 7; day++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** "Friday, 4 September 2026" */
export const longDate = (iso: IsoDate) => format(iso, 'EEEE, d MMMM yyyy');
/** "Fri 4 Sep" */
export const shortDate = (iso: IsoDate) => format(iso, 'EEE d MMM');

/** "in 3 days" / "today" / "tomorrow" */
export function relativeLabel(iso: IsoDate, from: IsoDate = todayIso()): string {
  const days = Math.round((toDate(iso).getTime() - toDate(from).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < 0) return `${Math.abs(days)} days ago`;
  return '';
}
