/**
 * Panchang (Hindu lunisolar calendar) primitives.
 *
 * Only what this app actually needs: tithi, paksha, the lunar month, and the
 * four moon days the Ontario collective marks (purnima, amavasya, saptami,
 * navami). Deliberately no nakshatra / yoga / karana.
 *
 * The one piece of real astronomy is delegated to `astronomy-engine`:
 * `MoonPhase(t)` returns the Moon's ecliptic longitude minus the Sun's, in
 * [0, 360). Because that is a *difference* of longitudes, the ayanamsa cancels
 * out and tithi needs no ayanamsa at all. Ayanamsa is only needed to name the
 * lunar month, where we apply Lahiri.
 */
import * as Astronomy from 'astronomy-engine';
import { fromZonedTime } from 'date-fns-tz';
import type { IsoDate, MoonDay, MoonDayKind, Paksha } from '../domain/types';

/** Where a panchang day is reckoned from. Sunrise at this place defines the day. */
export interface PanchangLocation {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timeZone: string;
}

export const TORONTO: PanchangLocation = {
  name: 'Toronto',
  latitude: 43.6532,
  longitude: -79.3832,
  elevation: 76,
  timeZone: 'America/Toronto',
};

/** Drik Panchang's default reckoning point, used for published festival lists. */
export const NEW_DELHI: PanchangLocation = {
  name: 'New Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  elevation: 216,
  timeZone: 'Asia/Kolkata',
};

const observerFor = (loc: PanchangLocation) =>
  new Astronomy.Observer(loc.latitude, loc.longitude, loc.elevation);

/**
 * Tithi index at an instant, 1..30.
 * 1..15 are shukla paksha (Pratipada..Purnima), 16..30 krishna (..Amavasya).
 */
export function tithiAt(instant: Date): number {
  return Math.floor(Astronomy.MoonPhase(instant) / 12) + 1;
}

export function pakshaOf(tithi: number): Paksha {
  return tithi <= 15 ? 'shukla' : 'krishna';
}

/** Position within the paksha, 1..15. */
export function tithiInPaksha(tithi: number): number {
  return tithi <= 15 ? tithi : tithi - 15;
}

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];

export function tithiName(tithi: number): string {
  const n = tithiInPaksha(tithi);
  const base = n === 15 && pakshaOf(tithi) === 'krishna' ? 'Amavasya' : TITHI_NAMES[n - 1];
  const paksha = pakshaOf(tithi) === 'shukla' ? 'Shukla' : 'Krishna';
  return `${paksha} ${base}`;
}

/**
 * Sunrise for a given local calendar date at a location, as a UTC instant.
 * Returns null above the Arctic circle on days with no sunrise -- not a case
 * that arises for Toronto or Delhi, but the caller should handle it.
 */
export function sunriseOn(loc: PanchangLocation, date: IsoDate): Date | null {
  const localMidnight = fromZonedTime(`${date}T00:00:00`, loc.timeZone);
  const found = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observerFor(loc),
    +1,
    localMidnight,
    2,
  );
  return found ? found.date : null;
}

/**
 * The tithi that "owns" a calendar date -- the one running at sunrise. This is
 * the standard rule Drik Panchang and most almanacs use to place a festival on
 * a day.
 */
export function tithiOnDate(loc: PanchangLocation, date: IsoDate): number | null {
  const sunrise = sunriseOn(loc, date);
  return sunrise ? tithiAt(sunrise) : null;
}

// --- Lahiri ayanamsa, needed only to name the lunar month ------------------

/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees. Linear model anchored at J2000.0
 * = 23.85269 deg with the IAU general precession rate of 50.2879"/yr. Accurate
 * to well under an arcminute across the 2020-2050 window this app covers,
 * which is far finer than the ~1 degree/day the Sun moves.
 */
export function lahiriAyanamsa(instant: Date): number {
  const yearsFromJ2000 =
    (instant.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / (365.25 * 86400000);
  return 23.85269 + (50.2879 / 3600) * yearsFromJ2000;
}

/** Sun's sidereal ecliptic longitude in degrees, 0..360 (Lahiri). */
export function siderealSunLongitude(instant: Date): number {
  const tropical = Astronomy.SunPosition(instant).elon;
  return ((tropical - lahiriAyanamsa(instant)) % 360 + 360) % 360;
}

/** Rashi (zodiac sign) index the Sun occupies, 0 = Mesha/Aries. */
export function sunRashi(instant: Date): number {
  return Math.floor(siderealSunLongitude(instant) / 30);
}

export const LUNAR_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
] as const;

export type LunarMonth = (typeof LUNAR_MONTHS)[number];

/**
 * Instant of the new moon at or before `instant` -- the start of the current
 * amanta lunar month.
 */
