import { useMemo } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Masthead, MastheadSettings } from '../../src/components/Masthead';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { EventRow } from '../../src/components/EventRow';
import { SectionHead } from '../../src/components/SectionHead';
import { ALL_EVENTS } from '../../src/data/events';
import { useVisibleEvent } from '../../src/state/filters';
import { useTheme } from '../../src/theme/useTheme';
import { radius, space, type } from '../../src/theme/tokens';
import { addDays, format, relativeLabel, todayIso } from '../../src/lib/dates';
import type { CalendarEvent } from '../../src/domain/types';

/** How far ahead the agenda looks. Enough to cover a full puja year. */
const HORIZON_DAYS = 400;

export default function AgendaScreen() {
  const today = todayIso();
  const { colors } = useTheme();
  const visible = useVisibleEvent();
  const router = useRouter();

  const { sections, count } = useMemo(() => {
    const horizon = addDays(today, HORIZON_DAYS);

    const upcoming = ALL_EVENTS.filter(
      (e) => e.eventDate >= today && e.eventDate <= horizon && visible(e),
    );

    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of upcoming) {
      const list = grouped.get(event.eventDate);
      if (list) list.push(event);
      else grouped.set(event.eventDate, [event]);
    }
    return {
      sections: [...grouped.entries()].map(([date, data]) => ({ date, data })),
      count: upcoming.length,
    };
  }, [today, visible]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Masthead
              date={today}
              eyebrow="Sahaja Yoga Canada"
              title="Upcoming"
              meta={`${count} ${count === 1 ? 'event' : 'events'} ahead`}
              action={<MastheadSettings onPress={() => router.push('/setup')} />}
            />
            <CategoryFilter />
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, styles.emptyText, { color: colors.inkFaint }]}>
              Nothing coming up in what you have chosen to show.
            </Text>
            <Pressable
              onPress={() => router.push('/setup')}
              style={({ pressed }) => [
                styles.emptyButton,
                { borderColor: colors.rule, backgroundColor: colors.card },
                pressed && { backgroundColor: colors.cardSunken },
              ]}
            >
              <Text style={[type.bodyStrong, { color: colors.accentInk }]}>
                Choose what to show
              </Text>
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const relative = relativeLabel(section.date, today);
          return (
            <View style={styles.sectionHeader}>
              <SectionHead
                title={format(section.date, 'EEEE d MMMM')}
                badge={relative || undefined}
                trailing={format(section.date, 'yyyy')}
                emphasis={relative === 'Today'}
              />
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <EventRow event={item} onPress={() => router.push(`/day/${item.eventDate}`)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  sectionHeader: { paddingHorizontal: space.lg, paddingTop: space.lg },
  item: { paddingHorizontal: space.lg, marginBottom: space.sm + 2 },
  empty: { alignItems: 'center', paddingTop: space.xxl, paddingHorizontal: space.xl, gap: space.lg },
  emptyText: { textAlign: 'center' },
  emptyButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
});
