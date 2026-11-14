/**
 * Parser for the Shri Mataji Foundation puja calendar (an iCalendar feed from
 * The Events Calendar plugin).
 *
 * The important quirk: DTSTART/DTEND span the whole puja *weekend*, three or
 * four days, while the day the puja is actually celebrated is written only in
 * the DESCRIPTION, as "Date: Sunday 6th September". Keying off DTSTART would
 * put every puja on the wrong day, so the description is the field we trust.
 */
import type { IsoDate } from '../domain/types';

export interface CabellaPuja {
  /** Stable identifier from the feed, used to match on re-sync. */
  uid: string;
  title: string;
  /** The day the puja is celebrated. */
  pujaDate: IsoDate;
  /** First and last day of the surrounding gathering. */
  weekendStart: IsoDate;
  weekendEnd: IsoDate;
  description?: string;
  location?: string;
  url?: string;
  imageUrl?: string;
  /** True when the exact date had to be inferred rather than read. */
  dateInferred: boolean;
}

/** The feed URL for a whole calendar year. */
export function cabellaFeedUrl(year: number): string {
  return `https://shrimatajifoundation.org/?post_type=tribe_events&ical=1&eventDisplay=list&tribe-bar-date=${year}-01-01`;
}

/** Undo RFC 5545 line folding: continuation lines begin with a space or tab. */
function unfold(ics: string): string[] {
  const lines = ics.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Undo RFC 5545 text escaping. */
function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\;/g, ';')
    .replace(/\\\\/g, '\\');
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** `20260904` -> `2026-09-04`. */
function parseIcsDate(value: string): IsoDate {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 8);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

const dayDifference = (a: IsoDate, b: IsoDate) =>
  Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000;

/**
 * Pull the celebrated date out of a description such as
 * "Date: Sunday 6th September".
 *
 * The description carries no year, so the year is taken from the surrounding
 * weekend. A puja weekend can straddle New Year, so neighbouring years are
 * tried and the reading closest to the weekend wins.
 */
export function extractPujaDate(description: string, weekendStart: IsoDate): IsoDate | null {
  const match = description.match(
    /Date:\s*(?:[A-Za-z]+day)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)/i,
  );
  if (!match) return null;

  const day = Number(match[1]);
  const monthIndex = MONTHS.indexOf(match[2].toLowerCase());
  if (monthIndex < 0 || day < 1 || day > 31) return null;

  const baseYear = Number(weekendStart.slice(0, 4));
  const candidates = [baseYear, baseYear - 1, baseYear + 1].map(
    (year) =>
      `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );

  return candidates.reduce((best, candidate) =>
    dayDifference(candidate, weekendStart) < dayDifference(best, weekendStart) ? candidate : best,
  );
}

/**
 * Parse a Cabella iCal feed into puja records.
 *
 * When the description is missing or unreadable the puja date falls back to
 * the middle of the weekend and `dateInferred` is set, so a coordinator can be
 * asked to confirm rather than the app quietly publishing a guess.
 */
export function parseCabellaFeed(ics: string): CabellaPuja[] {
  const lines = unfold(ics);
  const out: CabellaPuja[] = [];

  let current: Record<string, string> | null = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {};
      continue;
    }
    if (line.startsWith('END:VEVENT')) {
      if (current) {
        const puja = buildPuja(current);
        if (puja) out.push(puja);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const name = line.slice(0, separator).split(';')[0].toUpperCase();
    const value = line.slice(separator + 1);
    // ATTACH can repeat; the first image is the event artwork.
    if (name in current) continue;
    current[name] = value;
  }

  return out.sort((a, b) => a.pujaDate.localeCompare(b.pujaDate));
}

function buildPuja(fields: Record<string, string>): CabellaPuja | null {
  if (!fields.DTSTART || !fields.SUMMARY) return null;

  const weekendStart = parseIcsDate(fields.DTSTART);
  // DTEND on an all-day event is exclusive, so step back to the last real day.
  const rawEnd = fields.DTEND ? parseIcsDate(fields.DTEND) : weekendStart;
  const endDate = new Date(`${rawEnd}T00:00:00Z`);
  if (fields.DTEND) endDate.setUTCDate(endDate.getUTCDate() - 1);
  const weekendEnd = endDate.toISOString().slice(0, 10);

  const description = fields.DESCRIPTION ? unescapeText(fields.DESCRIPTION) : '';
  const extracted = description ? extractPujaDate(description, weekendStart) : null;

  let pujaDate = extracted;
  let dateInferred = false;
  if (!pujaDate) {
    // Fall back to the middle of the weekend.
    const middle = new Date(`${weekendStart}T00:00:00Z`);
    const span = dayDifference(weekendStart, weekendEnd);
    middle.setUTCDate(middle.getUTCDate() + Math.floor(span / 2));
    pujaDate = middle.toISOString().slice(0, 10);
    dateInferred = true;
  }

  return {
    uid: fields.UID ?? `${fields.SUMMARY}-${weekendStart}`,
    title: unescapeText(fields.SUMMARY).trim(),
    pujaDate,
    weekendStart,
    weekendEnd,
    description: description || undefined,
    location: fields.LOCATION ? unescapeText(fields.LOCATION) : undefined,
    url: fields.URL,
    imageUrl: fields.ATTACH,
    dateInferred,
  };
}
