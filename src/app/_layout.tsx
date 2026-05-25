import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
        <Stack.Screen name="history" options={{ title: 'Son Aramalar' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Veri Kontrolü' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
