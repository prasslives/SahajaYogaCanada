/**
 * Design tokens drawn from the collective's own photographs: the vermillion of
 * the sari and the bindi, the saffron-to-white burst of the light photograph,
 * the verdigris of the palm leaves, all resting on warm bone paper.
 *
 * Light is the primary scheme. Dark mirrors it rather than leading it.
 */

export const palette = {
  light: {
    paper: '#FBF7F2',
    paperSunken: '#F4EDE3',
    card: '#FFFFFF',
    cardSunken: '#F8F2EA',
    ink: '#1A1310',
    inkSoft: '#6B5A4C',
    inkFaint: '#A7927E',
    rule: '#EBE0D2',
    ruleStrong: '#DCCDB9',

    /** Burnt saffron. The primary action colour. */
    accent: '#C2661A',
    accentSoft: '#FBEEDC',
    /** Dark enough to set body copy in. */
    accentInk: '#8F4712',

    /** Vermillion. Reserved for today and for live, time-critical things. */
    hot: '#B92D14',
    hotSoft: '#FBE6E0',

    onAccent: '#FFFBF5',
    /** Laid over photographs so type stays legible on top of them. */
    scrim: '#1A0E06',
  },
  dark: {
    paper: '#120D09',
    paperSunken: '#0B0806',
    card: '#1C1511',
    cardSunken: '#171009',
    ink: '#F6EEE4',
    inkSoft: '#B6A395',
    inkFaint: '#7E6C5E',
    rule: '#2C221B',
    ruleStrong: '#3E2F25',

    accent: '#F0A030',
    accentSoft: '#2A1B0C',
    accentInk: '#F7BE6A',

    hot: '#F2735A',
    hotSoft: '#2B1109',

    onAccent: '#170E06',
    scrim: '#000000',
  },
};

export type Palette = typeof palette.light;

/**
 * Per-category accent. Each one is pulled from a specific photograph so the
 * whole set reads as one family rather than as seven arbitrary hues.
 */
export const categoryColor = {
  puja: { light: '#B92D14', dark: '#F2735A' },
  religious_festival: { light: '#C2661A', dark: '#F0A030' },
  astronomical: { light: '#3F4E86', dark: '#8FA0DC' },
  public_program: { light: '#1F7A63', dark: '#5FC2A6' },
  seminar: { light: '#7A3B6B', dark: '#C98BB8' },
  workshop: { light: '#8A6A14', dark: '#D8B04A' },
  other: { light: '#77685B', dark: '#A2907F' },
} as const;

export const categoryLabel = {
  puja: 'Pujas',
  religious_festival: 'Festivals',
  astronomical: 'Moon & eclipses',
  public_program: 'Public programs',
  seminar: 'Seminars',
  workshop: 'Workshops',
  other: 'Other',
} as const;

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 18, xl: 24, pill: 999,
} as const;

/**
 * Manrope carries the whole app. It is a geometric grotesque with tall figures,
 * which is what a calendar mostly renders. Weight is selected by family name,
 * not by `fontWeight` -- React Native will synthesise a fake bold otherwise.
 */
export const font = {
  light: 'Manrope_300Light',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

/** One scale, used everywhere, so nothing is sized by hand at the call site. */
export const type = {
  display: { fontFamily: font.extrabold, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  title: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 27, letterSpacing: -0.5 },
  heading: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  /** Uppercase eyebrows. Always pair with `textTransform: 'uppercase'`. */
  micro: { fontFamily: font.extrabold, fontSize: 10, lineHeight: 13, letterSpacing: 1.4 },
  numeral: { fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.2 },
} as const;

/**
 * Shadows only carry in the light scheme. On dark grounds a raised border does
 * the same job, so `useTheme` hands back empty shadows there.
 */
export const shadow = {
  none: {},
  card: {
    shadowColor: '#4A2E14',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  lifted: {
    shadowColor: '#4A2E14',
    shadowOpacity: 0.13,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
} as const;
