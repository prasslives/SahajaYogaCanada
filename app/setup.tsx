import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Masthead, MastheadBack } from '../src/components/Masthead';
import { FEED_GROUPS, feedsInGroup, type Feed } from '../src/domain/feeds';
import { usePreferences } from '../src/state/preferences';
import { ALL_EVENTS } from '../src/data/events';
import { useTheme, useCategoryColor } from '../src/theme/useTheme';
import { radius, space, type } from '../src/theme/tokens';
import { addDays, todayIso } from '../src/lib/dates';

/** The window the running total is quoted over. */
const PREVIEW_DAYS = 365;

export default function SetupScreen() {
  const { enabled, isOn, toggle, configured, markConfigured, restoreDefaults } = usePreferences();
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayIso();

  /**
   * A live count of what the current selection actually puts on the calendar.
   * The whole reason for this screen is that the unfiltered figure is ~125 a
   * year, so the number has to be visible while you choose.
   */
  const total = useMemo(() => {
    const horizon = addDays(today, PREVIEW_DAYS);
    return ALL_EVENTS.filter(
      (e) => e.eventDate >= today && e.eventDate <= horizon && enabled.has(e.feed),
    ).length;
  }, [enabled, today]);

  const finish = () => {
    markConfigured();
    if (configured) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
        showsVerticalScrollIndicator={false}
      >
        <Masthead
          date={today}
          eyebrow={configured ? 'Calendar settings' : 'Welcome'}
          title="What to show"
          meta="You can change this at any time."
          leading={configured ? <MastheadBack onPress={() => router.back()} /> : undefined}
          height={188}
        />

        <View style={styles.body}>
          <View style={[styles.tally, { backgroundColor: colors.accentSoft }]}>
            <Text style={[type.title, { color: colors.accentInk }]}>{total}</Text>
            <Text style={[type.caption, styles.tallyText, { color: colors.accentInk }]}>
              {total === 1 ? 'entry' : 'entries'} on your calendar over the next year
            </Text>
          </View>

          {FEED_GROUPS.map((group) => (
            <View key={group.id} style={styles.group}>
              <Text style={[type.micro, styles.groupTitle, { color: colors.inkFaint }]}>
                {group.title}
              </Text>
              <Text style={[type.caption, styles.groupCaption, { color: colors.inkSoft }]}>
                {group.caption}
              </Text>

              <View
                style={[
                  styles.card,
                  shadow.card,
                  { backgroundColor: colors.card, borderColor: colors.rule },
                ]}
              >
                {feedsInGroup(group.id).map((feed, index) => (
                  <FeedSwitch
                    key={feed.id}
                    feed={feed}
                    on={isOn(feed.id)}
                    onToggle={() => toggle(feed.id)}
                    first={index === 0}
                  />
                ))}
              </View>
            </View>
          ))}

          <Pressable
            onPress={restoreDefaults}
            style={({ pressed }) => [styles.reset, pressed && { opacity: 0.6 }]}
          >
            <Text style={[type.caption, styles.resetText, { color: colors.inkFaint }]}>
              Restore defaults
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Pinned, so the count and the way out are reachable without scrolling back. */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + space.md,
            backgroundColor: colors.paper,
            borderTopColor: colors.rule,
          },
        ]}
      >
        <Pressable
          onPress={finish}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primary,
            shadow.card,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[type.bodyStrong, { color: colors.onAccent }]}>
            {configured ? 'Done' : 'Show my calendar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FeedSwitch({
  feed,
  on,
  onToggle,
  first,
}: {
  feed: Feed;
  on: boolean;
  onToggle: () => void;
  first: boolean;
}) {
  const { colors } = useTheme();
  const colorFor = useCategoryColor();
  const accent = colorFor(feed.category);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={feed.title}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
        pressed && { backgroundColor: colors.cardSunken },
      ]}
    >
      <View style={[styles.rowDot, { backgroundColor: accent, opacity: on ? 1 : 0.35 }]} />
      <View style={styles.rowBody}>
        <Text style={[type.bodyStrong, { color: colors.ink }]}>{feed.title}</Text>
        <Text style={[type.caption, { color: colors.inkSoft }]}>{feed.detail}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={onToggle}
        trackColor={{ false: colors.rule, true: accent }}
        thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        ios_backgroundColor={colors.rule}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {},
  body: { paddingHorizontal: space.lg, paddingTop: space.xl, gap: space.xl },
  tally: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  tallyText: { flex: 1 },
  group: { gap: 2 },
  groupTitle: { textTransform: 'uppercase' },
  groupCaption: { marginBottom: space.sm + 2 },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + 2,
    paddingHorizontal: space.lg,
  },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1, gap: 2 },
  reset: { alignSelf: 'center', paddingVertical: space.sm },
  resetText: { textDecorationLine: 'underline' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    borderRadius: radius.lg,
    paddingVertical: space.md + 3,
    alignItems: 'center',
  },
});
