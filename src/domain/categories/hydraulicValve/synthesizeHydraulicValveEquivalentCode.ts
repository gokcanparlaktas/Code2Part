import { generateBestHydraulicValveEquivalentCode } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/hydraulicValveEquivalentCodeGenerator';
import {
  mapVickersCoilToRexroth,
  mapVickersCoilToYuken,
  mapVickersConnectorToRexroth,
  mapVickersConnectorToYuken,
  resolveConfidentRexrothSpoolFromVickers,
  resolveConfidentYukenSpoolFromVickers,
  REXROTH_SPOOL_TO_VICKERS_FUNCTION,
} from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/vickersCrossBrandGenerationMappings';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { ProductIdentification, ProductSeriesRecord } from '@/types/product';

import {
  extractHydraulicEquivalentTokens,
  type HydraulicEquivalentTokens,
} from './extractHydraulicEquivalentTokens';

const REXROTH_SPOOL_TO_YUKEN_FUNCTION: Record<string, string> = {
  E: '3C2',
  C: '3C4',
  J: '3C60',
  D: '3C9',
};

function isYukenFunctionToken(token: string | null): boolean {
  return Boolean(token && /^\d[CBD]\d{1,2}$/i.test(token));
}

function resolveYukenFunctionCode(tokens: HydraulicEquivalentTokens): string {
  if (isYukenFunctionToken(tokens.functionCode)) {
    return tokens.functionCode!.toUpperCase();
  }

  const fromVickers = resolveConfidentYukenSpoolFromVickers(tokens);
  if (fromVickers) {
    return fromVickers;
  }

  if (tokens.spoolSymbol && REXROTH_SPOOL_TO_YUKEN_FUNCTION[tokens.spoolSymbol]) {
    return REXROTH_SPOOL_TO_YUKEN_FUNCTION[tokens.spoolSymbol];
  }

  return '3C2';
}

function resolveVickersSpoolCode(tokens: HydraulicEquivalentTokens): string {
  if (tokens.functionCode && /^[0-9][A-Z]$/i.test(tokens.functionCode)) {
    return tokens.functionCode.toUpperCase();
  }

  if (tokens.spoolSymbol && REXROTH_SPOOL_TO_VICKERS_FUNCTION[tokens.spoolSymbol]) {
    return REXROTH_SPOOL_TO_VICKERS_FUNCTION[tokens.spoolSymbol];
  }

  return '2A';
}

function resolveRexrothSpoolSymbol(tokens: HydraulicEquivalentTokens): string {
  const fromVickers = resolveConfidentRexrothSpoolFromVickers(tokens);
  if (fromVickers) {
    return fromVickers;
  }

  if (tokens.spoolSymbol && /^[A-Z]$/.test(tokens.spoolSymbol)) {
    return tokens.spoolSymbol;
  }

  return 'E';
}

function mapCoilToYukenDsg(coilRating: string | null): string | null {
  return mapVickersCoilToYuken(coilRating);
}

function mapConnectorToYuken(connector: string | null): string | null {
  if (!connector) {
    return null;
  }
  return mapVickersConnectorToYuken(connector);
}

function buildRexrothCoilSection(tokens: HydraulicEquivalentTokens): string {
  let coil = mapVickersCoilToRexroth(tokens.coilRating) ?? tokens.coilRating ?? 'EG24';
  if (coil === 'G24') {
    coil = 'EG24';
  }

  const manual = tokens.manualOverride ?? (/(?:EG24|CG24|HG24|G24)/i.test(coil) ? 'N9' : '');
  const connector = mapVickersConnectorToRexroth(tokens.connector);
  return `${coil}${manual}${connector}`;
}

function synthesizeRexrothWeCode(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): string | null {
  const prefix = targetSeries.codePrefix.replace(/-/g, '');
  const spool = resolveRexrothSpoolSymbol(tokens);
  const design = tokens.designSeries ?? tokens.designSeriesFamily ?? '6X';
  return `${prefix}${spool}-${design}/${buildRexrothCoilSection(tokens)}`;
}

function synthesizeYukenDsgCode(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): string | null {
  const size = targetSeries.id === 'yuken_dsg03' ? '03' : '01';
  const fn = resolveYukenFunctionCode(tokens);
  const coil = mapCoilToYukenDsg(tokens.coilRating) ?? 'D24';
  const connector = mapConnectorToYuken(tokens.connector) ?? 'N1';
  return `DSG-${size}-${fn}-${coil}-${connector}-70`;
}

function synthesizeVickersDg4vCode(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): string | null {
  const size = targetSeries.id === 'vickers_dg4v5' ? '5' : '3';
  const spool = resolveVickersSpoolCode(tokens);
  return `DG4V-${size}-${spool}-M-U-H7-60`;
}

function synthesizeAtosCode(targetSeries: ProductSeriesRecord): string | null {
  if (targetSeries.id === 'atos_dhu') {
    return 'DHU-0711-X 24DC';
  }
  return 'DHI-0711-X 24DC';
}

function synthesizeParkerCode(targetSeries: ProductSeriesRecord): string | null {
  if (targetSeries.id === 'parker_d3w') {
    return 'D3W001CNJW';
  }
  return 'D1VW001CNJW';
}

function synthesizeForTargetSeries(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): string | null {
  switch (targetSeries.id) {
    case 'rexroth_4we6':
    case 'rexroth_4we10':
      return synthesizeRexrothWeCode(targetSeries, tokens);
    case 'yuken_dsg01':
    case 'yuken_dsg03':
      return synthesizeYukenDsgCode(targetSeries, tokens);
    case 'vickers_dg4v3':
    case 'vickers_dg4v5':
      return synthesizeVickersDg4vCode(targetSeries, tokens);
    case 'atos_dhi':
    case 'atos_dhu':
      return synthesizeAtosCode(targetSeries);
    case 'parker_d1vw':
    case 'parker_d3w':
      return synthesizeParkerCode(targetSeries);
    default:
      return null;
  }
}

function isFullyParsableSuggestedCode(code: string): boolean {
  const identification = identifyProduct(code, normalizeCode(code));
  return identification.outcome === 'full';
}

export function synthesizeHydraulicValveEquivalentCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  const generated = generateBestHydraulicValveEquivalentCode(source, targetSeries);
  if (generated) {
    return generated.generatedCode;
  }

  const tokens = extractHydraulicEquivalentTokens(source);
  const synthesized = synthesizeForTargetSeries(targetSeries, tokens);
  if (!synthesized) {
    return null;
  }

  return isFullyParsableSuggestedCode(synthesized) ? synthesized : null;
}
