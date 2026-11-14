import { useColorScheme } from 'react-native';
import { palette, categoryColor, shadow, type Palette } from './tokens';
import type { EventCategory } from '../domain/types';

export interface Theme {
  colors: Palette;
  scheme: 'light' | 'dark';
  /**
   * Empty objects in dark mode -- a drop shadow on a near-black ground renders
   * as nothing on iOS and as a grey smear on Android.
   */
  shadow: { card: object; lifted: object };
}

export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return {
    colors: palette[scheme],
    scheme,
    shadow:
      scheme === 'light'
        ? { card: shadow.card, lifted: shadow.lifted }
        : { card: shadow.none, lifted: shadow.none },
  };
}

export function useCategoryColor(): (category: EventCategory) => string {
  const { scheme } = useTheme();
  return (category) => categoryColor[category][scheme];
}
