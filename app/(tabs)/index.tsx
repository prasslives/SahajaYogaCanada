import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Masthead, MastheadPill, MastheadSettings } from '../../src/components/Masthead';
import { MonthGrid } from '../../src/components/MonthGrid';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { EventRow } from '../../src/components/EventRow';
import { SectionHead } from '../../src/components/SectionHead';
import { EmptyState } from '../../src/components/EmptyState';
import { eventsOn } from '../../src/data/events';
import { useVisibleEvent } from '../../src/state/filters';
import { useTheme } from '../../src/theme/useTheme';
import { space } from '../../src/theme/tokens';
import {
  addMonths, format, isSameMonth, longDate, relativeLabel, startOfMonth, todayIso,
} from '../../src/lib/dates';
import type { IsoDate } from '../../src/domain/types';

export default function MonthScreen() {
  const today = todayIso();
  const [month, setMonth] = useState<IsoDate>(startOfMonth(today));
  const [selected, setSelected] = useState<IsoDate>(today);
  const { colors } = useTheme();
  const visible = useVisibleEvent();
  const router = useRouter();

  const visibleEventsOn = useCallback(
    (date: IsoDate) => eventsOn(date).filter(visible),
    [visible],
  );

  const selectedEvents = useMemo(() => visibleEventsOn(selected), [visibleEventsOn, selected]);
  const relative = relativeLabel(selected, today);

  const step = (delta: number) => {
    const next = addMonths(month, delta);
    setMonth(next);
    // Keep the selection inside the month being viewed.
    if (next.slice(0, 7) !== selected.slice(0, 7)) setSelected(startOfMonth(next));
  };

  const goToToday = () => {
    setMonth(startOfMonth(today));
    setSelected(today);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Masthead
        date={month}
        eyebrow="Sahaja Yoga Canada"
        title={format(month, 'MMMM')}
        meta={format(month, 'yyyy')}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        action={
          <View style={styles.actions}>
            {isSameMonth(month, today) ? null : (
              <MastheadPill label="Today" onPress={goToToday} />
            )}
            <MastheadSettings onPress={() => router.push('/setup')} />
          </View>
        }
      />

      <CategoryFilter />

      <MonthGrid
        month={month}
        selected={selected}
        eventsFor={visibleEventsOn}
        onSelect={setSelected}
      />

      <View style={styles.below}>
        <SectionHead
          title={longDate(selected)}
          badge={relative || undefined}
          emphasis={relative === 'Today'}
        />

        <View style={styles.list}>
          {selectedEvents.length === 0 ? (
            <EmptyState>Nothing on this day.</EmptyState>
          ) : (
            selectedEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onPress={() => router.push(`/day/${selected}`)}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  below: { paddingHorizontal: space.lg, paddingTop: space.xl },
  list: { gap: space.sm + 2 },
});
