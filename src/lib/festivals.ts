/**
 * Festival rules.
 *
 * Sahaja Yoga celebrates across traditions, so this covers Hindu lunisolar
 * festivals, Christian moveable feasts, Buddhist Vesak and the major Islamic
 * observances.
 *
 * Every rule produces a *candidate* date. Some festivals are traditionally
 * fixed by a rule finer than "the tithi at sunrise" -- Janmashtami uses the
 * midnight (nishita) period, Diwali the evening (pradosh) -- and those are
 * marked `needsVerification` so they surface for human review rather than
 * being trusted silently.
 */
import {
  buildPanchangTable,
  lunationsBetween,
  siderealSunLongitude,
  tithiAt,
  windowOn,
  type LunarMonth,
  type Lunation,
  type ObservanceWindow,
  type PanchangDay,
  type PanchangLocation,
} from './panchang';
import type { IsoDate } from '../domain/types';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import * as Astronomy from 'astronomy-engine';

export type Tradition = 'hindu' | 'christian' | 'buddhist' | 'islamic' | 'sikh';

interface BaseRule {
  key: string;
  name: string;
  tradition: Tradition;
  /** Shown on the day detail screen. */
  note?: string;
  /**
   * True when the traditional determination uses a rule finer than the tithi
   * at sunrise, so the computed date may be off by a day.
   */
  needsVerification?: boolean;
}

type Rule = BaseRule &
  (
    | { kind: 'lunar'; month: LunarMonth; tithi: number; window?: ObservanceWindow }
    | { kind: 'lunarRange'; month: LunarMonth; fromTithi: number; toTithi: number;
        fromWindow?: ObservanceWindow; toWindow?: ObservanceWindow }
    | { kind: 'solarIngress'; degrees: number }
    | { kind: 'gregorian'; month: number; day: number }
    | { kind: 'easterOffset'; offsetDays: number }
    | { kind: 'hijri'; month: number; day: number }
    | { kind: 'relative'; toKey: string; offsetDays: number }
  );

/**
 * Tithi numbering used below is the 1..30 scheme from panchang.ts:
 * 1..15 shukla (15 = Purnima), 16..30 krishna (30 = Amavasya).
 */
