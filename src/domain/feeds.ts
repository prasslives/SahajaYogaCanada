/**
 * The catalogue of calendar strands a user can switch on and off.
 *
 * The full dataset runs to roughly 125 entries a year, and only 13 of those are
 * pujas. Showing all of it at once buries the thing most people opened the app
 * for, so nothing but the pujas is on until the user asks for it.
 */
import type { EventCategory, FeedId } from './types';

export type FeedGroupId = 'sahaja' | 'festivals' | 'sky';

export interface Feed {
  id: FeedId;
  group: FeedGroupId;
  title: string;
  /** One line under the title on the setup screen. */
  detail: string;
  category: EventCategory;
  defaultOn: boolean;
}

export interface FeedGroup {
  id: FeedGroupId;
  title: string;
  caption: string;
}

export const FEED_GROUPS: FeedGroup[] = [
  {
    id: 'sahaja',
    title: 'Sahaja Yoga',
    caption: 'The puja year. Left on unless you turn it off.',
  },
  {
    id: 'festivals',
    title: 'Religious festivals',
    caption: 'Sahaja Yoga celebrates across traditions. Pick the ones you follow.',
  },
  {
    id: 'sky',
    title: 'The sky',
    caption: 'Moon days and eclipses, reckoned at New Delhi sunrise.',
  },
];

export const FEEDS: Feed[] = [
  {
    id: 'sahaja-pujas',
    group: 'sahaja',
    title: 'Pujas',
    detail: 'The worldwide calendar published by the Shri Mataji Foundation.',
    category: 'puja',
    defaultOn: true,
  },
  {
    id: 'sahaja-local',
    group: 'sahaja',
    title: 'Canadian pujas',
    detail: 'Sankranti and Christmas Puja, observed here but not published by Cabella.',
    category: 'puja',
    defaultOn: true,
  },

  {
    id: 'festivals-hindu',
    group: 'festivals',
    title: 'Hindu',
    detail: 'Mahashivaratri, Holi, Janmashtami, Navaratri, Diwali and the rest.',
    category: 'religious_festival',
    defaultOn: false,
  },
  {
    id: 'festivals-christian',
    group: 'festivals',
    title: 'Christian',
    detail: 'Good Friday, Easter, Christmas and the moveable feasts.',
    category: 'religious_festival',
    defaultOn: false,
  },
  {
    id: 'festivals-buddhist',
    group: 'festivals',
    title: 'Buddhist',
    detail: 'Vesak and Buddha Purnima.',
    category: 'religious_festival',
    defaultOn: false,
  },
  {
    id: 'festivals-islamic',
    group: 'festivals',
    title: 'Islamic',
    detail: 'Ramadan, Eid al-Fitr, Eid al-Adha and Muharram.',
    category: 'religious_festival',
    defaultOn: false,
  },
  {
    id: 'festivals-sikh',
    group: 'festivals',
    title: 'Sikh',
    detail: 'Vaisakhi and the gurpurabs.',
    category: 'religious_festival',
    defaultOn: false,
  },

  {
    id: 'moon-phases',
    group: 'sky',
    title: 'Full and new moon',
    detail: 'Purnima and Amavasya. Around two a month.',
    category: 'astronomical',
    defaultOn: false,
  },
  {
    id: 'moon-tithis',
    group: 'sky',
    title: 'Saptami and Navami',
    detail: 'The minor tithis. Around four a month, and the bulk of the calendar.',
    category: 'astronomical',
    defaultOn: false,
  },
  {
    id: 'eclipses',
    group: 'sky',
    title: 'Eclipses',
    detail: 'Solar and lunar eclipses visible from Canada, with local timings.',
    category: 'astronomical',
    defaultOn: false,
  },
];

export const FEEDS_BY_ID = new Map(FEEDS.map((feed) => [feed.id, feed]));

export const DEFAULT_FEED_IDS: FeedId[] = FEEDS.filter((f) => f.defaultOn).map((f) => f.id);

export const feedsInGroup = (group: FeedGroupId): Feed[] =>
  FEEDS.filter((feed) => feed.group === group);

/** Drops ids from an older build so a stored selection never wedges the app. */
export function sanitiseFeedIds(stored: unknown): FeedId[] | null {
  if (!Array.isArray(stored)) return null;
  const known = stored.filter((id): id is FeedId => FEEDS_BY_ID.has(id as FeedId));
  return known.length > 0 ? known : null;
}
