import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { PreferencesProvider } from '../src/state/preferences';
import { FilterProvider } from '../src/state/filters';
import { useTheme } from '../src/theme/useTheme';
import { font } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    // Show the app once the type is ready, but never hang on a font failure.
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <FilterProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.paper },
              headerTintColor: colors.accent,
              headerTitleStyle: { fontFamily: font.bold, color: colors.ink, fontSize: 16 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.paper },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="day/[date]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
          </Stack>
        </FilterProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
