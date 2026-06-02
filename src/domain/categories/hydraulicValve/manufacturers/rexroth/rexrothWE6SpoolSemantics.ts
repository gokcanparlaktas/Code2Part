/**
 * Practical Rexroth WE6 spool symbol tags (RE 23164).
 * Compatibility hints only — not full hydraulic simulation.
 */

import type {
  HydraulicFunctionCenterCondition,
  HydraulicFunctionCentering,
  HydraulicFunctionNormallyState,
} from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';

export type RexrothWE6BaseSpoolSymbol = 'A' | 'B' | 'C' | 'D' | 'E' | 'G' | 'H' | 'J' | 'Y';

export type RexrothWE6SwitchingPositionVariant = 'a' | 'b';

export interface RexrothWE6SpoolSemantics {
  /** Ordering-code spool letter (core A–Y or extended catalog letters such as F, P, L). */
  baseSpoolSymbol: string;
  numberOfPositions: 2 | 3;
  centering: HydraulicFunctionCentering;
  centerCondition: HydraulicFunctionCenterCondition;
  normallyState: HydraulicFunctionNormallyState;
  requiresCatalogCheck: true;
  behaviorNoteTr: string;
}

export const REXROTH_WE6_CENTERING_LABEL_TR: Record<HydraulicFunctionCentering, string> = {
  spring_centered: 'Yay merkezlemeli',
  spring_offset: 'Yay ofsetli',
  detented: 'Kilitlemeli',
  unknown: 'Bilinmiyor',
};

export const REXROTH_WE6_CENTER_CONDITION_LABEL_TR: Record<
  HydraulicFunctionCenterCondition,
  string
> = {
  closed_center: 'Kapalı merkez',
  open_center: 'Açık merkez',
  tandem_center: 'Tandem merkez',
  float_center: 'Yüzer merkez',
  partially_open: 'Kısmen açık merkez',
  unknown: 'Bilinmiyor',
};

export const REXROTH_WE6_NORMALLY_STATE_LABEL_TR: Record<
  HydraulicFunctionNormallyState,
  string
> = {
  normally_open: 'Normalde açık',
  normally_closed: 'Normalde kapalı',
  unknown: 'Bilinmiyor',
};

import { REXROTH_WE6_EXTENDED_SPOOL_SEMANTICS } from './rexrothWE6CatalogSpoolSymbols';

const CATALOG_HINT = 'RE 23164 sembol tablosu; kesin hidrolik davranış katalogdan doğrulanmalıdır.';

