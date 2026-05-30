import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FirstLaunchDisclaimerModal } from '@/components/FirstLaunchDisclaimerModal';
import {
  acceptAppDisclaimer,
  hasAcceptedAppDisclaimer,
} from '@/services/appDisclaimerStore';
import { colors, typography } from '@/theme';

SplashScreen.preventAutoHideAsync();

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
      <StatusBar style="light" />
      <FirstLaunchDisclaimerModal
        visible={disclaimerVisible}
        onAccept={handleAcceptDisclaimer}
      />
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
        <Stack.Screen name="result" options={{ title: 'Sonuç' }} />
        <Stack.Screen name="equivalents" options={{ title: 'Muadiller' }} />
        <Stack.Screen name="all-alternatives" options={{ title: 'Tüm Alternatifler' }} />
        <Stack.Screen name="history" options={{ title: 'Son Aramalar' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Veri Kontrolü' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

