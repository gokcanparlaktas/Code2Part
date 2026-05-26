/**
 * Practical Yuken DSG spool function code tags (catalog hints, not simulation).
 */

import type {
  HydraulicFunctionCenterCondition,
  HydraulicFunctionCentering,
} from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';

export const YUKEN_DSG_CATALOG_NOTE_TR = 'Sürgü sembolü katalogdan doğrulanmalıdır.';

export const YUKEN_DSG_CENTERING_LABEL_TR: Record<HydraulicFunctionCentering, string> = {
  spring_centered: 'Yay merkezlemeli',
  spring_offset: 'Yay ofsetli',
  detented: 'Kilitlemeli / detent',
  unknown: 'Bilinmiyor',
};

export const YUKEN_DSG_CENTER_CONDITION_LABEL_TR: Record<
  HydraulicFunctionCenterCondition,
  string
> = {
  closed_center: 'Kapalı merkez',
  open_center: 'Açık merkez',
  tandem_center: 'Tandem merkez',
  float_center: 'Yüzer merkez',
  partially_open: 'Kısmi açık / katalogdan kontrol edilmeli',
  unknown: 'Bilinmiyor',
};

export type YukenDSGSpoolFunctionCode =
  | '3C2'
  | '3C3'
  | '3C4'
  | '3C40'
  | '3C60'
  | '3C9'
  | '3C12';

export interface YukenDSGSpoolSemantics {
  spoolFunctionCode: string;
  numberOfPositions: 2 | 3;
  centering: HydraulicFunctionCentering;
  centerCondition: HydraulicFunctionCenterCondition;
  requiresCatalogCheck: true;
  behaviorNoteTr: string;
}

const SPOOL_SEMANTICS: Record<string, YukenDSGSpoolSemantics> = {
  '3C2': {
    spoolFunctionCode: '3C2',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, kapalı merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C3': {
    spoolFunctionCode: '3C3',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, açık merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C4': {
    spoolFunctionCode: '3C4',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, tandem merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C40': {
    spoolFunctionCode: '3C40',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'float_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, yüzer merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C60': {
    spoolFunctionCode: '3C60',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, açık merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C9': {
    spoolFunctionCode: '3C9',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu; merkez davranışı katalogdan doğrulanmalı. ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
  '3C12': {
    spoolFunctionCode: '3C12',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, tandem merkez (tahmini). ${YUKEN_DSG_CATALOG_NOTE_TR}`,
  },
};

export function getYukenDSGSpoolSemantics(
  spoolFunctionCode: string
): YukenDSGSpoolSemantics | null {
  const key = spoolFunctionCode.trim().toUpperCase();
  return SPOOL_SEMANTICS[key] ?? null;
}

export function springCodeToCentering(springCode: string): HydraulicFunctionCentering {
  switch (springCode.toUpperCase()) {
    case 'C':
      return 'spring_centered';
    case 'B':
      return 'spring_offset';
    case 'D':
      return 'detented';
    default:
      return 'unknown';
  }
}

export function springCodeToLabelTr(springCode: string): string {
  return YUKEN_DSG_CENTERING_LABEL_TR[springCodeToCentering(springCode)];
}
