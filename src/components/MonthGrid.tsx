import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { CalendarEvent, EventCategory, IsoDate } from '../domain/types';
import { useTheme, useCategoryColor } from '../theme/useTheme';
import { font, radius, space, type } from '../theme/tokens';
import { WEEKDAY_INITIALS, dayNumber, isSameMonth, isToday, monthMatrix } from '../lib/dates';

/** Up to three markers per day; beyond that the last one becomes a tally. */
const MAX_MARKERS = 3;

export function MonthGrid({
  month,
  selected,
  eventsFor,
  onSelect,
}: {
  month: IsoDate;
  selected: IsoDate;
  eventsFor: (date: IsoDate) => CalendarEvent[];
  onSelect: (date: IsoDate) => void;
}) {
  const { colors } = useTheme();
  const colorFor = useCategoryColor();
  const weeks = monthMatrix(month);

  return (
    <View style={styles.wrap}>
      <View style={styles.weekdays}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <Text key={index} style={[type.micro, styles.weekday, { color: colors.inkFaint }]}>
            {initial}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((date) => {
            const inMonth = isSameMonth(date, month);
            const today = isToday(date);
            const isSelected = date === selected;
            const events = eventsFor(date);

            // Dedupe so a day with four festivals shows one festival marker.
            const categories = [...new Set(events.map((e) => e.category))] as EventCategory[];
            const overflow = categories.length - MAX_MARKERS;

            return (
              <Pressable
                key={date}
                onPress={() => onSelect(date)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${date}, ${events.length} events`}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.plate,
                    isSelected && { backgroundColor: colors.ink },
                    !isSelected && today && { backgroundColor: colors.hotSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        fontFamily: today || isSelected ? font.extrabold : font.medium,
                        color: isSelected
                          ? colors.paper
                          : today
                            ? colors.hot
                            : inMonth
                              ? colors.ink
                              : colors.inkFaint,
                      },
                    ]}
                  >
                    {dayNumber(date)}
                  </Text>
                </View>

                <View style={styles.markers}>
                  {categories.slice(0, MAX_MARKERS).map((category) => (
                    <View
                      key={category}
                      style={[
                        styles.marker,
                        {
                          backgroundColor: isSelected ? colors.inkFaint : colorFor(category),
                          opacity: inMonth ? 1 : 0.3,
                        },
                      ]}
                    />
                  ))}
                  {overflow > 0 ? (
                    <Text style={[styles.overflow, { color: colors.inkFaint }]}>
                      +{overflow}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.md },
  weekdays: { flexDirection: 'row', paddingBottom: space.sm },
  weekday: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 5 },
  /**
   * A rounded square rather than a circle. Circles read as stock iOS calendar,
   * and the squarer plate lines the grid up into visible columns.
   */
  plate: {
    width: 38,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 15, letterSpacing: -0.4 },
  /** Short bars instead of dots -- they stay legible at a glance in a dense grid. */
  markers: { flexDirection: 'row', gap: 3, height: 4, alignItems: 'center' },
  marker: { width: 7, height: 3, borderRadius: 2 },
  overflow: { fontFamily: font.bold, fontSize: 9, lineHeight: 10 },
});
