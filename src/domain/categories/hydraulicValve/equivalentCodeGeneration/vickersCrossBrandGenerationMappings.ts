import type { HydraulicEquivalentTokens } from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import { resolveVickersFunctionTokenForRexrothSpool } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  isVickersDG4VClosedCenterSpoolType,
  parseVickersDG4VSpoolFunctionCode,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/vickersDG4VSemantics';

import {
  CONFIDENT_REXROTH_TO_YUKEN_SPOOL,
  CONFIDENT_YUKEN_TO_REXROTH_SPOOL,
} from './rexrothYukenGenerationMappings';

/** Vickers spool function code → Rexroth WE base spool letter (port-state verified). */
export const VICKERS_FUNCTION_TO_REXROTH_SPOOL: Record<string, string> = {
  '2A': 'E',
  '0A': 'H',
  '4A': 'G',
  '6B': 'J',
  '24A': 'D',
  '24C': 'C46',
};

/** Catalog-backed closed-center spool types → Rexroth E. */
export const VICKERS_SPOOL_TYPE_TO_REXROTH_SPOOL: Record<string, string> = {
  '2': 'E',
  '22': 'E',
  '35': 'E',
};

/** Vickers spool function code → Yuken DSG function token. */
export const VICKERS_FUNCTION_TO_YUKEN_SPOOL: Record<string, string> = {
  '2A': '3C2',
  '0A': '3C3',
  '4A': '3C60',
  '6B': '3C40',
  '24A': '3C9',
};

/** Catalog-backed closed-center spool types → Yuken 3C2. */
export const VICKERS_SPOOL_TYPE_TO_YUKEN_SPOOL: Record<string, string> = {
  '2': '3C2',
  '22': '3C2',
  '35': '3C2',
};

/** Rexroth WE base spool → Vickers spool function code (fallback when port-state ingest misses). */
export const REXROTH_SPOOL_TO_VICKERS_FUNCTION: Record<string, string> = {
  E: '2A',
  G: '4A',
  H: '0A',
  J: '6B',
  D: '24A',
  C46: '24A',
};

export const VICKERS_UNRESOLVED_SPOOL_NOTE_TR =
  'Vickers sürgü tipinin hedef marka karşılığı mevcut katalog verisiyle kesin eşleştirilemedi. Hedef sürgü sembolü katalogdan kontrol edilmelidir.';

export function resolveVickersSpoolType(tokens: HydraulicEquivalentTokens): string | null {
  if (tokens.spoolSymbol && /^\d{1,3}$/.test(tokens.spoolSymbol.trim())) {
    return tokens.spoolSymbol.trim();
  }

  if (tokens.functionCode) {
    const parsed = parseVickersDG4VSpoolFunctionCode(tokens.functionCode);
    return parsed?.spoolType ?? null;
  }

  return null;
}

export function isConfidentVickersSpoolType(spoolType: string | null): boolean {
  return spoolType !== null && isVickersDG4VClosedCenterSpoolType(spoolType);
}

export function resolveConfidentRexrothSpoolFromVickers(
  tokens: HydraulicEquivalentTokens
): string | null {
  const functionCode = tokens.functionCode?.trim().toUpperCase();
  if (functionCode && VICKERS_FUNCTION_TO_REXROTH_SPOOL[functionCode]) {
    return VICKERS_FUNCTION_TO_REXROTH_SPOOL[functionCode];
  }

  const spoolType = resolveVickersSpoolType(tokens);
  if (spoolType && isConfidentVickersSpoolType(spoolType)) {
    return VICKERS_SPOOL_TYPE_TO_REXROTH_SPOOL[spoolType] ?? null;
  }

  return null;
}

export function resolveConfidentYukenSpoolFromVickers(
  tokens: HydraulicEquivalentTokens
): string | null {
  const functionCode = tokens.functionCode?.trim().toUpperCase();
  if (functionCode && VICKERS_FUNCTION_TO_YUKEN_SPOOL[functionCode]) {
    return VICKERS_FUNCTION_TO_YUKEN_SPOOL[functionCode];
  }

  const spoolType = resolveVickersSpoolType(tokens);
  if (spoolType && isConfidentVickersSpoolType(spoolType)) {
    return VICKERS_SPOOL_TYPE_TO_YUKEN_SPOOL[spoolType] ?? null;
  }

  return null;
}

export function resolveConfidentVickersFunctionFromRexroth(
  spoolSymbol: string | null
): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const base = spoolSymbol.trim().toUpperCase();
  const fromCatalog = resolveVickersFunctionTokenForRexrothSpool(base);
  if (fromCatalog) {
    return fromCatalog;
  }

  return REXROTH_SPOOL_TO_VICKERS_FUNCTION[base] ?? null;
}

export function resolveConfidentVickersFunctionFromYuken(
  functionCode: string | null
): string | null {
  if (!functionCode) {
    return null;
  }

  const rexrothSpool =
    CONFIDENT_YUKEN_TO_REXROTH_SPOOL[
      functionCode.trim().toUpperCase() as keyof typeof CONFIDENT_YUKEN_TO_REXROTH_SPOOL
    ];
  if (!rexrothSpool) {
    return null;
  }

  return REXROTH_SPOOL_TO_VICKERS_FUNCTION[rexrothSpool] ?? null;
}

export function mapVickersCoilToYuken(coilRating: string | null): string | null {
  if (!coilRating) {
    return null;
  }

  const upper = coilRating.toUpperCase();
  if (upper === 'H' || upper === 'D24') {
    return 'D24';
  }
  if (upper === 'D12') {
    return 'D12';
  }
  if (upper === 'D48') {
    return 'D48';
  }
  if (upper === 'G24' || upper === 'EG24' || upper === 'CG24' || upper === 'HG24') {
    return 'D24';
  }
  if (/^D\d+$/.test(upper)) {
    return upper;
  }

  return null;
}

export function mapVickersCoilToRexroth(coilRating: string | null): string | null {
  if (!coilRating) {
    return null;
  }

  const upper = coilRating.toUpperCase();
  if (upper === 'H' || upper.includes('D24')) {
    return 'EG24';
  }
  if (upper.includes('D12') || upper.includes('G12')) {
    return 'G12';
  }
  if (upper.includes('CG24')) {
    return 'CG24';
  }
  if (upper.includes('G24')) {
    return 'G24';
  }
  if (/^D\d+$/.test(upper)) {
    return 'EG24';
  }

  return null;
}

export function mapVickersConnectorToYuken(connector: string | null): string {
  if (!connector || connector === 'U') {
    return 'N1';
  }
  if (connector === 'K4' || connector === 'N9' || connector === 'N') {
    return 'N1';
  }
  return connector;
}

export function mapVickersConnectorToRexroth(connector: string | null): string {
  if (!connector || connector === 'U') {
    return 'K4';
  }
  if (connector === 'N1' || connector === 'N') {
    return 'K4';
  }
  return connector;
}

export function resolveYukenFromRexrothSpool(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const base = spoolSymbol.trim().toUpperCase();
  return CONFIDENT_REXROTH_TO_YUKEN_SPOOL[base] ?? null;
}
