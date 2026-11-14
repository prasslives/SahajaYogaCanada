import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, type ColorValue } from 'react-native';
import { TabIcon, type TabIconName } from '../../src/components/TabIcon';
import { usePreferences } from '../../src/state/preferences';
import { useTheme } from '../../src/theme/useTheme';
import { font } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { ready, configured } = usePreferences();
  const router = useRouter();

  // First run drops straight into setup rather than into a calendar carrying
  // every tithi and every tradition at once.
  useEffect(() => {
    if (ready && !configured) router.replace('/setup');
  }, [ready, configured, router]);

  // Holding the tabs back until storage has been read avoids a flash of the
  // default selection before a returning user's own choices land.
  if (!ready) return null;

  const screen = (name: TabIconName, title: string) => ({
    title,
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <TabIcon name={name} color={color} focused={focused} />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.rule,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: {
          fontFamily: font.semibold,
          fontSize: 11,
          letterSpacing: 0.1,
          marginTop: 4,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={screen('month', 'Month')} />
      <Tabs.Screen name="week" options={screen('week', 'Week')} />
      <Tabs.Screen name="agenda" options={screen('agenda', 'Agenda')} />
    </Tabs>
  );
}
