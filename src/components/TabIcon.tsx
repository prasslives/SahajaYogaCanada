import { View, StyleSheet, type ColorValue } from 'react-native';

export type TabIconName = 'month' | 'week' | 'agenda';

/**
 * Drawn from plain Views. An icon font would be one more native dependency for
 * three shapes, and at tab-bar size these read more cleanly than a glyph does.
 */
export function TabIcon({
  name,
  color,
  focused,
}: {
  name: TabIconName;
  color: ColorValue;
  focused: boolean;
}) {
  const opacity = focused ? 1 : 0.9;

  if (name === 'agenda') {
    return (
      <View style={[styles.box, { opacity }]}>
        {[16, 13, 10].map((width, index) => (
          <View key={index} style={styles.line}>
            <View style={[styles.bullet, { backgroundColor: color }]} />
            <View style={[styles.rule, { width, backgroundColor: color }]} />
          </View>
        ))}
      </View>
    );
  }

  // A single row of cells for the week, three rows of the same cell for the
  // month -- the same shape at two scales, so the pair reads as a set.
  const rows = name === 'month' ? 3 : 1;

  return (
    <View style={[styles.box, { opacity, gap: name === 'month' ? 3 : 0 }]}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 3 }, (_, cell) => (
            <View
              key={cell}
              style={[
                styles.cell,
                name === 'week' && styles.cellWide,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 3 },
  cell: { width: 4.5, height: 4.5, borderRadius: 1.5 },
  cellWide: { width: 5.5, height: 9, borderRadius: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 3.5, height: 6 },
  bullet: { width: 3, height: 3, borderRadius: 1.5 },
  rule: { height: 2, borderRadius: 1 },
});
