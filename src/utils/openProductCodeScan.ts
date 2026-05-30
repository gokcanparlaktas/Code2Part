import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import type { ProductCodeScanTarget } from '@/services/scanCaptureStore';
import {
  isNativeScanAvailable,
  NATIVE_SCAN_UNAVAILABLE_MESSAGE,
} from '@/utils/isNativeScanAvailable';

export function openProductCodeScan(target: ProductCodeScanTarget): void {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Kamera kullanılamıyor',
      'Etiket okuma yalnızca mobil uygulamada (Android veya iOS) kullanılabilir.'
    );
    return;
  }

  if (!isNativeScanAvailable()) {
    Alert.alert('Geliştirme sürümü gerekli', NATIVE_SCAN_UNAVAILABLE_MESSAGE);
    return;
  }

  router.push({
    pathname: '/scan',
    params: { target },
  });
}