export function newMoonAtOrBefore(instant: Date): Date {
  // MoonPhase 0 is new moon; step back far enough to guarantee a crossing.
  const searchStart = new Date(instant.getTime() - 31 * 86400000);
  let found = Astronomy.SearchMoonPhase(0, searchStart, 32);
  let last: Date | null = null;
  while (found && found.date <= instant) {
    last = found.date;
    const next = Astronomy.SearchMoonPhase(0, new Date(found.date.getTime() + 86400000), 32);
    if (!next) break;
    found = next;
  }
  if (!last) throw new Error(`No new moon found before ${instant.toISOString()}`);
  return last;
}

/**
 * Amanta lunar month containing an instant. The month is named for the rashi
 * the Sun occupies at the new moon that opens it: a new moon with the Sun in
 * Meena (rashi 11) opens Chaitra, so month index = (rashi + 1) mod 12.
 */
export function lunarMonthAt(instant: Date): LunarMonth {
  const rashi = sunRashi(newMoonAtOrBefore(instant));
  return LUNAR_MONTHS[(rashi + 1) % 12];
}

// --- Moon days ------------------------------------------------------------

const WANTED: Record<number, MoonDayKind> = {
  7: 'saptami',
  9: 'navami',
  15: 'purnima',  // shukla 15
  22: 'saptami',
  24: 'navami',
  30: 'amavasya', // krishna 15
};

function eachDate(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Every purnima, amavasya, saptami and navami between two dates, reckoned by
 * the tithi running at sunrise at `loc`.
 *
 * A tithi runs ~23.6-26 hours, so it can span two sunrises (adhika tithi) or
 * none (kshaya tithi). Adhika would otherwise emit the same moon day on two
 * consecutive dates -- e.g. Shukla Navami on both 19 and 20 Sep 2026 -- so we
 * keep only the first, which is the convention printed calendars follow. A
 * kshaya tithi simply produces no row, which is also correct.
 */
export function moonDaysBetween(
  loc: PanchangLocation,
  from: IsoDate,
  to: IsoDate,
): MoonDay[] {
  const out: MoonDay[] = [];

  // Seed from the day before the range so a tithi that began just outside it
  // is not re-emitted on the first day of the range.
  const dayBefore = new Date(`${from}T12:00:00Z`);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  let previousTithi = tithiOnDate(loc, dayBefore.toISOString().slice(0, 10));

  for (const date of eachDate(from, to)) {
    const tithi = tithiOnDate(loc, date);
    if (tithi === null) continue;

    const kind = WANTED[tithi];
    // Same tithi as yesterday means it spanned two sunrises; already emitted.
    if (kind && tithi !== previousTithi) {
      out.push({ date, kind, paksha: pakshaOf(tithi), tithi });
    }
    previousTithi = tithi;
  }
  return out;
}

// --- Panchang day table ---------------------------------------------------

export interface Lunation {
  /** New moon instant that opens this amanta lunar month. */
  start: Date;
  /** New moon instant that opens the next month. */
  end: Date;
  month: LunarMonth;
  /**
   * True for an adhika (leap) month -- a lunation during which the Sun makes
   * no rashi ingress. It carries the same name as the nija month that follows
   * it, and festivals are observed in the nija month, not this one.
   */
  adhika: boolean;
}

export interface PanchangDay {
  date: IsoDate;
  sunrise: Date;
  tithi: number;
  paksha: Paksha;
  month: LunarMonth;
  adhikaMonth: boolean;
}

/** All new moon instants in [from, to], inclusive of partial lunations. */
function newMoonsBetween(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  let found = Astronomy.SearchMoonPhase(0, from, 32);
  while (found && found.date <= to) {
    out.push(found.date);
    const next = Astronomy.SearchMoonPhase(0, new Date(found.date.getTime() + 86400000), 32);
    if (!next) break;
    found = next;
  }
  return out;
}

/**
 * Amanta lunar months covering a span.
 *
 * A lunar month is named for the rashi the Sun *enters* during it. When the Sun
 * makes no ingress at all inside a lunation -- which happens roughly every
 * 2.7 years, because a lunation is slightly shorter than a solar month -- that
 * lunation is an adhika (leap) month. It takes the same name as the ordinary
 * month that follows, so the pair reads "Adhika Jyeshtha" then "Jyeshtha".
 * Ignoring this would shift every month name for the rest of the year.
 */
export function lunationsBetween(from: Date, to: Date): Lunation[] {
  // Pad generously so the first and last calendar dates fall inside a lunation.
  const starts = newMoonsBetween(
    new Date(from.getTime() - 45 * 86400000),
    new Date(to.getTime() + 45 * 86400000),
  );

  const out: Lunation[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const start = starts[i];
    const end = starts[i + 1];
    const rashiAtStart = sunRashi(start);
    // Sample just inside the end so an ingress exactly at the new moon counts
    // toward the month it opens, not the one it closes.
    const rashiAtEnd = sunRashi(new Date(end.getTime() - 1000));
    const adhika = rashiAtEnd === rashiAtStart;
    out.push({
      start,
      end,
      month: LUNAR_MONTHS[(rashiAtStart + 1) % 12],
      adhika,
    });
  }
  return out;
}

/**
 * One row per calendar date with everything the festival rules need. Built in
 * a single pass so the expensive new-moon searches happen once rather than
 * once per day.
 */
export function buildPanchangTable(
  loc: PanchangLocation,
  from: IsoDate,
  to: IsoDate,
): PanchangDay[] {
  const lunations = lunationsBetween(
    new Date(`${from}T00:00:00Z`),
    new Date(`${to}T23:59:59Z`),
  );

  const out: PanchangDay[] = [];
  for (const date of eachDate(from, to)) {
    const sunrise = sunriseOn(loc, date);
    if (!sunrise) continue;

    const lunation = lunations.find((l) => sunrise >= l.start && sunrise < l.end);
    if (!lunation) continue;

    const tithi = tithiAt(sunrise);
    out.push({
      date,
      sunrise,
      tithi,
      paksha: pakshaOf(tithi),
      month: lunation.month,
      adhikaMonth: lunation.adhika,
    });
  }
  return out;
}

// --- Observance windows ----------------------------------------------------

/** Sunset for a local calendar date, as a UTC instant. */
export function sunsetOn(loc: PanchangLocation, date: IsoDate): Date | null {
  const localMidnight = fromZonedTime(`${date}T00:00:00`, loc.timeZone);
  const found = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observerFor(loc),
    -1,
    localMidnight,
    2,
  );
  return found ? found.date : null;
}

