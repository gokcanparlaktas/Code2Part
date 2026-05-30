import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Font, catalog warm-up, vb. buraya eklenebilir.
      } finally {
        setAppReady(true);
      }
    }
    prepare();
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
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#F1F5F9' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
