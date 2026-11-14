import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { radius, space, type } from '../theme/tokens';

/**
 * The heading that introduces a day's events. The relative label sits in a soft
 * pill rather than as loose coloured text, so "Today" reads as a state.
 */
export function SectionHead({
  title,
  badge,
  trailing,
  emphasis,
}: {
  title: string;
  badge?: string;
  trailing?: string;
  /** Renders the badge in vermillion rather than saffron. Used for today. */
  emphasis?: boolean;
}) {
  const { colors } = useTheme();
  const badgeInk = emphasis ? colors.hot : colors.accentInk;
  const badgeBed = emphasis ? colors.hotSoft : colors.accentSoft;

  return (
    <View style={styles.wrap}>
      <Text style={[type.heading, styles.title, { color: colors.ink }]} numberOfLines={1}>
        {title}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: badgeBed }]}>
          <Text style={[type.micro, styles.badgeText, { color: badgeInk }]}>{badge}</Text>
        </View>
      ) : null}
      {trailing && !badge ? (
        <Text style={[type.caption, { color: colors.inkFaint }]}>{trailing}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingBottom: space.sm + 2,
  },
  title: { flexShrink: 1 },
  badge: {
    paddingHorizontal: space.sm + 1,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginLeft: 'auto',
  },
  badgeText: { textTransform: 'uppercase' },
});
