/**
 * Turns the generated seed files into one calendar feed.
 *
 * Until Supabase is wired up the app reads these bundled JSON files directly,
 * which means it already works entirely offline. When the backend lands, this
 * module becomes the fallback the cache falls back to rather than the only
 * source.
 */
import type { CalendarEvent, EventCategory, FeedId, IsoDate } from '../domain/types';

import pujasSeed from './seed/pujas.json';
import localPujasSeed from './seed/local-pujas.json';
import festivalsSeed from './seed/festivals.json';
import moonDaysSeed from './seed/moon-days.json';
import eclipsesSeed from './seed/eclipses.json';
import linksSeed from './seed/puja-festival-links.json';

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Traditions in the seed map one-to-one onto the festival feeds. */
const TRADITION_FEED: Record<string, FeedId> = {
  hindu: 'festivals-hindu',
  christian: 'festivals-christian',
  buddhist: 'festivals-buddhist',
  islamic: 'festivals-islamic',
  sikh: 'festivals-sikh',
};

const MOON_LABEL: Record<string, string> = {
  purnima: 'Purnima — full moon',
  amavasya: 'Amavasya — no moon',
  saptami: 'Saptami',
  navami: 'Navami',
};

function buildEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const puja of pujasSeed) {
    events.push({
      id: `cabella:${puja.uid}`,
      category: 'puja',
      feed: 'sahaja-pujas',
      title: puja.title,
      subtitle: puja.location?.split(',')[0],
      description: puja.description,
      eventDate: puja.pujaDate,
      allDay: true,
      source: 'cabella',
      sourceUid: puja.uid,
      venueName: puja.location,
      imageUrl: puja.imageUrl,
      externalUrl: puja.url,
      published: true,
    });
  }

  for (const puja of localPujasSeed) {
    events.push({
      id: `local:${puja.key}:${puja.date}`,
      category: 'puja',
      feed: 'sahaja-local',
      title: puja.name,
      description: puja.note,
      eventDate: puja.date,
      allDay: true,
      source: 'manual',
      published: true,
    });
  }

  for (const festival of festivalsSeed) {
    const isMultiDay = typeof festival.totalDays === 'number' && festival.totalDays > 1;
    events.push({
      id: `festival:${festival.key}:${festival.date}`,
      category: 'religious_festival',
      feed: TRADITION_FEED[festival.tradition] ?? 'festivals-hindu',
      title: festival.name,
      subtitle: isMultiDay ? `Day ${festival.dayNumber} of ${festival.totalDays}` : undefined,
      description: festival.note,
      eventDate: festival.date,
      allDay: true,
      source: 'computed',
      published: true,
    });
  }

  for (const moonDay of moonDaysSeed) {
    events.push({
      id: `moon:${moonDay.kind}:${moonDay.date}`,
      category: 'astronomical',
      // Purnima and Amavasya are what most people mean by "moon days"; the
      // saptami/navami pair is four times as many rows and rides its own feed.
      feed:
        moonDay.kind === 'purnima' || moonDay.kind === 'amavasya'
          ? 'moon-phases'
          : 'moon-tithis',
      title: MOON_LABEL[moonDay.kind] ?? titleCase(moonDay.kind),
      subtitle: `${titleCase(moonDay.paksha)} paksha`,
      eventDate: moonDay.date,
      allDay: true,
      source: 'computed',
      published: true,
    });
  }

  for (const eclipse of eclipsesSeed) {
    events.push({
      id: `eclipse:${eclipse.date}:${eclipse.kind}`,
      category: 'astronomical',
      feed: 'eclipses',
      title: `${titleCase(eclipse.subtype)} ${eclipse.kind} eclipse`,
      subtitle: eclipse.observedFrom ? `Times for ${eclipse.observedFrom}` : undefined,
      description: eclipse.visibilityNote,
      eventDate: eclipse.date,
      allDay: false,
      source: 'computed',
      published: true,
    });
  }

  return events.sort((a, b) =>
    a.eventDate === b.eventDate
      ? categoryRank(a.category) - categoryRank(b.category)
      : a.eventDate.localeCompare(b.eventDate),
  );
}

/** Pujas first, then festivals, then the sky, then local events. */
function categoryRank(category: EventCategory): number {
  const order: EventCategory[] = [
    'puja', 'religious_festival', 'public_program', 'seminar', 'workshop', 'other', 'astronomical',
  ];
  return order.indexOf(category);
}

export const ALL_EVENTS: CalendarEvent[] = buildEvents();

/** Eclipse timings, keyed by date, for the day detail screen. */
export const ECLIPSES_BY_DATE = new Map(eclipsesSeed.map((e) => [e.date, e]));

/**
 * Festival <-> puja pairings, so a day showing Janmashtami can point forward to
 * Shri Krishna Puja two days later, and the puja can point back.
 */
export const PUJA_LINKS = linksSeed;

const byDate = new Map<IsoDate, CalendarEvent[]>();
for (const event of ALL_EVENTS) {
  const list = byDate.get(event.eventDate);
  if (list) list.push(event);
  else byDate.set(event.eventDate, [event]);
}

export function eventsOn(date: IsoDate): CalendarEvent[] {
  return byDate.get(date) ?? [];
}

export function eventsBetween(from: IsoDate, to: IsoDate): CalendarEvent[] {
  return ALL_EVENTS.filter((e) => e.eventDate >= from && e.eventDate <= to);
}

/** The next `count` events from `date` onward, for the agenda view. */
export function upcomingFrom(date: IsoDate, count: number): CalendarEvent[] {
  return ALL_EVENTS.filter((e) => e.eventDate >= date).slice(0, count);
}
