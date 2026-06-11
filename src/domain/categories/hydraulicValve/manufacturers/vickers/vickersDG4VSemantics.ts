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
  partially_open: 'Kapalı merkez',
  unknown: 'Bilinmiyor',
};

export type VickersDG4VSpoolFunctionCode = string;

/** Catalog-backed closed-center spool types (same main portState as Rexroth WE E). */
export const VICKERS_DG4V_CLOSED_CENTER_SPOOL_TYPES = new Set(['2', '22', '35']);

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
  '0A': {
    spoolFunctionCode: '0A',
    spoolType: '0',
    springCode: 'A',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 0, yay A, açık merkez (tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '4A': {
    spoolFunctionCode: '4A',
    spoolType: '4',
    springCode: 'A',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 4, yay A, tandem / tahliye merkez (tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '24A': {
    spoolFunctionCode: '24A',
    spoolType: '24',
    springCode: 'A',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 24, yay A, ofset merkez (tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  },
  '2A': {
    spoolFunctionCode: '2A',
    spoolType: '2',
    springCode: 'A',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi 2, yay A, kapalı merkez (tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
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

export function parseVickersDG4VSpoolFunctionCode(
  spoolFunctionCode: string
): { spoolType: string; springCode: string } | null {
  const match = spoolFunctionCode.trim().toUpperCase().match(/^(\d{1,3})([ABCD])$/);
  if (!match) {
    return null;
  }
  return { spoolType: match[1], springCode: match[2] };
}

export function isVickersDG4VClosedCenterSpoolType(spoolType: string): boolean {
  return VICKERS_DG4V_CLOSED_CENTER_SPOOL_TYPES.has(spoolType.trim());
}

export function getVickersDG4VSpoolSemantics(
  spoolFunctionCode: string
): VickersDG4VSpoolSemantics | null {
  const key = spoolFunctionCode.trim().toUpperCase();
  const staticEntry = SPOOL_SEMANTICS[key];
  if (staticEntry) {
    return staticEntry;
  }

  const parsed = parseVickersDG4VSpoolFunctionCode(key);
  if (!parsed || !isVickersDG4VClosedCenterSpoolType(parsed.spoolType)) {
    return null;
  }

  return {
    spoolFunctionCode: key,
    spoolType: parsed.spoolType,
    springCode: parsed.springCode,
    numberOfPositions: 3,
    centering: springCodeToCentering(parsed.springCode),
    centerCondition: 'closed_center',
    requiresCatalogCheck: true,
    behaviorNoteTr: `Sürgü tipi ${parsed.spoolType}, yay ${parsed.springCode}, kapalı merkez (tahmini). ${VICKERS_DG4V_CATALOG_NOTE_TR}`,
  };
}
