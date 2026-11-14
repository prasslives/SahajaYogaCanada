import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chevron } from './Chevron';
import { mastheadFor } from '../theme/mastheads';
import { radius, space, type } from '../theme/tokens';

/** Type over a photograph is always warm white, in either colour scheme. */
const ON_PHOTO = '#FFF8EF';
const ON_PHOTO_SOFT = 'rgba(255, 248, 239, 0.72)';

export function Masthead({
  date,
  eyebrow,
  title,
  meta,
  onPrev,
  onNext,
  onTitlePress,
  leading,
  action,
  height = 208,
}: {
  /** Picks which photograph is shown. */
  date: string;
  eyebrow: string;
  title: string;
  meta?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onTitlePress?: () => void;
  /** Optional control in the top left, e.g. a back button. */
  leading?: ReactNode;
  /** Optional control in the top right, e.g. a "Today" pill. */
  action?: ReactNode;
  height?: number;
}) {
  const insets = useSafeAreaInsets();
  const photo = mastheadFor(date);

  return (
    /* The tint is sampled from the photograph, so the band never flashes white
       while the JPEG decodes. */
    <View style={[styles.wrap, { height: height + insets.top, backgroundColor: photo.tint }]}>
      <Image
        source={photo.source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={photo.position}
        transition={280}
        cachePolicy="memory-disk"
      />

      <LinearGradient
        colors={['rgba(26, 14, 6, 0.62)', 'rgba(26, 14, 6, 0)']}
        style={[styles.scrim, { height: insets.top + 56 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(26, 14, 6, 0)', 'rgba(26, 14, 6, 0.42)', 'rgba(26, 14, 6, 0.88)']}
        locations={[0, 0.45, 1]}
        style={[styles.scrim, styles.bottomScrim]}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.topRow}>
          {leading}
          <Text style={[type.micro, styles.eyebrow]} numberOfLines={1}>
            {eyebrow}
          </Text>
          {action}
        </View>

        <View style={styles.bottomRow}>
          <Pressable
            onPress={onTitlePress}
            disabled={!onTitlePress}
            style={styles.titleBlock}
            accessibilityRole={onTitlePress ? 'button' : undefined}
          >
            <Text style={[type.display, styles.title]} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
            {meta ? <Text style={[type.caption, styles.meta]}>{meta}</Text> : null}
          </Pressable>

          {onPrev && onNext ? (
            <View style={styles.nav}>
              <NavButton onPress={onPrev} direction="left" label="Previous" />
              <NavButton onPress={onNext} direction="right" label="Next" />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function NavButton({
  onPress,
  direction,
  label,
}: {
  onPress: () => void;
  direction: 'left' | 'right';
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
    >
      <Chevron direction={direction} color={ON_PHOTO} size={10} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0 },
  bottomScrim: { top: undefined, bottom: 0, height: '68%' },
  content: {
    flex: 1,
    paddingHorizontal: space.lg + 2,
    paddingBottom: space.lg + 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  eyebrow: {
    color: ON_PHOTO_SOFT,
    textTransform: 'uppercase',
    flexShrink: 1,
    // Pushes whatever sits in `action` to the far right, with or without a
    // leading control present.
    marginRight: 'auto',
  },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
  },
  titleBlock: { flexShrink: 1 },
  title: { color: ON_PHOTO },
  meta: { color: ON_PHOTO_SOFT, marginTop: 2 },
  nav: { flexDirection: 'row', gap: space.sm, paddingBottom: 2 },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 239, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 248, 239, 0.3)',
  },
  navButtonPressed: { backgroundColor: 'rgba(255, 248, 239, 0.32)' },
});

/** The "Today" pill that the month and week screens drop into `action`. */
export function MastheadPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [pillStyles.pill, pressed && pillStyles.pressed]}
    >
      <Text style={[type.micro, pillStyles.label]}>{label}</Text>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 248, 239, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 248, 239, 0.34)',
  },
  pressed: { backgroundColor: 'rgba(255, 248, 239, 0.34)' },
  label: { color: ON_PHOTO, textTransform: 'uppercase' },
});

/** The circular back control the day screen puts in `leading`. */
export function MastheadBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed }) => [backStyles.button, pressed && backStyles.pressed]}
    >
      <Chevron direction="left" color={ON_PHOTO} size={10} />
    </Pressable>
  );
}

const backStyles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
    backgroundColor: 'rgba(255, 248, 239, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 248, 239, 0.32)',
  },
  pressed: { backgroundColor: 'rgba(255, 248, 239, 0.34)' },
});

/** The sliders control that opens the setup screen. */
export function MastheadSettings({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Choose what to show"
      style={({ pressed }) => [backStyles.button, pressed && backStyles.pressed]}
    >
      <View style={settingsStyles.glyph}>
        {[9, 2].map((knobLeft, index) => (
          <View key={index} style={settingsStyles.track}>
            <View style={settingsStyles.rule} />
            <View style={[settingsStyles.knob, { left: knobLeft }]} />
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const settingsStyles = StyleSheet.create({
  glyph: { width: 16, height: 13, justifyContent: 'space-between' },
  track: { height: 5, justifyContent: 'center' },
  rule: { height: 1.5, borderRadius: 1, backgroundColor: ON_PHOTO, opacity: 0.75 },
  knob: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ON_PHOTO,
  },
});
