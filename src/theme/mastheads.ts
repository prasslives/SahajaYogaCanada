import type { ImageContentPosition, ImageSource } from 'expo-image';

/**
 * The photographs that sit behind the month header, on a five image rotation.
 * `position` is tuned per photograph so the face is never the part that gets
 * cropped away when the band is short.
 */
export interface Masthead {
  source: ImageSource | number;
  position: ImageContentPosition;
  /** Sampled from the photograph, shown while the JPEG decodes. */
  tint: string;
}

const MASTHEADS: Masthead[] = [
  {
    source: require('../../assets/masthead/arrival.jpg'),
    position: { top: '0%', right: '18%' },
    tint: '#8C4632',
  },
  {
    source: require('../../assets/masthead/light.jpg'),
    position: { top: '18%', left: '50%' },
    tint: '#6B3A08',
  },
  {
    source: require('../../assets/masthead/palms.jpg'),
    position: { top: '8%', left: '42%' },
    tint: '#4C6B4A',
  },
  {
    source: require('../../assets/masthead/portrait.jpg'),
    position: { top: '12%', left: '46%' },
    tint: '#8E3A2E',
  },
  {
    source: require('../../assets/masthead/rose.jpg'),
    position: { top: '8%', left: '50%' },
    tint: '#93402C',
  },
];

/** Stable per month, so paging back and forth never reshuffles the photographs. */
export function mastheadFor(isoDate: string): Masthead {
  const month = Number(isoDate.slice(5, 7)) - 1;
  return MASTHEADS[month % MASTHEADS.length];
}
