import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FirstLaunchDisclaimerModal } from '@/components/FirstLaunchDisclaimerModal';
import {
  acceptAppDisclaimer,
  hasAcceptedAppDisclaimer,
} from '@/services/appDisclaimerStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { colors, typography } from '@/theme';
import { StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const { homeColors, isDark } = useTheme();
  const styles = useHomeStyles(createStackStyles);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy[900] },
          headerTintColor: colors.text.inverse,
          headerTitleStyle: { ...typography.h3, color: colors.text.inverse },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background.screen },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ title: 'Ürün kodu ara' }} />
        <Stack.Screen
          name="result"
          options={{
            title: 'Sonuç',
            headerTitleAlign: 'left',
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: homeColors.bg },
            headerTintColor: homeColors.textPrimary,
            headerTitleStyle: {
              fontSize: 17,
              fontWeight: '600',
              color: homeColors.headerTitle,
            },
            headerLeftContainerStyle: { paddingLeft: 4 },
            headerTitleContainerStyle: { paddingLeft: 0 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: homeColors.bg },
          }}
        />
        <Stack.Screen
          name="equivalents"
          options={{
            title: 'Muadiller',
            headerTitleAlign: 'left',
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: homeColors.bg },
            headerTintColor: homeColors.textPrimary,
            headerTitleStyle: styles.headerTitle,
            headerLeftContainerStyle: { paddingLeft: 4 },
            headerTitleContainerStyle: { paddingLeft: 0 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: homeColors.bg },
          }}
        />
        <Stack.Screen
          name="all-alternatives"
          options={{
            title: 'Tüm alternatifler',
            headerTitleAlign: 'left',
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: homeColors.bg },
            headerTintColor: homeColors.textPrimary,
            headerTitleStyle: styles.headerTitle,
            headerLeftContainerStyle: { paddingLeft: 4 },
            headerTitleContainerStyle: { paddingLeft: 0 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: homeColors.bg },
          }}
        />
        <Stack.Screen name="history" options={{ title: 'Son Aramalar' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Veri Kontrolü' }} />
      </Stack>
    </>
  );
}

const createStackStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.headerTitle,
    },
  });

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const accepted = await hasAcceptedAppDisclaimer();
        if (!accepted) {
          setDisclaimerVisible(true);
        }
      } finally {
        setAppReady(true);
      }
    }
    void prepare();
  }, []);

  const handleAcceptDisclaimer = useCallback(async () => {
    await acceptAppDisclaimer();
    setDisclaimerVisible(false);
  }, []);

  const onRootLayout = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onRootLayout}>
      <ThemeProvider>
        <FirstLaunchDisclaimerModal
          visible={disclaimerVisible}
          onAccept={handleAcceptDisclaimer}
        />
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
