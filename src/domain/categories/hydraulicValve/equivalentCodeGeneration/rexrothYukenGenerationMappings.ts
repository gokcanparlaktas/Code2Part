import {
  getRexrothWE6SpoolSemantics,
  isRexrothWE6BaseSpoolSymbol,
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

export const REXROTH_WE6_DEFAULT_DESIGN_SERIES = '6X';
export const REXROTH_WE10_DEFAULT_DESIGN_SERIES = '3X';

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
  if (!isRexrothWE6BaseSpoolSymbol(base)) {
    return false;
  }

  if (!(base in CONFIDENT_REXROTH_TO_YUKEN_SPOOL)) {
    return false;
  }

  const semantics = getRexrothWE6SpoolSemantics(base);
  return (
    semantics.centerCondition === 'closed_center' ||
    semantics.centerCondition === 'tandem_center'
  );
}

export function resolveConfidentYukenSpoolCode(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const base = rexrothWE6BehaviorLookupToken(spoolSymbol) ?? spoolSymbol;
  return CONFIDENT_REXROTH_TO_YUKEN_SPOOL[base] ?? null;
}

export function resolveConfidentRexrothSpoolCode(
  yukenFunctionCode: string | null
): string | null {
  if (!yukenFunctionCode) {
    return null;
  }

  const key = yukenFunctionCode.trim().toUpperCase() as YukenDSGSpoolFunctionCode;
  return CONFIDENT_YUKEN_TO_REXROTH_SPOOL[key] ?? null;
}
