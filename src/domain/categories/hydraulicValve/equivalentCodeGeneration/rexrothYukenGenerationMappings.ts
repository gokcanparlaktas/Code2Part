import {
  resolveRexrothSpoolTokenForYukenFunction,
  resolveYukenFunctionTokenForRexrothSpool,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { YUKEN_PREFERRED_FUNCTION_BY_CENTER } from '@/domain/categories/hydraulicValve/hydraulicValveCenterTypeSelection';
import {
  getRexrothWE6SpoolSemantics,
  isRexrothWEOrderingSpoolSymbol,
  rexrothWE6BehaviorLookupToken,
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
  C: '3C4',
  D: '3C9',
};

/** Confident Yuken DSG function → Rexroth WE base spool. */
export const CONFIDENT_YUKEN_TO_REXROTH_SPOOL: Partial<Record<YukenDSGSpoolFunctionCode, string>> =
  {
    '3C2': 'E',
    '3C4': 'C',
    '3C9': 'D',
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

export function isConfidentRexrothSpoolMapping(spoolSymbol: string | null): boolean {
  if (!spoolSymbol) {
    return false;
  }

  const base = rexrothWE6BehaviorLookupToken(spoolSymbol) ?? spoolSymbol;
  if (!isRexrothWEOrderingSpoolSymbol(base)) {
    return false;
  }

  if (resolveConfidentYukenSpoolCode(base)) {
    return true;
  }

  return false;
}

export function resolveConfidentYukenSpoolCode(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const base = rexrothWE6BehaviorLookupToken(spoolSymbol) ?? spoolSymbol;
  const fromTable = CONFIDENT_REXROTH_TO_YUKEN_SPOOL[base];
  if (fromTable) {
    return fromTable;
  }

  const fromCatalog = resolveYukenFunctionTokenForRexrothSpool(base);
  if (fromCatalog && VALID_YUKEN_DSG_SPOOL_CODES.includes(fromCatalog as YukenDSGSpoolFunctionCode)) {
    return fromCatalog;
  }

  const semantics = getRexrothWE6SpoolSemantics(base);
  const fromSemantics =
    semantics.centerCondition !== 'unknown'
      ? YUKEN_PREFERRED_FUNCTION_BY_CENTER[semantics.centerCondition]
      : undefined;
  if (fromSemantics) {
    return fromSemantics;
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
    return fromTable;
  }

  return resolveRexrothSpoolTokenForYukenFunction(key);
}
