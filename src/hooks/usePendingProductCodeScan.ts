import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { prepareScannedProductCodeText } from '@/domain/labelReading/prepareScannedProductCodeText';
import {
  takePendingScanResult,
  type ProductCodeScanTarget,
} from '@/services/scanCaptureStore';

export function usePendingProductCodeScan(
  target: ProductCodeScanTarget,
  onCode: (code: string) => void
): void {
  useFocusEffect(
    useCallback(() => {
      const pending = takePendingScanResult(target);
      if (pending) {
        onCode(prepareScannedProductCodeText(pending));
      }
    }, [target, onCode])
  );
}