const BASE_SPOOL_SEMANTICS: Record<RexrothWE6BaseSpoolSymbol, RexrothWE6SpoolSemantics> = {
  A: {
    baseSpoolSymbol: 'A',
    numberOfPositions: 2,
    centering: 'spring_offset',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `2 konumlu, yay ofsetli. Normalde kapalı olabilir; ${CATALOG_HINT}`,
  },
  B: {
    baseSpoolSymbol: 'B',
    numberOfPositions: 2,
    centering: 'spring_offset',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `2 konumlu, yay ofsetli. ${CATALOG_HINT}`,
  },
  C: {
    baseSpoolSymbol: 'C',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, kapalı merkez (tahmini). ${CATALOG_HINT}`,
  },
  D: {
    baseSpoolSymbol: 'D',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu; merkezde P-A ve B-T bağlı (ofset). ${CATALOG_HINT}`,
  },
  E: {
    baseSpoolSymbol: 'E',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, yay merkezlemeli, kapalı merkez (tahmini). ${CATALOG_HINT}`,
  },
  G: {
    baseSpoolSymbol: 'G',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu; merkezde P-T bağlı, A ve B kapalı (açık merkez). ${CATALOG_HINT}`,
  },
  H: {
    baseSpoolSymbol: 'H',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu, tandem merkez veya kısmi açık olabilir. ${CATALOG_HINT}`,
  },
  J: {
    baseSpoolSymbol: 'J',
    numberOfPositions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `3 konumlu; merkezde A-B-T bağlı, P kapalı. ${CATALOG_HINT}`,
  },
  Y: {
    baseSpoolSymbol: 'Y',
    numberOfPositions: 2,
    centering: 'spring_offset',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    requiresCatalogCheck: true,
    behaviorNoteTr: `2 konumlu, yay ofsetli. ${CATALOG_HINT}`,
  },
};

export const REXROTH_WE6_DETENT_NOTE_TR =
  'Yay dönüşü yok, kilitlemeli/detent yapı. Katalogda yalnızca D sembolü için belirtilmiştir.';

export const REXROTH_WE6_INVALID_OF_WARNING_TR =
  'OF seçeneği katalogda yalnızca D sembolü için belirtilmiştir.';

export function isRexrothWE6BaseSpoolSymbol(value: string): value is RexrothWE6BaseSpoolSymbol {
  return value in BASE_SPOOL_SEMANTICS;
}

export function isRexrothWEOrderingSpoolSymbol(value: string): boolean {
  const upper = value.trim().toUpperCase();
  if (upper.length !== 1) {
    return false;
  }
  return isRexrothWE6BaseSpoolSymbol(upper) || upper in REXROTH_WE6_EXTENDED_SPOOL_SEMANTICS;
}

export function getRexrothWE6SpoolSemantics(
  baseSymbol: RexrothWE6BaseSpoolSymbol | string,
  options?: { detentOption?: boolean }
): RexrothWE6SpoolSemantics {
  const upper = String(baseSymbol).trim().toUpperCase();
  const base = isRexrothWE6BaseSpoolSymbol(upper)
    ? BASE_SPOOL_SEMANTICS[upper]
    : REXROTH_WE6_EXTENDED_SPOOL_SEMANTICS[upper];

  if (!base) {
    return {
      baseSpoolSymbol: upper,
      numberOfPositions: 3,
      centering: 'unknown',
      centerCondition: 'unknown',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: CATALOG_HINT,
    };
  }

  if (!options?.detentOption) {
    return base;
  }
  return {
    ...base,
    centering: 'detented',
    behaviorNoteTr: REXROTH_WE6_DETENT_NOTE_TR,
  };
}

export function formatSwitchingVariantNoteTr(
  baseSymbol: RexrothWE6BaseSpoolSymbol,
  variant: RexrothWE6SwitchingPositionVariant
): string {
  return `${baseSymbol} sembolünün ${variant} pozisyonlu varyantı (sipariş kodu ${baseSymbol}${variant.toUpperCase()}).`;
}

export interface RexrothWE6FunctionTokenParts {
  baseSpoolSymbol: RexrothWE6BaseSpoolSymbol;
  functionToken: string;
  switchingPositionVariant: RexrothWE6SwitchingPositionVariant | null;
}

/** Maps ordering-code function token (E, EA, EB, …) to base symbol + variant. */
export function parseRexrothWE6FunctionTokenParts(
  functionToken: string
): RexrothWE6FunctionTokenParts | null {
  const upper = functionToken.trim().toUpperCase();
  if (upper.length === 2 && upper[0] === 'E' && upper[1] === 'A') {
    return {
      baseSpoolSymbol: 'E',
      functionToken: 'EA',
      switchingPositionVariant: 'a',
    };
  }
  if (upper.length === 2 && upper[0] === 'E' && upper[1] === 'B') {
    return {
      baseSpoolSymbol: 'E',
      functionToken: 'EB',
      switchingPositionVariant: 'b',
    };
  }
  if (upper.length === 1 && isRexrothWEOrderingSpoolSymbol(upper)) {
    return {
      baseSpoolSymbol: upper,
      functionToken: upper,
      switchingPositionVariant: null,
    };
  }
  return null;
}

/** Behavior lookup token: base spool letter (EA/EB → E). */
export function rexrothWE6BehaviorLookupToken(functionToken: string): string | null {
  const parts = parseRexrothWE6FunctionTokenParts(functionToken);
  return parts?.baseSpoolSymbol ?? null;
}