/**
 * The part of the day a festival is reckoned by.
 *
 * Almanacs do not place every festival by the tithi at sunrise. Each festival
 * has a traditional window, and the festival falls on whichever day has the
 * required tithi running during that window. Ignoring this is what puts Diwali,
 * Dussehra and Mahashivaratri a day late.
 */
export type ObservanceWindow =
  | 'sunrise'    // the instant of sunrise -- the default for most vrats
  | 'madhyahna'  // midday: the 3rd of 5 equal parts of daylight
  | 'aparahna'   // afternoon: the 4th of 5 equal parts of daylight
  | 'pradosh'    // evening: the ~2h24m following sunset
  | 'nishita';   // midnight: the 8th of 15 muhurtas of night

/**
 * Start and end instants of a window on a given local date, or null when the
 * Sun does not rise or set that day.
 */
export function windowOn(
  loc: PanchangLocation,
  date: IsoDate,
  window: ObservanceWindow,
): { start: Date; end: Date } | null {
  const sunrise = sunriseOn(loc, date);
  if (!sunrise) return null;
  if (window === 'sunrise') return { start: sunrise, end: sunrise };

  const sunset = sunsetOn(loc, date);
  if (!sunset || sunset <= sunrise) return null;
  const daylight = sunset.getTime() - sunrise.getTime();

  if (window === 'madhyahna') {
    return {
      start: new Date(sunrise.getTime() + (daylight * 2) / 5),
      end: new Date(sunrise.getTime() + (daylight * 3) / 5),
    };
  }
  if (window === 'aparahna') {
    return {
      start: new Date(sunrise.getTime() + (daylight * 3) / 5),
      end: new Date(sunrise.getTime() + (daylight * 4) / 5),
    };
  }
  if (window === 'pradosh') {
    // Three muhurtas after sunset, the traditional 2h24m.
    return { start: sunset, end: new Date(sunset.getTime() + 2.4 * 3600000) };
  }

  // nishita: the 8th of the night's 15 muhurtas, straddling solar midnight.
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextSunrise = sunriseOn(loc, nextDate.toISOString().slice(0, 10));
  if (!nextSunrise) return null;
  const night = nextSunrise.getTime() - sunset.getTime();
  return {
    start: new Date(sunset.getTime() + (night * 7) / 15),
    end: new Date(sunset.getTime() + (night * 8) / 15),
  };
}

/**
 * Whether a given tithi is running at any point inside a window. Windows are
 * at most ~2.5 hours and a tithi runs ~24, so sampling the ends and the middle
 * cannot miss an overlap.
 */
export function tithiRunsDuring(
  loc: PanchangLocation,
  date: IsoDate,
  tithi: number,
  window: ObservanceWindow,
): boolean {
  const span = windowOn(loc, date, window);
  if (!span) return false;
  const mid = new Date((span.start.getTime() + span.end.getTime()) / 2);
  return [span.start, mid, span.end].some((instant) => tithiAt(instant) === tithi);
}
