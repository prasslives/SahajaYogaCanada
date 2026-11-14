/**
 * Eclipse computation, filtered to what is actually visible from Canada.
 *
 * A global eclipse catalogue is not useful to the collective -- an annular
 * eclipse over Antarctica is not something anyone here will see. So every
 * eclipse is tested against a spread of Canadian cities, and the local
 * circumstances reported are Toronto's, since that is where the community is.
 */
import * as Astronomy from 'astronomy-engine';
import type { Eclipse, IsoDate } from '../domain/types';
import { formatInTimeZone } from 'date-fns-tz';

interface City {
  name: string;
  observer: Astronomy.Observer;
  timeZone: string;
}

/** Spread wide enough that any eclipse touching Canada hits at least one. */
const CANADIAN_CITIES: City[] = [
  { name: 'Vancouver', observer: new Astronomy.Observer(49.2827, -123.1207, 70), timeZone: 'America/Vancouver' },
  { name: 'Whitehorse', observer: new Astronomy.Observer(60.7212, -135.0568, 640), timeZone: 'America/Whitehorse' },
  { name: 'Calgary', observer: new Astronomy.Observer(51.0447, -114.0719, 1045), timeZone: 'America/Edmonton' },
  { name: 'Winnipeg', observer: new Astronomy.Observer(49.8951, -97.1384, 232), timeZone: 'America/Winnipeg' },
  { name: 'Iqaluit', observer: new Astronomy.Observer(63.7467, -68.5170, 34), timeZone: 'America/Iqaluit' },
  { name: 'Toronto', observer: new Astronomy.Observer(43.6532, -79.3832, 76), timeZone: 'America/Toronto' },
  { name: 'Ottawa', observer: new Astronomy.Observer(45.4215, -75.6972, 70), timeZone: 'America/Toronto' },
  { name: 'Montreal', observer: new Astronomy.Observer(45.5019, -73.5674, 36), timeZone: 'America/Montreal' },
  { name: 'Halifax', observer: new Astronomy.Observer(44.6488, -63.5752, 30), timeZone: 'America/Halifax' },
  { name: "St. John's", observer: new Astronomy.Observer(47.5615, -52.7126, 60), timeZone: 'America/St_Johns' },
];

const TORONTO = CANADIAN_CITIES.find((c) => c.name === 'Toronto')!;
const TORONTO_TZ = 'America/Toronto';

const localDate = (instant: Date): IsoDate =>
  formatInTimeZone(instant, TORONTO_TZ, 'yyyy-MM-dd');

/** Moon's altitude in degrees at a place and time; negative means below horizon. */
function moonAltitude(observer: Astronomy.Observer, instant: Date): number {
  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, instant, observer, true, true);
  return Astronomy.Horizon(instant, observer, equatorial.ra, equatorial.dec, 'normal').altitude;
}

const minutesAfter = (instant: Date, minutes: number) =>
  new Date(instant.getTime() + minutes * 60000);

/**
 * Lunar eclipses between two dates that can be seen from somewhere in Canada.
 *
 * A lunar eclipse is visible anywhere the Moon is above the horizon while it is
 * happening, so visibility is a simple altitude test rather than a path
 * calculation.
 */
export function lunarEclipsesBetween(from: Date, to: Date): Eclipse[] {
  const out: Eclipse[] = [];
  let eclipse = Astronomy.SearchLunarEclipse(from);

  while (eclipse.peak.date <= to) {
    const peak = eclipse.peak.date;
    // sd_* are semi-durations in minutes from peak.
    const penumbralBegin = minutesAfter(peak, -eclipse.sd_penum);
    const penumbralEnd = minutesAfter(peak, eclipse.sd_penum);

    const visibleFrom = CANADIAN_CITIES.filter((city) =>
      [penumbralBegin, peak, penumbralEnd].some(
        (instant) => moonAltitude(city.observer, instant) > 0,
      ),
    );

    if (visibleFrom.length > 0) {
      const torontoVisible = moonAltitude(TORONTO.observer, peak) > 0;
      out.push({
        date: localDate(peak),
        kind: 'lunar',
        subtype: eclipse.kind as Eclipse['subtype'],
        visibleInCanada: true,
        beginAt: penumbralBegin.toISOString(),
        maxAt: peak.toISOString(),
        endAt: penumbralEnd.toISOString(),
        magnitude: eclipse.obscuration,
        // A lunar eclipse happens at one instant worldwide, so Toronto time is
        // always meaningful even when the Moon is below the horizon here.
        observedFrom: 'Toronto',
        timeZone: TORONTO_TZ,
        visibilityNote: torontoVisible
          ? `Visible from Toronto and ${visibleFrom.length - 1} other Canadian cities checked.`
          : `Not visible from Toronto. Visible from ${visibleFrom.map((c) => c.name).join(', ')}.`,
      });
    }

    eclipse = Astronomy.NextLunarEclipse(eclipse.peak);
  }
  return out;
}

/**
 * Solar eclipses between two dates that are visible from somewhere in Canada,
 * with Toronto's local circumstances where Toronto sees it.
 */
export function solarEclipsesBetween(from: Date, to: Date): Eclipse[] {
  const out: Eclipse[] = [];
  let global = Astronomy.SearchGlobalSolarEclipse(from);

  while (global.peak.date <= to) {
    const searchStart = new Date(global.peak.date.getTime() - 2 * 86400000);

    // Ask each city for its own local circumstances of this same eclipse.
    const sightings = CANADIAN_CITIES.map((city) => {
      try {
        const local = Astronomy.SearchLocalSolarEclipse(searchStart, city.observer);
        // Guard against the search skipping to a later eclipse entirely.
        const sameEvent =
          Math.abs(local.peak.time.date.getTime() - global.peak.date.getTime()) < 86400000;
        if (!sameEvent || local.peak.altitude <= 0) return null;
        return { city, local };
      } catch {
        return null;
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    if (sightings.length > 0) {
      const toronto = sightings.find((s) => s.city.name === 'Toronto');
      const best = toronto ?? sightings[0];
      const info = best.local;

      out.push({
        date: formatInTimeZone(info.peak.time.date, best.city.timeZone, 'yyyy-MM-dd'),
        kind: 'solar',
        subtype: info.kind as Eclipse['subtype'],
        visibleInCanada: true,
        beginAt: info.partial_begin?.time.date.toISOString(),
        maxAt: info.peak.time.date.toISOString(),
        endAt: info.partial_end?.time.date.toISOString(),
        obscuration: info.obscuration,
        observedFrom: best.city.name,
        timeZone: best.city.timeZone,
        visibilityNote: toronto
          ? `Seen from Toronto as a ${info.kind} eclipse, ${(info.obscuration * 100).toFixed(0)}% of the Sun covered.`
          : `Not visible from Toronto. Times shown for ${best.city.name}. Also visible from ${sightings
              .map((s) => s.city.name)
              .join(', ')}.`,
      });
    }

    global = Astronomy.NextGlobalSolarEclipse(global.peak);
  }
  return out;
}

/** Every eclipse visible from Canada in a span, sorted by date. */
export function eclipsesBetween(from: IsoDate, to: IsoDate): Eclipse[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T23:59:59Z`);
  return [...lunarEclipsesBetween(start, end), ...solarEclipsesBetween(start, end)].sort(
    (a, b) => a.maxAt.localeCompare(b.maxAt),
  );
}
