import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * True when the native ExpoCamera module is linked (dev client / release build).
 * False in Expo Go, web, and before prebuild.
 */
export function isNativeScanAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  return requireOptionalNativeModule('ExpoCamera') != null;
}

export const NATIVE_SCAN_UNAVAILABLE_MESSAGE =
  'Etiket okuma Expo Go ile çalışmaz. Dev client veya APK gerekir: npm run android';
