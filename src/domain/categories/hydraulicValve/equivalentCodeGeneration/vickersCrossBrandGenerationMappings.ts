import type { HydraulicEquivalentTokens } from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import { resolveVickersFunctionTokenForRexrothSpool } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  resolveTargetSpoolTokenByPortState,
  type SpoolBrand,
} from '@/domain/categories/hydraulicValve/resolveSpoolTokenByPortState';
import { parseVickersDG4VSpoolFunctionCode } from '@/domain/categories/hydraulicValve/manufacturers/vickers/vickersDG4VSemantics';

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

function primaryVickersSourceToken(tokens: HydraulicEquivalentTokens): string | null {
  if (tokens.functionCode?.trim()) {
    return tokens.functionCode.trim().toUpperCase();
  }
  const spoolType = resolveVickersSpoolType(tokens);
  return spoolType;
}

function resolveTargetFromVickers(
  tokens: HydraulicEquivalentTokens,
  targetBrand: SpoolBrand
): string | null {
  const sourceToken = primaryVickersSourceToken(tokens);
  if (!sourceToken) {
    return null;
  }
  return resolveTargetSpoolTokenByPortState('vickers', sourceToken, targetBrand);
}

export function resolveRexrothSpoolFromVickers(tokens: HydraulicEquivalentTokens): string | null {
  return resolveTargetFromVickers(tokens, 'rexroth');
}

export function resolveYukenSpoolFromVickers(tokens: HydraulicEquivalentTokens): string | null {
  return resolveTargetFromVickers(tokens, 'yuken');
}

export function resolveVickersFunctionFromRexroth(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }

  const base = spoolSymbol.trim().toUpperCase();
  const fromPortState = resolveTargetSpoolTokenByPortState('rexroth', base, 'vickers');
  if (fromPortState) {
    return fromPortState;
  }

  return resolveVickersFunctionTokenForRexrothSpool(base);
}

export function resolveVickersFunctionFromYuken(functionCode: string | null): string | null {
  if (!functionCode) {
    return null;
  }

  return resolveTargetSpoolTokenByPortState(
    'yuken',
    functionCode.trim().toUpperCase(),
    'vickers'
  );
}

/** @deprecated Use resolveRexrothSpoolFromVickers */
export const resolveConfidentRexrothSpoolFromVickers = resolveRexrothSpoolFromVickers;

/** @deprecated Use resolveYukenSpoolFromVickers */
export const resolveConfidentYukenSpoolFromVickers = resolveYukenSpoolFromVickers;

/** @deprecated Use resolveVickersFunctionFromRexroth */
export const resolveConfidentVickersFunctionFromRexroth = resolveVickersFunctionFromRexroth;

/** @deprecated Use resolveVickersFunctionFromYuken */
export const resolveConfidentVickersFunctionFromYuken = resolveVickersFunctionFromYuken;

/** @deprecated Use resolveYukenSpoolCodeFromRexroth from rexrothYukenGenerationMappings */
export function resolveYukenFromRexrothSpool(spoolSymbol: string | null): string | null {
  if (!spoolSymbol) {
    return null;
  }
  return resolveTargetSpoolTokenByPortState(
    'rexroth',
    spoolSymbol.trim().toUpperCase(),
    'yuken'
  );
}
