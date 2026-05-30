import { Stack, router } from 'expo-router';
import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import {
  isNativeScanAvailable,
  NATIVE_SCAN_UNAVAILABLE_MESSAGE,
} from '@/utils/isNativeScanAvailable';

function ScanUnavailableScreen() {
  const styles = useHomeStyles(createUnavailableStyles);
  const { homeColors } = useTheme();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Text style={styles.title}>Kamera modülü yok</Text>
        <Text style={styles.body}>{NATIVE_SCAN_UNAVAILABLE_MESSAGE}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Geri dön</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function ScanRoute() {
  const { homeColors } = useTheme();
  const nativeAvailable = isNativeScanAvailable();
  const [NativeScanScreen, setNativeScanScreen] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!nativeAvailable) {
      return;
    }

    void import('@/screens/ProductCodeScanScreen').then((module) => {
      setNativeScanScreen(() => module.ProductCodeScanScreen);
    });
  }, [nativeAvailable]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Etiket oku',
          presentation: 'modal',
          headerStyle: { backgroundColor: homeColors.bg },
          headerTintColor: homeColors.textPrimary,
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
            color: homeColors.headerTitle,
          },
          contentStyle: { backgroundColor: homeColors.bg },
        }}
      />
      {!nativeAvailable ? (
        <ScanUnavailableScreen />
      ) : NativeScanScreen ? (
        <NativeScanScreen />
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: homeColors.bg }}>
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color={homeColors.accent} />
          </View>
        </SafeAreaView>
      )}
    </>
  );
}

const createUnavailableStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    safe: {
      backgroundColor: c.bg,
      flex: 1,
    },
    centered: {
      alignItems: 'center',
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    body: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    button: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      marginTop: 8,
      minWidth: 160,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    buttonPressed: {
      opacity: 0.88,
    },
  });