export const FESTIVAL_RULES: Rule[] = [
  // --- Hindu, solar --------------------------------------------------------
  { kind: 'solarIngress', degrees: 270, key: 'makar-sankranti', name: 'Makar Sankranti', tradition: 'hindu',
    note: 'Sun enters Makara (Capricorn).' },
  { kind: 'solarIngress', degrees: 0, key: 'vaisakhi', name: 'Vaisakhi / Mesha Sankranti', tradition: 'sikh',
    note: 'Sun enters Mesha (Aries).' },

  // --- Hindu, lunar --------------------------------------------------------
  { kind: 'lunar', month: 'Magha', tithi: 5, window: 'madhyahna', key: 'vasant-panchami', name: 'Vasant Panchami', tradition: 'hindu' },
  { kind: 'lunar', month: 'Magha', tithi: 29, window: 'nishita', key: 'mahashivaratri', name: 'Mahashivaratri', tradition: 'hindu',
    note: 'Observed through the nishita (midnight) period.' },
  { kind: 'relative', toKey: 'holi', offsetDays: -1, key: 'holika-dahan', name: 'Holika Dahan', tradition: 'hindu',
    note: 'Bonfire on the eve of Holi. Timing within the night is set by Bhadra, so treat the evening as approximate.' },
  { kind: 'lunar', month: 'Phalguna', tithi: 16, key: 'holi', name: 'Holi', tradition: 'hindu',
    note: 'Celebrated in Sahaja Yoga though it is not a puja day.' },
  { kind: 'lunar', month: 'Chaitra', tithi: 1, window: 'madhyahna', key: 'ugadi', name: 'Ugadi / Gudi Padwa', tradition: 'hindu',
    note: 'Hindu new year.' },
  { kind: 'lunar', month: 'Chaitra', tithi: 9, window: 'madhyahna', key: 'rama-navami', name: 'Shri Rama Navami', tradition: 'hindu',
    note: 'Shri Rama was born at madhyahna (midday).' },
  { kind: 'lunar', month: 'Chaitra', tithi: 15, key: 'hanuman-jayanti', name: 'Hanuman Jayanti', tradition: 'hindu' },
  { kind: 'lunar', month: 'Vaishakha', tithi: 3, window: 'madhyahna', key: 'akshaya-tritiya', name: 'Akshaya Tritiya', tradition: 'hindu' },
  { kind: 'lunar', month: 'Ashadha', tithi: 15, key: 'guru-purnima', name: 'Guru Purnima', tradition: 'hindu' },
  { kind: 'lunar', month: 'Shravana', tithi: 15, key: 'raksha-bandhan', name: 'Raksha Bandhan', tradition: 'hindu' },
  { kind: 'lunar', month: 'Shravana', tithi: 23, window: 'nishita', key: 'janmashtami', name: 'Shri Krishna Janmashtami', tradition: 'hindu',
    note: 'Shri Krishna was born at nishita (midnight).' },
  { kind: 'lunar', month: 'Bhadrapada', tithi: 4, window: 'madhyahna', key: 'ganesh-chaturthi', name: 'Shri Ganesha Chaturthi', tradition: 'hindu',
    note: 'Determined by the madhyahna (midday) period.' },
  // Ends on Maha Navami, so the closing tithi is reckoned by the same aparahna
  // window that fixes Maha Navami itself -- otherwise the span runs a day long
  // and overlaps Dussehra.
  { kind: 'lunarRange', month: 'Ashwina', fromTithi: 1, toTithi: 9, toWindow: 'aparahna',
    key: 'navaratri', name: 'Navaratri', tradition: 'hindu', note: 'All nine nights of Shri Durga.' },
  { kind: 'lunar', month: 'Ashwina', tithi: 8, key: 'durga-ashtami', name: 'Durga Ashtami', tradition: 'hindu' },
  { kind: 'lunar', month: 'Ashwina', tithi: 9, window: 'aparahna', key: 'maha-navami', name: 'Maha Navami', tradition: 'hindu' },
  { kind: 'lunar', month: 'Ashwina', tithi: 10, window: 'aparahna', key: 'dussehra', name: 'Dussehra / Vijayadashami', tradition: 'hindu',
    note: 'Observed in the aparahna (afternoon) period.' },
  { kind: 'lunar', month: 'Ashwina', tithi: 30, window: 'pradosh', key: 'diwali', name: 'Diwali / Lakshmi Puja', tradition: 'hindu',
    note: 'Lakshmi Puja falls in the pradosh (evening) period of Amavasya.' },
  { kind: 'lunar', month: 'Kartika', tithi: 1, key: 'govardhan-puja', name: 'Govardhan Puja', tradition: 'hindu' },
  { kind: 'lunar', month: 'Kartika', tithi: 2, key: 'bhai-dooj', name: 'Bhai Dooj', tradition: 'hindu' },
  { kind: 'lunar', month: 'Kartika', tithi: 15, key: 'kartika-purnima', name: 'Kartika Purnima / Guru Nanak Jayanti', tradition: 'sikh' },
  { kind: 'lunar', month: 'Margashirsha', tithi: 15, key: 'datta-jayanti', name: 'Datta Jayanti', tradition: 'hindu' },

  // --- Buddhist ------------------------------------------------------------
  { kind: 'lunar', month: 'Vaishakha', tithi: 15, key: 'buddha-purnima', name: 'Buddha Purnima (Vesak)', tradition: 'buddhist',
    note: "Shri Buddha's birth, enlightenment and parinirvana." },

  // --- Christian -----------------------------------------------------------
  { kind: 'easterOffset', offsetDays: -2, key: 'good-friday', name: 'Good Friday', tradition: 'christian' },
  { kind: 'easterOffset', offsetDays: 0, key: 'easter', name: 'Easter Sunday', tradition: 'christian' },
  { kind: 'gregorian', month: 12, day: 25, key: 'christmas', name: 'Christmas', tradition: 'christian' },

  // --- Islamic -------------------------------------------------------------
  { kind: 'hijri', month: 3, day: 12, key: 'mawlid', name: "Mawlid an-Nabi (Prophet Muhammad's Birthday)", tradition: 'islamic',
    note: 'Tabular Hijri date; local moon sighting may shift it by a day.', needsVerification: true },
  { kind: 'hijri', month: 10, day: 1, key: 'eid-al-fitr', name: 'Eid al-Fitr (Ramzan)', tradition: 'islamic',
    note: 'Tabular Hijri date; local moon sighting may shift it by a day.', needsVerification: true },
  { kind: 'hijri', month: 12, day: 10, key: 'eid-al-adha', name: 'Eid al-Adha (Bakrid)', tradition: 'islamic',
    note: 'Tabular Hijri date; local moon sighting may shift it by a day.', needsVerification: true },
];

export interface FestivalOccurrence {
  key: string;
  name: string;
  tradition: Tradition;
  date: IsoDate;
  /** For multi-day festivals such as Navaratri, 1-based. */
  dayNumber?: number;
  totalDays?: number;
  note?: string;
  needsVerification: boolean;
}

// --- Supporting calendars ---------------------------------------------------

