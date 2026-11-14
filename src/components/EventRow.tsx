import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { CalendarEvent } from '../domain/types';
import { useTheme, useCategoryColor } from '../theme/useTheme';
import { categoryLabel, radius, space, type } from '../theme/tokens';

/** `HH:mm` in Toronto local time, as it is stored, rendered for reading. */
function clockLabel(event: CalendarEvent): string | null {
  if (event.allDay || !event.startTime) return null;
  const [hours, minutes] = event.startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const suffix = hours < 12 ? 'am' : 'pm';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  const start = minutes === 0 ? `${hour}${suffix}` : `${hour}:${String(minutes).padStart(2, '0')}${suffix}`;
  return event.venueName ? `${start} · ${event.venueName}` : start;
}

export function EventRow({
  event,
  onPress,
  showDate,
}: {
  event: CalendarEvent;
  onPress?: () => void;
  showDate?: string;
}) {
  const { colors, shadow } = useTheme();
  const colorFor = useCategoryColor();
  const accent = colorFor(event.category);
  const clock = clockLabel(event);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.card,
        shadow.card,
        { backgroundColor: colors.card, borderColor: colors.rule },
        pressed && { backgroundColor: colors.cardSunken, transform: [{ scale: 0.994 }] },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[type.micro, styles.category, { color: accent }]} numberOfLines={1}>
          {categoryLabel[event.category]}
        </Text>
        {showDate ? (
          <Text style={[type.micro, styles.date, { color: colors.inkFaint }]}>{showDate}</Text>
        ) : null}
      </View>

      <Text style={[type.heading, { color: colors.ink }]}>{event.title}</Text>

      {event.subtitle ? (
        <Text style={[type.caption, { color: colors.inkSoft }]}>{event.subtitle}</Text>
      ) : null}

      {clock ? (
        <Text style={[type.caption, styles.clock, { color: colors.accentInk }]}>{clock}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md + 2,
    paddingHorizontal: space.lg,
    gap: 3,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  category: { textTransform: 'uppercase', flexShrink: 1 },
  date: { textTransform: 'uppercase', marginLeft: 'auto' },
  clock: { marginTop: 3 },
});
