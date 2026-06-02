import { getAllCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  extractHydraulicEquivalentTokens,
  type HydraulicEquivalentTokens,
} from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import {
  isRexrothWEOrderingSpoolSymbol,
  rexrothWE6BehaviorLookupToken,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type {
  CodeGenerationTrace,
  CodeGenerationTraceStep,
  GeneratedEquivalentCandidate,
} from '@/types/equivalentCodeGeneration';
import type { ProductIdentification, ProductSeriesRecord } from '@/types/product';

import {
  CONNECTOR_CHECK_NOTE_TR,
  isConfidentRexrothSpoolMapping,
  MISSING_VOLTAGE_NOTE_TR,
  REXROTH_WE10_DEFAULT_DESIGN_SERIES,
  REXROTH_WE6_DEFAULT_DESIGN_SERIES,
  resolveConfidentRexrothSpoolCode,
  resolveConfidentYukenSpoolCode,
  UNRESOLVED_SPOOL_MAPPING_NOTE_TR,
  UNKNOWN_SOURCE_SPOOL_NOTE_TR,
  VALID_YUKEN_DSG_SPOOL_CODES,
  YUKEN_DSG_DEFAULT_DESIGN_NUMBER,
} from './rexrothYukenGenerationMappings';
import {
  isConfidentVickersSpoolType,
  mapVickersCoilToRexroth,
  mapVickersCoilToYuken,
  mapVickersConnectorToRexroth,
  mapVickersConnectorToYuken,
  resolveConfidentRexrothSpoolFromVickers,
  resolveConfidentVickersFunctionFromRexroth,
  resolveConfidentVickersFunctionFromYuken,
  resolveConfidentYukenSpoolFromVickers,
  resolveVickersSpoolType,
  VICKERS_UNRESOLVED_SPOOL_NOTE_TR,
} from './vickersCrossBrandGenerationMappings';

function isRexrothWeSeries(seriesId: string): boolean {
  return (
    seriesId === 'rexroth_3we6' ||
    seriesId === 'rexroth_4we6' ||
    seriesId === 'rexroth_4we10'
  );
}

function isYukenDsgSeries(seriesId: string): boolean {
  return seriesId === 'yuken_dsg01' || seriesId === 'yuken_dsg03';
}

function isVickersDg4vSeries(seriesId: string): boolean {
  return seriesId === 'vickers_dg4v3' || seriesId === 'vickers_dg4v5';
}

function mapCoilToYukenDsg(coilRating: string | null): string | null {
  return mapVickersCoilToYuken(coilRating) ?? mapGenericCoilToYukenDsg(coilRating);
}

function mapGenericCoilToYukenDsg(coilRating: string | null): string | null {
  if (!coilRating) {
    return null;
  }
  const upper = coilRating.toUpperCase();
  if (upper === 'G24' || upper === 'EG24' || upper === 'CG24' || upper === 'HG24') {
    return 'D24';
  }
  if (/^D\d+$/.test(upper)) {
    return upper;
  }
  return null;
}

function mapCoilToRexroth(coilRating: string | null): string | null {
  return mapVickersCoilToRexroth(coilRating) ?? mapGenericCoilToRexroth(coilRating);
}

function mapGenericCoilToRexroth(coilRating: string | null): string | null {
  if (!coilRating) {
    return null;
  }
  const upper = coilRating.toUpperCase();
  if (upper.includes('D24') || upper.includes('EG24')) {
    return 'EG24';
  }
  if (upper.includes('CG24')) {
    return 'CG24';
  }
  if (upper.includes('G24')) {
    return 'G24';
  }
  if (upper.includes('G12')) {
    return 'G12';
  }
  if (/^D\d+$/.test(upper)) {
    return 'EG24';
  }
  return null;
}

function mapConnectorToYuken(connector: string | null): string {
  return mapVickersConnectorToYuken(connector);
}

function mapConnectorToRexroth(connector: string | null): string {
  return mapVickersConnectorToRexroth(connector);
}

function buildYukenCode(
  targetSeries: ProductSeriesRecord,
  functionCode: string,
  coil: string,
  connector: string,
  designNumber = YUKEN_DSG_DEFAULT_DESIGN_NUMBER
): string {
  const size = targetSeries.id === 'yuken_dsg03' ? '03' : '01';
  return `DSG-${size}-${functionCode}-${coil}-${connector}-${designNumber}`;
}

function resolveRexrothManualOverride(manualOverride: string | null): string {
  if (manualOverride === 'N9' || manualOverride === 'N') {
    return 'N9';
  }
  if (manualOverride === 'default' || manualOverride === 'C') {
    return 'N9';
  }
  // Vickers DG4V electrical option M (manual override) is not a Rexroth ordering token.
  if (manualOverride === 'M') {
    return '';
  }
  if (manualOverride === null || manualOverride === '' || manualOverride === 'none') {
    return '';
  }
  return manualOverride;
}

const REXROTH_WE6_DESIGN_SERIES = new Set(['61', '62', '71', '72']);
const REXROTH_WE10_DESIGN_SERIES = new Set(['31', '35', '51', '52']);

function resolveRexrothDesignSeries(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): string {
  const isWe10 = targetSeries.id === 'rexroth_4we10';
  const validSeries = isWe10 ? REXROTH_WE10_DESIGN_SERIES : REXROTH_WE6_DESIGN_SERIES;
  const defaultSeries = isWe10
    ? REXROTH_WE10_DEFAULT_DESIGN_SERIES
    : REXROTH_WE6_DEFAULT_DESIGN_SERIES;

  if (tokens.designSeries && validSeries.has(tokens.designSeries)) {
    return tokens.designSeries;
  }

  return defaultSeries;
}

function buildRexrothCode(
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens,
  spool: string
): string {
  const prefix = targetSeries.codePrefix.replace(/-/g, '');
  const design = resolveRexrothDesignSeries(targetSeries, tokens);

  const coil = mapCoilToRexroth(tokens.coilRating) ?? 'EG24';
  let manual = resolveRexrothManualOverride(tokens.manualOverride);
  if (!manual && /(?:EG24|CG24|HG24|G24)/i.test(coil)) {
    manual = 'N9';
  }
  const connector = mapConnectorToRexroth(tokens.connector);
  return `${prefix}${spool}-${design}/${coil}${manual}${connector}`;
}

function resolveVickersCoilSegment(coilRating: string | null): {
  segment: string;
  confident: boolean;
} {
  if (!coilRating) {
    return { segment: 'H7', confident: false };
  }

  const upper = coilRating.toUpperCase();
  if (upper === 'H') {
    return { segment: 'H7', confident: true };
  }
  if (upper === 'D24') {
    return { segment: 'D24', confident: true };
  }
  if (upper === 'D12') {
    return { segment: 'D12', confident: true };
  }
  if (upper === 'D48') {
    return { segment: 'D48', confident: true };
  }
  if (upper.includes('D24') || upper === 'EG24' || upper === 'G24' || upper === 'CG24') {
    return { segment: 'H7', confident: true };
  }
  if (upper.includes('D12') || upper.includes('G12')) {
    return { segment: 'D12', confident: true };
  }

  return { segment: 'H7', confident: false };
}

function buildVickersCode(
  targetSeries: ProductSeriesRecord,
  spoolFunctionCode: string,
  coilSegment: string,
  designNumber = '60'
): string {
  const size = targetSeries.id === 'vickers_dg4v5' ? '5' : '3';
  return `DG4V-${size}-${spoolFunctionCode}-M-U-${coilSegment}-${designNumber}`;
}

function buildTrace(steps: CodeGenerationTraceStep[], summaryTr: string): CodeGenerationTrace {
  return { steps, summaryTr };
}

function isParsableFullCode(code: string): boolean {
  return identifyProduct(code, normalizeCode(code)).outcome === 'full';
}

function catalogExampleCodes(): Set<string> {
  return new Set(getAllCatalogExampleCodes().map((code) => normalizeCode(code)));
}

function markExactKnownExample(
  candidate: GeneratedEquivalentCandidate
): GeneratedEquivalentCandidate {
  const normalized = normalizeCode(candidate.generatedCode);
  if (!catalogExampleCodes().has(normalized)) {
    return candidate;
  }

  return {
    ...candidate,
    isExactKnownExample: true,
  };
}

function finalizeCandidate(
  candidate: GeneratedEquivalentCandidate
): GeneratedEquivalentCandidate | null {
  if (!isParsableFullCode(candidate.generatedCode)) {
    return null;
  }
  return markExactKnownExample(candidate);
}

function resolveYukenSpoolAlternatives(tokens: HydraulicEquivalentTokens): {
  functionCodes: string[];
  spoolConfident: boolean;
  checkNotes: string[];
  unresolvedFields: string[];
} {
  const vickersSpoolType = resolveVickersSpoolType(tokens);
  const confidentVickersYuken = resolveConfidentYukenSpoolFromVickers(tokens);
  if (confidentVickersYuken && isConfidentVickersSpoolType(vickersSpoolType)) {
    return {
      functionCodes: [confidentVickersYuken],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  const spool = tokens.spoolSymbol ?? rexrothWE6BehaviorLookupToken(tokens.functionCode ?? '');
  const checkNotes: string[] = [];
  const unresolvedFields: string[] = [];

  if (!spool) {
    return {
      functionCodes: [...VALID_YUKEN_DSG_SPOOL_CODES],
      spoolConfident: false,
      checkNotes: [UNKNOWN_SOURCE_SPOOL_NOTE_TR],
      unresolvedFields: ['spool_symbol'],
    };
  }

  const base = rexrothWE6BehaviorLookupToken(spool) ?? spool;
  if (!isRexrothWEOrderingSpoolSymbol(base)) {
    return {
      functionCodes: [...VALID_YUKEN_DSG_SPOOL_CODES],
      spoolConfident: false,
      checkNotes: [`Kaynak sürgü sembolü ${spool} çözümlenemedi.`, UNKNOWN_SOURCE_SPOOL_NOTE_TR],
      unresolvedFields: ['spool_symbol'],
    };
  }

  if (isConfidentRexrothSpoolMapping(base)) {
    const mapped = resolveConfidentYukenSpoolCode(base);
    if (mapped) {
      return {
        functionCodes: [mapped],
        spoolConfident: true,
        checkNotes: [],
        unresolvedFields: [],
      };
    }
  }

  return {
    functionCodes: [...VALID_YUKEN_DSG_SPOOL_CODES],
    spoolConfident: false,
    checkNotes: [UNRESOLVED_SPOOL_MAPPING_NOTE_TR],
    unresolvedFields: ['spool_symbol'],
  };
}

function resolveRexrothSpoolAlternatives(tokens: HydraulicEquivalentTokens): {
  spoolSymbols: string[];
  spoolConfident: boolean;
  checkNotes: string[];
  unresolvedFields: string[];
} {
  const confidentVickersRexroth = resolveConfidentRexrothSpoolFromVickers(tokens);
  if (
    confidentVickersRexroth &&
    isConfidentVickersSpoolType(resolveVickersSpoolType(tokens))
  ) {
    return {
      spoolSymbols: [confidentVickersRexroth],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  const confident = resolveConfidentRexrothSpoolCode(tokens.functionCode);
  if (confident) {
    return {
      spoolSymbols: [confident],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  if (tokens.functionCode) {
    return {
      spoolSymbols: ['E', 'C', 'D', 'J'],
      spoolConfident: false,
      checkNotes: [
        `Yuken ${tokens.functionCode} fonksiyon kodunun Rexroth karşılığı kesin eşleştirilemedi; olası sürgü alternatifleri listelenmiştir.`,
      ],
      unresolvedFields: ['function_code'],
    };
  }

  return {
    spoolSymbols: ['E', 'C', 'D', 'J'],
    spoolConfident: false,
    checkNotes: [UNKNOWN_SOURCE_SPOOL_NOTE_TR],
    unresolvedFields: ['function_code'],
  };
}

function generateRexrothToYuken(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): GeneratedEquivalentCandidate[] {
  const steps: CodeGenerationTraceStep[] = [];
  const coil = mapCoilToYukenDsg(tokens.coilRating);
  const connector = mapConnectorToYuken(tokens.connector);
  const spoolResolution = resolveYukenSpoolAlternatives(tokens);
  const checkNotes = [...spoolResolution.checkNotes, CONNECTOR_CHECK_NOTE_TR];
  const unresolvedFields = [...spoolResolution.unresolvedFields];
  const mappedFields = ['mounting', 'target_family', 'connector', 'design_number'];

  if (coil) {
    mappedFields.push('voltage');
  } else {
    unresolvedFields.push('coil_rating');
    checkNotes.push(MISSING_VOLTAGE_NOTE_TR);
  }

  const effectiveCoil = coil ?? 'D24';
  const results: GeneratedEquivalentCandidate[] = [];

  for (const functionCode of spoolResolution.functionCodes) {
    const generatedCode = buildYukenCode(targetSeries, functionCode, effectiveCoil, connector);
    const isFull = spoolResolution.spoolConfident && Boolean(coil);

    const candidate: GeneratedEquivalentCandidate = {
      generatedCode,
      manufacturer: targetSeries.brand,
      series: targetSeries.series,
      seriesId: targetSeries.id,
      generationStatus: isFull ? 'generated_full' : 'generated_partial',
      confidence: isFull ? 'high' : 'medium',
      mappedFields,
      unresolvedFields,
      checkNotes,
      requiresCheck: !isFull || checkNotes.length > 0,
      generationTrace: buildTrace(
        [
          ...steps,
          {
            field: 'mounting',
            action: 'map',
            sourceValue: source.seriesId,
            targetValue: targetSeries.id,
          },
          {
            field: 'spool',
            action: isFull ? 'map' : 'alternatives',
            sourceValue: tokens.spoolSymbol ?? tokens.functionCode,
            targetValue: functionCode,
          },
          {
            field: 'voltage',
            action: coil ? 'map' : 'default_check_required',
            sourceValue: tokens.coilRating,
            targetValue: effectiveCoil,
          },
          {
            field: 'design_number',
            action: 'default',
            sourceValue: tokens.designSeries ?? tokens.designSeriesFamily,
            targetValue: YUKEN_DSG_DEFAULT_DESIGN_NUMBER,
          },
        ],
        isFull
          ? 'Tüm zorunlu alanlar eşlendi; hedef sipariş kodu üretildi.'
          : 'Bazı alanlar kesin eşleştirilemedi; alternatif hedef kod adayı üretildi.'
      ),
    };

    const finalized = finalizeCandidate(candidate);
    if (finalized) {
      results.push(finalized);
    }
  }

  return results;
}

function generateYukenToRexroth(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): GeneratedEquivalentCandidate[] {
  const spoolResolution = resolveRexrothSpoolAlternatives(tokens);
  const coil = mapCoilToRexroth(tokens.coilRating);
  const checkNotes = [...spoolResolution.checkNotes, CONNECTOR_CHECK_NOTE_TR];
  const unresolvedFields = [...spoolResolution.unresolvedFields];
  const mappedFields = ['mounting', 'target_family', 'connector'];

  if (coil) {
    mappedFields.push('voltage');
  } else {
    unresolvedFields.push('coil_rating');
    checkNotes.push(MISSING_VOLTAGE_NOTE_TR);
  }

  const results: GeneratedEquivalentCandidate[] = [];

  for (const spool of spoolResolution.spoolSymbols) {
    const generatedCode = buildRexrothCode(targetSeries, tokens, spool);
    const isFull = spoolResolution.spoolConfident && Boolean(coil);

    const candidate: GeneratedEquivalentCandidate = {
      generatedCode,
      manufacturer: targetSeries.brand,
      series: targetSeries.series,
      seriesId: targetSeries.id,
      generationStatus: isFull ? 'generated_full' : 'generated_partial',
      confidence: isFull ? 'high' : 'medium',
      mappedFields,
      unresolvedFields,
      checkNotes,
      requiresCheck: !isFull || checkNotes.length > 0,
      generationTrace: buildTrace(
        [
          {
            field: 'mounting',
            action: 'map',
            sourceValue: source.seriesId,
            targetValue: targetSeries.id,
          },
          {
            field: 'spool',
            action: isFull ? 'map' : 'alternatives',
            sourceValue: tokens.functionCode,
            targetValue: spool,
          },
          {
            field: 'voltage',
            action: coil ? 'map' : 'default_check_required',
            sourceValue: tokens.coilRating,
            targetValue: coil ?? 'EG24',
          },
        ],
        isFull
          ? 'Tüm zorunlu alanlar eşlendi; Rexroth sipariş kodu üretildi.'
          : 'Bazı alanlar kesin eşleştirilemedi; alternatif Rexroth adayı üretildi.'
      ),
    };

    const finalized = finalizeCandidate(candidate);
    if (finalized) {
      results.push(finalized);
    }
  }

  return results;
}

function resolveVickersFunctionAlternatives(tokens: HydraulicEquivalentTokens): {
  functionCodes: string[];
  spoolConfident: boolean;
  checkNotes: string[];
  unresolvedFields: string[];
} {
  const rexrothSpool =
    tokens.spoolSymbol ?? rexrothWE6BehaviorLookupToken(tokens.functionCode ?? '');
  const fromRexroth = resolveConfidentVickersFunctionFromRexroth(rexrothSpool);
  if (fromRexroth && rexrothSpool && isConfidentRexrothSpoolMapping(rexrothSpool)) {
    return {
      functionCodes: [fromRexroth],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  const fromYuken = resolveConfidentVickersFunctionFromYuken(tokens.functionCode);
  if (fromYuken) {
    return {
      functionCodes: [fromYuken],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  const rexrothFromYuken = resolveConfidentRexrothSpoolCode(tokens.functionCode);
  const vickersFromMappedRexroth = resolveConfidentVickersFunctionFromRexroth(rexrothFromYuken);
  if (vickersFromMappedRexroth && rexrothFromYuken) {
    return {
      functionCodes: [vickersFromMappedRexroth],
      spoolConfident: true,
      checkNotes: [],
      unresolvedFields: [],
    };
  }

  return {
    functionCodes: ['2A'],
    spoolConfident: false,
    checkNotes: [VICKERS_UNRESOLVED_SPOOL_NOTE_TR],
    unresolvedFields: ['function_code'],
  };
}

function generateToVickers(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  tokens: HydraulicEquivalentTokens
): GeneratedEquivalentCandidate[] {
  const spoolResolution = resolveVickersFunctionAlternatives(tokens);
  const coilResolution = resolveVickersCoilSegment(tokens.coilRating);
  const checkNotes = [...spoolResolution.checkNotes, CONNECTOR_CHECK_NOTE_TR];
  const unresolvedFields = [...spoolResolution.unresolvedFields];
  const mappedFields = ['mounting', 'target_family', 'connector'];

  if (coilResolution.confident) {
    mappedFields.push('voltage');
  } else {
    unresolvedFields.push('coil_rating');
    checkNotes.push(MISSING_VOLTAGE_NOTE_TR);
  }

  const results: GeneratedEquivalentCandidate[] = [];

  for (const functionCode of spoolResolution.functionCodes) {
    const generatedCode = buildVickersCode(
      targetSeries,
      functionCode,
      coilResolution.segment
    );
    const isFull = spoolResolution.spoolConfident && coilResolution.confident;

    const candidate: GeneratedEquivalentCandidate = {
      generatedCode,
      manufacturer: targetSeries.brand,
      series: targetSeries.series,
      seriesId: targetSeries.id,
      generationStatus: isFull ? 'generated_full' : 'generated_partial',
      confidence: isFull ? 'high' : 'medium',
      mappedFields,
      unresolvedFields,
      checkNotes,
      requiresCheck: !isFull || checkNotes.length > 0,
      generationTrace: buildTrace(
        [
          {
            field: 'mounting',
            action: 'map',
            sourceValue: source.seriesId,
            targetValue: targetSeries.id,
          },
          {
            field: 'spool',
            action: isFull ? 'map' : 'alternatives',
            sourceValue: tokens.functionCode ?? tokens.spoolSymbol,
            targetValue: functionCode,
          },
          {
            field: 'voltage',
            action: coilResolution.confident ? 'map' : 'default_check_required',
            sourceValue: tokens.coilRating,
            targetValue: coilResolution.segment,
          },
        ],
        isFull
          ? 'Tüm zorunlu alanlar eşlendi; Vickers sipariş kodu üretildi.'
          : 'Bazı alanlar kesin eşleştirilemedi; alternatif Vickers adayı üretildi.'
      ),
    };

    const finalized = finalizeCandidate(candidate);
    if (finalized) {
      results.push(finalized);
    }
  }

  return results;
}

export function generateHydraulicValveEquivalentCandidates(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): GeneratedEquivalentCandidate[] {
  if (!source.seriesId) {
    return [];
  }

  const tokens = extractHydraulicEquivalentTokens(source);
  const sourceIsRexroth = isRexrothWeSeries(source.seriesId);
  const sourceIsYuken = isYukenDsgSeries(source.seriesId);
  const sourceIsVickers = isVickersDg4vSeries(source.seriesId);
  const targetIsRexroth = isRexrothWeSeries(targetSeries.id);
  const targetIsYuken = isYukenDsgSeries(targetSeries.id);
  const targetIsVickers = isVickersDg4vSeries(targetSeries.id);

  let candidates: GeneratedEquivalentCandidate[] = [];

  if (sourceIsRexroth && targetIsYuken) {
    candidates = generateRexrothToYuken(source, targetSeries, tokens);
  } else if (sourceIsYuken && targetIsRexroth) {
    candidates = generateYukenToRexroth(source, targetSeries, tokens);
  } else if (sourceIsVickers && targetIsRexroth) {
    candidates = generateYukenToRexroth(source, targetSeries, tokens);
  } else if (sourceIsVickers && targetIsYuken) {
    candidates = generateRexrothToYuken(source, targetSeries, tokens);
  } else if (sourceIsRexroth && targetIsVickers) {
    candidates = generateToVickers(source, targetSeries, tokens);
  } else if (sourceIsYuken && targetIsVickers) {
    candidates = generateToVickers(source, targetSeries, tokens);
  }

  return candidates.sort((a, b) => {
    const rank = (entry: GeneratedEquivalentCandidate) => {
      if (entry.isExactKnownExample && entry.generationStatus === 'generated_full') {
        return 5;
      }
      switch (entry.generationStatus) {
        case 'exact_known':
          return 4;
        case 'generated_full':
          return 3;
        case 'generated_partial':
          return 2;
        default:
          return 0;
      }
    };

    const rankDiff = rank(b) - rank(a);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    return a.generatedCode.localeCompare(b.generatedCode, 'tr');
  });
}

export function generateBestHydraulicValveEquivalentCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): GeneratedEquivalentCandidate | null {
  return generateHydraulicValveEquivalentCandidates(source, targetSeries)[0] ?? null;
}

export function generationStatusSortRank(
  status: GeneratedEquivalentCandidate['generationStatus'] | undefined,
  isExactKnownExample?: boolean
): number {
  if (isExactKnownExample && status === 'generated_full') {
    return 5;
  }
  switch (status) {
    case 'exact_known':
      return 4;
    case 'generated_full':
      return 3;
    case 'generated_partial':
      return 2;
    case 'cannot_generate':
      return 0;
    default:
      return 1;
  }
}