/** Gregorian Easter Sunday (Meeus/Jones/Butcher computus). */
export function easterSunday(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Tabular Islamic calendar (Kuwaiti algorithm) -> Gregorian date.
 * Civil epoch, leap years 2,5,7,10,13,16,18,21,24,26,29 of each 30-year cycle.
 * Real observance depends on local moon sighting and can differ by a day, which
 * is why every Islamic rule is flagged for verification.
 */
export function hijriToGregorian(hy: number, hm: number, hd: number): IsoDate {
  const jd =
    Math.floor((11 * hy + 3) / 30) +
    354 * hy +
    30 * hm -
    Math.floor((hm - 1) / 2) +
    hd +
    1948440 -
    385;
  // Julian Day Number -> Gregorian civil date.
  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l -= Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Instant the Sun's sidereal longitude crosses `degrees`, found by bisection
 * between two dates that straddle the crossing.
 */
function solarIngressDate(
  year: number,
  degrees: number,
  loc: PanchangLocation,
): IsoDate | null {
  const wrapped = (d: Date) => {
    const diff = (siderealSunLongitude(d) - degrees + 540) % 360 - 180;
    return diff; // negative before the crossing, positive after
  };

  // Scan day by day for a sign change, then bisect to the minute.
  let previous = new Date(Date.UTC(year, 0, 1));
  let previousValue = wrapped(previous);
  for (let dayOffset = 1; dayOffset <= 366; dayOffset++) {
    const current = new Date(Date.UTC(year, 0, 1 + dayOffset));
    const currentValue = wrapped(current);
    if (previousValue < 0 && currentValue >= 0) {
      let lo = previous;
      let hi = current;
      for (let iteration = 0; iteration < 40; iteration++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        if (wrapped(mid) < 0) lo = mid;
        else hi = mid;
      }
      // Express the crossing in the reckoning location's local date.
      return toZonedTime(hi, loc.timeZone).toISOString().slice(0, 10);
    }
    previous = current;
    previousValue = currentValue;
  }
  return null;
}

// --- Main entry point -------------------------------------------------------


/** Local calendar date of an instant, in the reckoning location's zone. */
function localDateOf(loc: PanchangLocation, instant: Date): IsoDate {
  return formatInTimeZone(instant, loc.timeZone, 'yyyy-MM-dd');
}

/** The instants a tithi begins and ends within a given lunation. */
function tithiSpan(lunation: Lunation, tithi: number): { start: Date; end: Date } | null {
  const startAngle = (tithi - 1) * 12;
  // Search from just inside the lunation. Reaching further back would find the
  // *previous* month's occurrence for late tithis -- Amavasya is angle 348,
  // which last occurred hours before this lunation opened.
  const searchFrom = new Date(lunation.start.getTime() - 3600000);
  const start = Astronomy.SearchMoonPhase(startAngle, searchFrom, 34)?.date;
  if (!start) return null;
  const end = Astronomy.SearchMoonPhase((startAngle + 12) % 360, new Date(start.getTime() + 3600000), 3)?.date;
  if (!end) return null;
  return { start, end };
}

/**
 * The calendar date a festival falls on within one lunar month.
 *
 * The rule is: take the day whose observance window has the required tithi
 * running in it. When a tithi is *kshaya* -- short enough that it never
 * touches the window on any day, which happens when it opens just after one
 * day's window and closes just before the next -- almanacs fall back to the
 * day the tithi actually occupies. Holi 2028 and Govardhan Puja 2028 and 2029
 * are of this kind, and without the fallback they vanish from the calendar.
 */
function resolveLunarDate(
  loc: PanchangLocation,
  lunation: Lunation,
  tithi: number,
  window: ObservanceWindow,
): IsoDate | null {
  const span = tithiSpan(lunation, tithi);
  if (!span) return null;

  // Candidate days: every local date the tithi touches, plus the one before,
  // since an evening or midnight window can reach back into it.
  const candidates: IsoDate[] = [];
  const cursor = new Date(span.start.getTime() - 86400000);
  while (cursor <= span.end) {
    const date = localDateOf(loc, cursor);
    if (!candidates.includes(date)) candidates.push(date);
    cursor.setTime(cursor.getTime() + 6 * 3600000);
  }
  const lastDate = localDateOf(loc, span.end);
  if (!candidates.includes(lastDate)) candidates.push(lastDate);

  for (const date of candidates) {
    const windowSpan = windowOn(loc, date, window);
    if (!windowSpan) continue;
    const instants =
      windowSpan.start.getTime() === windowSpan.end.getTime()
        ? [windowSpan.start]
        : [windowSpan.start, new Date((windowSpan.start.getTime() + windowSpan.end.getTime()) / 2), windowSpan.end];
    if (instants.some((t) => t >= span.start && t < span.end)) return date;
  }

  // Kshaya tithi: no window caught it, so use the day holding its midpoint.
  return localDateOf(loc, new Date((span.start.getTime() + span.end.getTime()) / 2));
}

/**
 * All festival occurrences between two dates.
 *
 * Lunar rules match against the tithi at sunrise at `loc`. Days inside an
 * adhika (leap) month are skipped, because festivals are observed in the nija
 * month that follows.
 */
export function festivalsBetween(
  loc: PanchangLocation,
  from: IsoDate,
  to: IsoDate,
): FestivalOccurrence[] {
  const table = buildPanchangTable(loc, from, to);
  const lunations = lunationsBetween(
    new Date(`${from}T00:00:00Z`),
    new Date(`${to}T23:59:59Z`),
  );
  const byDate = new Map<IsoDate, PanchangDay>(table.map((d) => [d.date, d]));
  const out: FestivalOccurrence[] = [];

  const startYear = Number(from.slice(0, 4));
  const endYear = Number(to.slice(0, 4));

  const push = (rule: Rule, date: IsoDate, extra: Partial<FestivalOccurrence> = {}) => {
    if (date < from || date > to) return;
    out.push({
      key: rule.key,
      name: rule.name,
      tradition: rule.tradition,
      date,
      note: rule.note,
      needsVerification: rule.needsVerification ?? false,
      ...extra,
    });
  };

  for (const rule of FESTIVAL_RULES) {
    switch (rule.kind) {
      case 'lunar': {
        const window = rule.window ?? 'sunrise';
        for (const lunation of lunations) {
          if (lunation.month !== rule.month || lunation.adhika) continue;
          const date = resolveLunarDate(loc, lunation, rule.tithi, window);
          if (date) push(rule, date);
        }
        break;
      }

      case 'lunarRange': {
        // The collective highlights the whole of Navaratri, so emit every
        // calendar date from the first tithi to the last with no holes. A
        // tithi that spans two sunrises or is skipped entirely must not punch
        // a gap in the middle of the festival.
        for (const lunation of lunations) {
          if (lunation.month !== rule.month || lunation.adhika) continue;
          const first = resolveLunarDate(loc, lunation, rule.fromTithi, rule.fromWindow ?? 'sunrise');
          const last = resolveLunarDate(loc, lunation, rule.toTithi, rule.toWindow ?? 'sunrise');
          if (!first || !last) continue;

          const dates: IsoDate[] = [];
          const cursor = new Date(`${first}T12:00:00Z`);
          const stop = new Date(`${last}T12:00:00Z`);
          while (cursor <= stop) {
            dates.push(cursor.toISOString().slice(0, 10));
            cursor.setUTCDate(cursor.getUTCDate() + 1);
          }

          dates.forEach((date, index) => {
            push(rule, date, { dayNumber: index + 1, totalDays: dates.length });
          });
        }
        break;
      }

      case 'solarIngress': {
        for (let year = startYear; year <= endYear; year++) {
          const date = solarIngressDate(year, rule.degrees, loc);
          if (date) push(rule, date);
        }
        break;
      }

      case 'gregorian': {
        for (let year = startYear; year <= endYear; year++) {
          push(
            rule,
            `${year}-${String(rule.month).padStart(2, '0')}-${String(rule.day).padStart(2, '0')}`,
          );
        }
        break;
      }

      case 'easterOffset': {
        for (let year = startYear; year <= endYear; year++) {
          const easter = new Date(`${easterSunday(year)}T12:00:00Z`);
          easter.setUTCDate(easter.getUTCDate() + rule.offsetDays);
          push(rule, easter.toISOString().slice(0, 10));
        }
        break;
      }

      case 'relative':
        // Resolved in a second pass below, once its anchor exists.
        break;

      case 'hijri': {
        // Hijri years drift ~11 days earlier each Gregorian year, so a given
        // Hijri date can occur twice in one Gregorian year. Scan a window.
        const firstHijriYear = Math.floor((startYear - 622) * (33 / 32)) - 1;
        for (let hy = firstHijriYear; hy <= firstHijriYear + (endYear - startYear) + 3; hy++) {
          push(rule, hijriToGregorian(hy, rule.month, rule.day));
        }
        break;
      }
    }
  }

  // Second pass: rules defined relative to another festival.
  for (const rule of FESTIVAL_RULES) {
    if (rule.kind !== 'relative') continue;
    for (const anchor of out.filter((o) => o.key === rule.toKey)) {
      const shifted = new Date(`${anchor.date}T12:00:00Z`);
      shifted.setUTCDate(shifted.getUTCDate() + rule.offsetDays);
      push(rule, shifted.toISOString().slice(0, 10));
    }
  }

  // Sort by date, then by name for a stable review sheet.
  out.sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)));
  // `byDate` is retained for callers that want to annotate with tithi info.
  void byDate;
  return out;
}
