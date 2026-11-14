import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';
import { Masthead, MastheadBack } from '../../src/components/Masthead';
import { EventRow } from '../../src/components/EventRow';
import { EmptyState } from '../../src/components/EmptyState';
import { eventsOn, ECLIPSES_BY_DATE, PUJA_LINKS } from '../../src/data/events';
import { useTheme } from '../../src/theme/useTheme';
import { font, radius, space, type } from '../../src/theme/tokens';
import { addDays, format, relativeLabel, shortDate, todayIso } from '../../src/lib/dates';

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors, shadow } = useTheme();
  const router = useRouter();

  const events = eventsOn(date);
  const eclipse = ECLIPSES_BY_DATE.get(date);
  const relative = relativeLabel(date, todayIso());

  // A day can be either half of a festival/puja pair, so look both ways.
  const pairings = PUJA_LINKS.filter(
    (link) => link.pujaDate === date || link.festivalDate === date,
  );

  const time = (iso?: string, zone = 'America/Toronto') =>
    iso ? formatInTimeZone(new Date(iso), zone, 'h:mm a') : '—';

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Masthead
        date={date}
        eyebrow={relative || format(date, 'EEEE')}
        title={format(date, 'd MMMM')}
        meta={format(date, 'EEEE yyyy')}
        leading={<MastheadBack onPress={() => router.back()} />}
        onPrev={() => router.replace(`/day/${addDays(date, -1)}`)}
        onNext={() => router.replace(`/day/${addDays(date, 1)}`)}
        height={188}
      />

      <View style={styles.body}>
        {pairings.length > 0 ? (
          <View
            style={[
              styles.panel,
              shadow.card,
              { backgroundColor: colors.accentSoft, borderColor: colors.accent + '33' },
            ]}
          >
            <Text style={[type.micro, styles.panelHead, { color: colors.accentInk }]}>
              Festival and puja
            </Text>
            {pairings.map((link) => (
              <Text key={link.pujaUid} style={[type.body, { color: colors.ink }]}>
                <Text style={{ fontFamily: font.bold }}>{link.festivalName}</Text> falls on{' '}
                {shortDate(link.festivalDate)}, and{' '}
                <Text style={{ fontFamily: font.bold }}>{link.pujaTitle}</Text> is celebrated on{' '}
                {shortDate(link.pujaDate)}
                {link.dayGap !== 0
                  ? ` — ${Math.abs(link.dayGap)} day${Math.abs(link.dayGap) === 1 ? '' : 's'} ${link.dayGap > 0 ? 'later' : 'earlier'}.`
                  : ' — the same day.'}
              </Text>
            ))}
          </View>
        ) : null}

        {eclipse ? (
          <View
            style={[
              styles.panel,
              shadow.card,
              { backgroundColor: colors.card, borderColor: colors.rule },
            ]}
          >
            <Text style={[type.micro, styles.panelHead, { color: colors.inkSoft }]}>
              Eclipse timings · {eclipse.observedFrom}
            </Text>
            <View style={styles.eclipseRow}>
              {(
                [
                  ['Begins', eclipse.beginAt],
                  ['Maximum', eclipse.maxAt],
                  ['Ends', eclipse.endAt],
                ] as const
              ).map(([label, value]) => (
                <View key={label} style={styles.eclipseCell}>
                  <Text style={[type.caption, { color: colors.inkFaint }]}>{label}</Text>
                  <Text
                    style={[
                      styles.eclipseTime,
                      { color: label === 'Maximum' ? colors.hot : colors.ink },
                    ]}
                  >
                    {time(value, eclipse.timeZone)}
                  </Text>
                </View>
              ))}
            </View>
            {eclipse.obscuration != null ? (
              <Text style={[type.caption, { color: colors.inkSoft }]}>
                {(eclipse.obscuration * 100).toFixed(0)}% of the Sun covered.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.list}>
          {events.length === 0 ? (
            <EmptyState>Nothing on this day.</EmptyState>
          ) : (
            events.map((event) => <EventRow key={event.id} event={event} />)
          )}
        </View>

        {events.some((e) => e.description) ? (
          <View style={styles.notes}>
            {events
              .filter((e) => e.description)
              .map((event) => (
                <View key={event.id} style={styles.note}>
                  <View style={[styles.noteRule, { backgroundColor: colors.accent }]} />
                  <View style={styles.noteBody}>
                    <Text style={[type.bodyStrong, { color: colors.ink }]}>{event.title}</Text>
                    <Text style={[type.body, { color: colors.inkSoft }]}>{event.description}</Text>
                  </View>
                </View>
              ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  body: { padding: space.lg, paddingTop: space.xl, gap: space.lg },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  panelHead: { textTransform: 'uppercase' },
  eclipseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  eclipseCell: { alignItems: 'center', flex: 1, gap: 3 },
  eclipseTime: { fontFamily: font.extrabold, fontSize: 17, letterSpacing: -0.4 },
  list: { gap: space.sm + 2 },
  notes: { gap: space.md },
  note: { flexDirection: 'row', gap: space.md },
  /** A rounded rail rather than a full-height border -- softer against paper. */
  noteRule: { width: 3, borderRadius: 2, opacity: 0.5 },
  noteBody: { flex: 1, gap: 3 },
});
