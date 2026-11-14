import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Masthead, MastheadPill, MastheadSettings } from '../../src/components/Masthead';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { EventRow } from '../../src/components/EventRow';
import { eventsOn } from '../../src/data/events';
import { useVisibleEvent } from '../../src/state/filters';
import { useTheme } from '../../src/theme/useTheme';
import { font, radius, space, type } from '../../src/theme/tokens';
import { addDays, format, isToday, startOfWeek, todayIso } from '../../src/lib/dates';
import type { IsoDate } from '../../src/domain/types';

export default function WeekScreen() {
  const today = todayIso();
  const [weekStart, setWeekStart] = useState<IsoDate>(startOfWeek(today));
  const { colors } = useTheme();
  const visible = useVisibleEvent();
  const router = useRouter();

  const visibleEventsOn = useCallback(
    (date: IsoDate) => eventsOn(date).filter(visible),
    [visible],
  );

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEnd = days[6];
  const sameMonth = format(weekStart, 'MMM') === format(weekEnd, 'MMM');
  const spanLabel = sameMonth
    ? `${format(weekStart, 'd')} – ${format(weekEnd, 'd MMM')}`
    : `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM')}`;

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Masthead
        date={weekStart}
        eyebrow="This week"
        title={spanLabel}
        meta={format(weekEnd, 'yyyy')}
        onPrev={() => setWeekStart(addDays(weekStart, -7))}
        onNext={() => setWeekStart(addDays(weekStart, 7))}
        action={
          <View style={styles.actions}>
            {weekStart === startOfWeek(today) ? null : (
              <MastheadPill label="This week" onPress={() => setWeekStart(startOfWeek(today))} />
            )}
            <MastheadSettings onPress={() => router.push('/setup')} />
          </View>
        }
      />

      <CategoryFilter />

      <View style={styles.days}>
        {days.map((date) => {
          const events = visibleEventsOn(date);
          const current = isToday(date);

          return (
            <View key={date} style={styles.day}>
              {/*
                The date sits in its own rail so the eye can run straight down
                the week without the event cards shifting it around.
              */}
              <View style={styles.rail}>
                <Text
                  style={[
                    type.micro,
                    styles.railDay,
                    { color: current ? colors.hot : colors.inkFaint },
                  ]}
                >
                  {format(date, 'EEE')}
                </Text>
                <View
                  style={[
                    styles.railPlate,
                    current && { backgroundColor: colors.hotSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.railNumber,
                      { color: current ? colors.hot : colors.ink },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                </View>
              </View>

              <View style={styles.dayBody}>
                {events.length === 0 ? (
                  <View style={[styles.quiet, { borderColor: colors.rule }]} />
                ) : (
                  events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      onPress={() => router.push(`/day/${date}`)}
                    />
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  days: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.lg },
  day: { flexDirection: 'row', gap: space.md },
  rail: { width: 44, alignItems: 'center', gap: 3, paddingTop: 2 },
  railDay: { textTransform: 'uppercase' },
  railPlate: {
    width: 40,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railNumber: { fontFamily: font.extrabold, fontSize: 19, letterSpacing: -0.6 },
  dayBody: { flex: 1, gap: space.sm + 2, justifyContent: 'center', minHeight: 56 },
  /** A quiet day is a rule, not a dash -- it keeps the column rhythm intact. */
  quiet: { borderTopWidth: StyleSheet.hairlineWidth, marginRight: space.xxl },
});
