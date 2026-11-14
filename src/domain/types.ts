/**
 * Core domain types shared by the app, the seed scripts and the Supabase
 * edge functions. Keep this file free of React and Node imports so it can be
 * consumed from every runtime.
 */

/** Drives colour coding on the calendar and the filter chips. */
export type EventCategory =
  | 'puja'
  | 'religious_festival'
  | 'astronomical'
  | 'public_program'
  | 'seminar'
  | 'workshop'
  | 'other';

/** Where a row came from, which decides whether sync may overwrite it. */
export type EventSource = 'cabella' | 'computed' | 'manual';

/**
 * A subscribable strand of the calendar. Finer than `EventCategory`, because
 * the thing a user wants to switch off is usually "Islamic festivals" or "the
 * minor tithis", not "festivals" or "astronomy" wholesale. See `feeds.ts` for
 * the catalogue and the defaults.
 */
export type FeedId =
  | 'sahaja-pujas'
  | 'sahaja-local'
  | 'festivals-hindu'
  | 'festivals-christian'
  | 'festivals-buddhist'
  | 'festivals-islamic'
  | 'festivals-sikh'
  | 'moon-phases'
  | 'moon-tithis'
  | 'eclipses';

/** A calendar date with no time component, always `YYYY-MM-DD`. */
export type IsoDate = string;

export interface CalendarEvent {
  id: string;
  category: EventCategory;
  /** Which strand this came from, and so whether the user has it switched on. */
  feed: FeedId;
  title: string;
  subtitle?: string;
  description?: string;

  eventDate: IsoDate;
  endDate?: IsoDate;
  startTime?: string; // HH:mm, local Toronto time
  endTime?: string;
  allDay: boolean;

  source: EventSource;
  sourceUid?: string;

  venueName?: string;
  address?: string;
  mapUrl?: string;

  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  imageUrl?: string;
  externalUrl?: string;

  city?: string;
  province?: string;

  published: boolean;
}

/**
 * Links a religious festival to the Sahaja puja that celebrates it. These are
 * deliberately separate events because they fall on different days --
 * Janmashtami on 4 Sep 2026, Shri Krishna Puja on 6 Sep 2026.
 */
export interface EventLink {
  festivalEventId: string;
  pujaEventId: string;
}

export type MoonDayKind = 'purnima' | 'amavasya' | 'saptami' | 'navami';
export type Paksha = 'shukla' | 'krishna';

export interface MoonDay {
  date: IsoDate;
  kind: MoonDayKind;
  paksha: Paksha;
  /** 1..30, where 1..15 is shukla and 16..30 is krishna. */
  tithi: number;
}

export type EclipseKind = 'solar' | 'lunar';
export type EclipseSubtype = 'total' | 'partial' | 'annular' | 'penumbral';

export interface Eclipse {
  date: IsoDate;
  kind: EclipseKind;
  subtype: EclipseSubtype;
  /** Only eclipses visible from somewhere in Canada are stored. */
  visibleInCanada: boolean;
  /** ISO instants; rendered to the viewer in America/Toronto. */
  beginAt?: string;
  maxAt: string;
  endAt?: string;
  magnitude?: number;
  /** Fraction of the solar disc covered, 0..1. Solar eclipses only. */
  obscuration?: number;
  /** Human summary of where in Canada it can be seen. */
  visibilityNote?: string;
  /** City whose local circumstances `beginAt`/`maxAt`/`endAt` describe. */
  observedFrom: string;
  /**
   * IANA zone the times should be rendered in. Solar circumstances are local to
   * `observedFrom`, so an eclipse Toronto cannot see must not be shown in
   * Toronto time.
   */
  timeZone: string;
}
