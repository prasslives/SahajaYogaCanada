import { View, type ColorValue } from 'react-native';

/**
 * Drawn from two rotated bars rather than set as a glyph. Manrope carries no
 * guillemets, and dropping to the system font for one character makes the
 * arrows sit visibly differently on iOS and Android.
 */
export function Chevron({
  direction,
  color,
  size = 9,
  weight = 1.8,
}: {
  direction: 'left' | 'right';
  color: ColorValue;
  size?: number;
  weight?: number;
}) {
  // Half the diagonal of a bar rotated 45 degrees, which is where the two
  // halves have to meet for the vertex to land cleanly on the point.
  const offset = size * 0.354;
  const bar = {
    position: 'absolute' as const,
    width: size,
    height: weight,
    borderRadius: weight,
    backgroundColor: color,
  };
  const lean = direction === 'right' ? 1 : -1;

  return (
    <View
      style={{
        width: size * 0.75 + weight * 2,
        height: size * 0.75 + offset * 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={[bar, { transform: [{ translateY: -offset }, { rotate: `${45 * lean}deg` }] }]}
      />
      <View
        style={[bar, { transform: [{ translateY: offset }, { rotate: `${-45 * lean}deg` }] }]}
      />
    </View>
  );
}
