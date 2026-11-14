import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { radius, space, type } from '../theme/tokens';

/**
 * A filled, sunken panel. The dashed outline this replaced read as a drop
 * target rather than as a settled, empty day.
 */
export function EmptyState({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.paperSunken }]}>
      <View style={[styles.mark, { backgroundColor: colors.rule }]} />
      <Text style={[type.caption, { color: colors.inkFaint }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: space.md,
  },
  mark: { width: 26, height: 3, borderRadius: 2 },
});
