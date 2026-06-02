import {
  resolveRexrothSpoolTokenForYukenFunction,
  resolveYukenFunctionTokenForRexrothSpool,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { YUKEN_PREFERRED_FUNCTION_BY_CENTER } from '@/domain/categories/hydraulicValve/hydraulicValveCenterTypeSelection';
import {
  getRexrothWE6SpoolSemantics,
  isRexrothWEOrderingSpoolSymbol,
  isRexrothWE6SoftTransitionOrderingToken,
  rexrothWE6BehaviorLookupToken,
  rexrothWE6OrderingSpoolTokenForEquivalent,
  REXROTH_WE6_SOFT_TRANSITION_NOTE_TR,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import type { YukenDSGSpoolFunctionCode } from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';

export const YUKEN_DSG_DEFAULT_DESIGN_NUMBER = '70';

export const VALID_YUKEN_DSG_SPOOL_CODES: YukenDSGSpoolFunctionCode[] = [
  '3C2',
  '3C3',
  '3C4',
  '3C40',
  '3C60',
  '3C9',
  '3C12',
];

/** Confident Rexroth WE base spool → Yuken DSG function token (cross-brand verified). */
export const CONFIDENT_REXROTH_TO_YUKEN_SPOOL: Partial<
  Record<string, YukenDSGSpoolFunctionCode>
> = {
  E: '3C2',
  D: '3C9',
  /** Ofset merkez (P-A / B-T) + yumuşak geçiş sipariş kodu. */
  C46: '3C9',
};

/** Confident Yuken DSG function → Rexroth WE base spool. */
export const CONFIDENT_YUKEN_TO_REXROTH_SPOOL: Partial<Record<YukenDSGSpoolFunctionCode, string>> =
  {
    '3C2': 'E',
    '3C4': 'C',
    /** Ofset merkez karşılığı; muadil Rexroth kodunda C46 kullanılır. */
    '3C9': 'C46',
  };

export const REXROTH_WE6_DEFAULT_DESIGN_SERIES = '62';
export const REXROTH_WE10_DEFAULT_DESIGN_SERIES = '35';

export const UNRESOLVED_SPOOL_MAPPING_NOTE_TR =
  'Rexroth sürgü/fonksiyon sembolünün Yuken karşılığı mevcut katalog verisiyle kesin eşleştirilemedi. Yuken sürgü sembolü katalogdan kontrol edilmelidir.';

export const UNKNOWN_SOURCE_SPOOL_NOTE_TR =
  'Kaynak sürgü sembolü çözümlenemedi; olası Yuken sürgü alternatifleri listelenmiştir.';

export const MISSING_VOLTAGE_NOTE_TR =
  'Gerilim bilgisi kaynak kodda yok; D24 aday kodu kontrol edilmelidir.';

export const CONNECTOR_CHECK_NOTE_TR =
  'Konnektör eşdeğerliği (K4/N1) fiziksel uyumluluk açısından katalogdan doğrulanmalıdır.';

export { REXROTH_WE6_SOFT_TRANSITION_NOTE_TR as REXROTH_SOFT_TRANSITION_NOTE_TR };

export function softTransitionInfoNotesForSpool(
  spoolSymbol: string | null | undefined
): string[] {
  const raw = spoolSymbol?.trim().toUpperCase() ?? '';
  if (
    isRexrothWE6SoftTransitionOrderingToken(raw) ||
    rexrothWE6OrderingSpoolTokenForEquivalent(raw) === 'C46'
  ) {
    return [REXROTH_WE6_SOFT_TRANSITION_NOTE_TR];
  }
  return [];
}

export function isConfidentRexrothSpoolMapping(spoolSymbol: string | null): boolean {
  if (!spoolSymbol) {
    return false;
  }

  if (isRexrothWE6SoftTransitionOrderingToken(spoolSymbol)) {
    return Boolean(resolveConfidentYukenSpoolCode(spoolSymbol));
  }

  const base = rexrothWE6BehaviorLookupToken(spoolSymbol) ?? spoolSymbol;
  if (!isRexrothWEOrderingSpoolSymbol(base)) {
    return false;
  }

  if (resolveConfidentYukenSpoolCode(spoolSymbol)) {
    return true;
  }

  return false;
}

function isRexrothOfsetSoftTransitionSpool(spoolSymbol: string): boolean {
  const normalized = spoolSymbol.trim().toUpperCase();
  return (
    isRexrothWE6SoftTransitionOrderingToken(normalized) ||
    rexrothWE6OrderingSpoolTokenForEquivalent(normalized) === 'C46'
  );
}

export function resolveConfidentYukenSpoolCode(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const normalized = spoolSymbol.trim().toUpperCase();

  const fromCatalogExact = resolveYukenFunctionTokenForRexrothSpool(normalized);
  if (
    fromCatalogExact &&
    VALID_YUKEN_DSG_SPOOL_CODES.includes(fromCatalogExact as YukenDSGSpoolFunctionCode)
  ) {
    return fromCatalogExact;
  }

  if (isRexrothOfsetSoftTransitionSpool(normalized)) {
    return CONFIDENT_REXROTH_TO_YUKEN_SPOOL.C46 ?? null;
  }

  const base = rexrothWE6BehaviorLookupToken(normalized) ?? normalized;
  const fromTable = CONFIDENT_REXROTH_TO_YUKEN_SPOOL[base];
  if (fromTable) {
    return fromTable;
  }

  const fromCatalog = resolveYukenFunctionTokenForRexrothSpool(base);
  if (fromCatalog && VALID_YUKEN_DSG_SPOOL_CODES.includes(fromCatalog as YukenDSGSpoolFunctionCode)) {
    return fromCatalog;
  }

  if (base !== 'C' && !isRexrothWE6SoftTransitionOrderingToken(normalized)) {
    const semantics = getRexrothWE6SpoolSemantics(base);
    const fromSemantics =
      semantics.centerCondition !== 'unknown'
        ? YUKEN_PREFERRED_FUNCTION_BY_CENTER[semantics.centerCondition]
        : undefined;
    if (fromSemantics) {
      return fromSemantics;
    }
  }

  return null;
}

export function resolveConfidentRexrothSpoolCode(
  yukenFunctionCode: string | null
): string | null {
  if (!yukenFunctionCode) {
    return null;
  }

  const key = yukenFunctionCode.trim().toUpperCase() as YukenDSGSpoolFunctionCode;
  const fromTable = CONFIDENT_YUKEN_TO_REXROTH_SPOOL[key];
  if (fromTable) {
    return rexrothWE6OrderingSpoolTokenForEquivalent(fromTable) ?? fromTable;
  }

  const fromCatalog = resolveRexrothSpoolTokenForYukenFunction(key);
  if (fromCatalog) {
    return rexrothWE6OrderingSpoolTokenForEquivalent(fromCatalog) ?? fromCatalog;
  }

  return null;
}
