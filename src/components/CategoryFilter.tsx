import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { useFilters } from '../state/filters';
import { useTheme, useCategoryColor } from '../theme/useTheme';
import { categoryLabel, radius, space, type } from '../theme/tokens';

export function CategoryFilter() {
  const { available, showChips, isOn, toggle } = useFilters();
  const { colors } = useTheme();
  const colorFor = useCategoryColor();

  // With a single subscribed category there is nothing to narrow, so the strip
  // would just be a decorative row of one.
  if (!showChips) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {available.map((category) => {
        const on = isOn(category);
        const accent = colorFor(category);
        return (
          <Pressable
            key={category}
            onPress={() => toggle(category)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: on ? colors.ink : colors.card,
                borderColor: on ? colors.ink : colors.rule,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {/*
              The category's own colour stays on the chip whether it is on or
              off, so the legend for the grid markers never has to be learnt
              twice.
            */}
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text
              style={[
                type.caption,
                styles.label,
                { color: on ? colors.paper : colors.inkSoft },
              ]}
            >
              {categoryLabel[category]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: space.md - 1,
    paddingRight: space.md + 2,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { letterSpacing: -0.1 },
});
