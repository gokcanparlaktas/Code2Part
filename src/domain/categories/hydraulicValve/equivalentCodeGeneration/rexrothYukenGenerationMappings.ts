import {
  resolveRexrothSpoolTokenForYukenFunction,
  resolveYukenFunctionTokenForRexrothSpool,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  hasPortStateSpoolMapping,
  resolveTargetSpoolTokenByPortState,
} from '@/domain/categories/hydraulicValve/resolveSpoolTokenByPortState';
import {
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

export function isPortStateRexrothToYukenMapping(spoolSymbol: string | null): boolean {
  if (!spoolSymbol) {
    return false;
  }

  const normalized = spoolSymbol.trim().toUpperCase();
  const lookup = rexrothWE6BehaviorLookupToken(normalized) ?? normalized;
  if (!isRexrothWEOrderingSpoolSymbol(lookup) && !isRexrothWE6SoftTransitionOrderingToken(normalized)) {
    return false;
  }

  return hasPortStateSpoolMapping('rexroth', normalized, 'yuken');
}

/** Rexroth WE spool → Yuken DSG function via shared catalog portState. */
export function resolveYukenSpoolCodeFromRexroth(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const normalized = spoolSymbol.trim().toUpperCase();
  const fromPortState = resolveTargetSpoolTokenByPortState('rexroth', normalized, 'yuken');
  if (
    fromPortState &&
    VALID_YUKEN_DSG_SPOOL_CODES.includes(fromPortState as YukenDSGSpoolFunctionCode)
  ) {
    return fromPortState;
  }

  const base = rexrothWE6BehaviorLookupToken(normalized) ?? normalized;
  const fromCatalog = resolveYukenFunctionTokenForRexrothSpool(base);
  if (fromCatalog && VALID_YUKEN_DSG_SPOOL_CODES.includes(fromCatalog as YukenDSGSpoolFunctionCode)) {
    return fromCatalog;
  }

  return null;
}

/** Yuken DSG function → Rexroth WE spool via shared catalog portState. */
export function resolveRexrothSpoolCodeFromYuken(yukenFunctionCode: string | null): string | null {
  if (!yukenFunctionCode) {
    return null;
  }

  const key = yukenFunctionCode.trim().toUpperCase();
  const fromPortState = resolveTargetSpoolTokenByPortState('yuken', key, 'rexroth');
  if (fromPortState) {
    return rexrothWE6OrderingSpoolTokenForEquivalent(fromPortState) ?? fromPortState;
  }

  const fromCatalog = resolveRexrothSpoolTokenForYukenFunction(key);
  if (fromCatalog) {
    return rexrothWE6OrderingSpoolTokenForEquivalent(fromCatalog) ?? fromCatalog;
  }

  return null;
}

/** @deprecated Use resolveYukenSpoolCodeFromRexroth */
export const resolveConfidentYukenSpoolCode = resolveYukenSpoolCodeFromRexroth;

/** @deprecated Use resolveRexrothSpoolCodeFromYuken */
export const resolveConfidentRexrothSpoolCode = resolveRexrothSpoolCodeFromYuken;

/** @deprecated Use isPortStateRexrothToYukenMapping */
export const isConfidentRexrothSpoolMapping = isPortStateRexrothToYukenMapping;
