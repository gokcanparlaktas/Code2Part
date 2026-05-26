/**
 * Practical Vickers / Eaton DG4V spool code tags (catalog hints only).
 */

import type {
  HydraulicFunctionCenterCondition,
  HydraulicFunctionCentering,
} from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';

export const VICKERS_DG4V_CATALOG_NOTE_TR =
  'Sürgü sembolü katalogdan doğrulanmalıdır.';

export const VICKERS_DG4V_VOLTAGE_NOTE_TR =
  'Bobin/voltaj kodu katalogdan doğrulanmalıdır.';

export const VICKERS_DG4V_CENTERING_LABEL_TR: Record<HydraulicFunctionCentering, string> = {
  spring_centered: 'Yay merkezlemeli',
  spring_offset: 'Yay ofsetli',
  detented: 'Kilitlemeli / detent',
  unknown: 'Bilinmiyor',
};

export const VICKERS_DG4V_CENTER_CONDITION_LABEL_TR: Record<
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

export type VickersDG4VSpoolFunctionCode = '2A' | '4C' | '6C' | '6B';

export interface VickersDG4VSpoolSemantics {
  spoolFunctionCode: string;
  spoolType: string;
  springCode: string;
  numberOfPositions: 2 | 3;
  centering: HydraulicFunctionCentering;
  centerCondition: HydraulicFunctionCenterCondition;
  requiresCatalogCheck: true;
  behaviorNoteTr: string;
}

const SPOOL_SEMANTICS: Record<string, VickersDG4VSpoolSemantics> = {
  '2A': {
    spoolFunctionCode: '2A',
    spoolType: '2',
    springCode: 'A',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 2, yay A (yay merkezlemeli tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '4C': {
    spoolFunctionCode: '4C',
    spoolType: '4',
    springCode: 'C',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 4, yay C (üreticiye özgü merkezleme olabilir). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '6C': {
    spoolFunctionCode: '6C',
    spoolType: '6',
    springCode: 'C',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 6, yay C (üreticiye özgü merkezleme olabilir). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '6B': {
    spoolFunctionCode: '6B',
    spoolType: '6',
    springCode: 'B',
    numberOfPositions: 3,
    centering: 'spring_offset',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 6, yay B (yay ofsetli tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
};

export function springCodeToCentering(springCode: string): HydraulicFunctionCentering {
  switch (springCode.toUpperCase()) {
    case 'A':
      return 'spring_centered';
    case 'B':
      return 'spring_offset';
    case 'C':
      return 'spring_centered';
    case 'D':
      return 'detented';
    default:
      return 'unknown';
  }
}

export function springCodeToLabelTr(springCode: string): string {
  return VICKERS_DG4V_CENTERING_LABEL_TR[springCodeToCentering(springCode)];
}

export function getVickersDG4VSpoolSemantics(
  spoolFunctionCode: string
): VickersDG4VSpoolSemantics | null {
  return SPOOL_SEMANTICS[spoolFunctionCode.trim().toUpperCase()] ?? null;
}
