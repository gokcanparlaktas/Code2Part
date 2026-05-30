/**
 * Rexroth WE family parser (3WE6, 4WE6, 4WE10).
 * Raw structured fields only — canonical meanings come from resolver/catalog layers.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { PARSER_KEYS } from '@/domain/attributes/extractors/parserFieldKeys';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  getRexrothWE6SpoolSemantics,
  isRexrothWE6BaseSpoolSymbol,
  REXROTH_WE6_INVALID_OF_WARNING_TR,
  type RexrothWE6BaseSpoolSymbol,
  type RexrothWE6SwitchingPositionVariant,
} from './rexrothWE6SpoolSemantics';
import {
  formatRexrothWEDesignSeriesDisplay,
  parseRexrothWEDesignSeriesToken,
} from './rexrothWEDesignSeries';
import {
  analyzePartialRexrothWE,
  buildRexrothWEUserFacingParserMessages,
  REXROTH_WE_FULLY_PARSED_NOTE_TR,
  type RexrothWEParserDiagnostics,
} from './rexrothWEParserDiagnostics';

const CATALOG_SOURCE = 'Rexroth WE directional controls catalog';

export type RexrothWECodeFormat = 're23164_7x' | 'legacy_6x' | 'we10_ordering' | null;

/** @deprecated Use RexrothWECodeFormat */
export type RexrothWE6CodeFormat = RexrothWECodeFormat;

export type RexrothWESeriesPrefix = '3WE6' | '4WE6' | '4WE10';
export type RexrothWESourceFamily = 'WE6' | 'WE10';

export interface RexrothWEParsedCode {
  seriesPrefix: RexrothWESeriesPrefix;
  sourceFamily: RexrothWESourceFamily;
  nominalSize: '6' | '10';
  numberOfMainPorts: 3 | 4;
  spoolSymbol: RexrothWE6BaseSpoolSymbol;
  functionToken: string;
  switchingPositionVariant: RexrothWE6SwitchingPositionVariant | null;
  detentOption: boolean;
  invalidOfWithNonD: boolean;
  componentSeries: string;
  rawDesignSeries: string | null;
  componentSeriesFamily: string;
  solenoidType: string | null;
  voltageToken: string | null;
  manualOverrideToken: string | null;
  connectorToken: string | null;
  format: RexrothWECodeFormat;
  parseWarnings: string[];
}

/** @deprecated Use RexrothWEParsedCode */
export type RexrothWE6ParsedCode = RexrothWEParsedCode;

const SPOOL_LETTERS = '[ABCDEGHJY]';

function normalizeCoilRatingToken(voltageToken: string): string {
  const upper = voltageToken.trim().toUpperCase();
  const prefixed = upper.match(/^[ECH](G\d+)$/);
  if (prefixed) {
    return prefixed[1];
  }
  const hg = upper.match(/^H(G\d+)$/);
  if (hg) {
    return hg[1];
  }
  return upper;
}

/** True when normalized code looks like a Rexroth 3WE6 / 4WE6 / 4WE10 product code. */
export function isRexrothWECode(normalized: string): boolean {
  return /^(?:3WE6|4WE6|4WE10)/.test(normalized);
}

/** True when code begins with 4WE6 and the next segment looks like a Rexroth WE6 header. */
export function isRexrothWE6Code(normalized: string): boolean {
  return /^4WE6/.test(normalized);
}

function parseRe23164CoilSection(section: string): {
  detentPrefix: boolean;
  solenoidType: string | null;
  voltageToken: string | null;
  manualOverrideToken: string | null;
  connectorToken: string | null;
} | null {
  const combined = section.match(/^(?:OF)?(HG24|EG24|CG24|G12|G24)(N9)?(K4|C4Z)?$/);
  if (combined) {
    const voltageToken = combined[1];
    const solenoidType =
      voltageToken === 'HG24' ? 'H' : voltageToken.startsWith('H') ? 'H' : null;
    return {
      detentPrefix: section.startsWith('OF'),
      solenoidType,
      voltageToken,
      manualOverrideToken: combined[2] ?? null,
      connectorToken: combined[3] ?? null,
    };
  }

  const splitAc = section.match(/^(?:OF)?(H)(G12|G24)(N9)?(K4|C4Z)?$/);
  if (splitAc) {
    return {
      detentPrefix: section.startsWith('OF'),
      solenoidType: splitAc[1],
      voltageToken: splitAc[2],
      manualOverrideToken: splitAc[3] ?? null,
      connectorToken: splitAc[4] ?? null,
    };
  }

  const match = section.match(/^(?:OF)?(G12|G24)(N9)?(K4|C4Z)?$/);
  if (!match) {
    return null;
  }

  return {
    detentPrefix: section.startsWith('OF'),
    solenoidType: null,
    voltageToken: match[1],
    manualOverrideToken: match[2] ?? null,
    connectorToken: match[3] ?? null,
  };
}

function parseLegacyCoilSection(section: string): {
  detentPrefix: boolean;
  solenoidType: string | null;
  voltageToken: string | null;
  manualOverrideToken: string | null;
  connectorToken: string | null;
} | null {
  const match = section.match(/^(?:OF)?(EG24|CG24|G24)(N9)?(K4|C4Z)?$/);
  if (!match) {
    return null;
  }

  return {
    detentPrefix: section.startsWith('OF'),
    solenoidType: null,
    voltageToken: match[1],
    manualOverrideToken: match[2] ?? null,
    connectorToken: match[3] ?? null,
  };
}

type HeaderMatch = {
  seriesPrefix: RexrothWESeriesPrefix;
  sourceFamily: RexrothWESourceFamily;
  nominalSize: '6' | '10';
  numberOfMainPorts: 3 | 4;
  baseSpoolSymbol: RexrothWE6BaseSpoolSymbol;
  functionToken: string;
  switchingPositionVariant: RexrothWE6SwitchingPositionVariant | null;
  headerDetent: boolean;
  componentSeries: string;
  rawDesignSeries: string | null;
  componentSeriesFamily: string;
  coilSection: string;
  format: RexrothWECodeFormat;
};

function formatForComponentSeries(
  seriesPrefix: RexrothWESeriesPrefix,
  componentDigit: string
): RexrothWECodeFormat {
  if (seriesPrefix === '4WE10') {
    return 'we10_ordering';
  }
  return componentDigit === '7' ? 're23164_7x' : 'legacy_6x';
}

function matchSeriesHeader(
  normalized: string,
  config: {
    seriesPrefix: RexrothWESeriesPrefix;
    sourceFamily: RexrothWESourceFamily;
    nominalSize: '6' | '10';
    numberOfMainPorts: 3 | 4;
    componentSeriesDigits: string;
  }
): HeaderMatch | null {
  const { seriesPrefix, componentSeriesDigits } = config;
  const spool = SPOOL_LETTERS;
  const designPatterns = [`[${componentSeriesDigits}]X`, `[${componentSeriesDigits}][0-9]`];
  const separators = ['-?', ''];

  function buildHeaderMatch(
    spoolFields: Omit<
      HeaderMatch,
      | 'seriesPrefix'
      | 'sourceFamily'
      | 'nominalSize'
      | 'numberOfMainPorts'
      | 'componentSeries'
      | 'rawDesignSeries'
      | 'componentSeriesFamily'
      | 'coilSection'
      | 'format'
    >,
    designToken: string,
    coilSection: string
  ): HeaderMatch | null {
    const parsedDesign = parseRexrothWEDesignSeriesToken(designToken, componentSeriesDigits);
    if (!parsedDesign) {
      return null;
    }

    return {
      ...config,
      ...spoolFields,
      componentSeries: parsedDesign.componentSeriesFamily,
      rawDesignSeries: parsedDesign.rawDesignSeries,
      componentSeriesFamily: parsedDesign.componentSeriesFamily,
      coilSection,
      format: formatForComponentSeries(seriesPrefix, parsedDesign.formatDigit),
    };
  }

  for (const designPattern of designPatterns) {
    for (const separator of separators) {
      const eaEb = new RegExp(
        `^${seriesPrefix}E([AB])(?:${separator})(${designPattern})\\/(.+)$`
      ).exec(normalized);
      if (eaEb) {
        const variant = eaEb[1].toLowerCase() as RexrothWE6SwitchingPositionVariant;
        const match = buildHeaderMatch(
          {
            baseSpoolSymbol: 'E',
            functionToken: `E${eaEb[1]}`,
            switchingPositionVariant: variant,
            headerDetent: false,
          },
          eaEb[2],
          eaEb[3]
        );
        if (match) {
          return match;
        }
      }

      const dOfHeader = new RegExp(
        `^${seriesPrefix}DOF(?:${separator})(${designPattern})\\/(.+)$`
      ).exec(normalized);
      if (dOfHeader) {
        const match = buildHeaderMatch(
          {
            baseSpoolSymbol: 'D',
            functionToken: 'D',
            switchingPositionVariant: null,
            headerDetent: true,
          },
          dOfHeader[1],
          dOfHeader[2]
        );
        if (match) {
          return match;
        }
      }

      const single = new RegExp(
        `^${seriesPrefix}(${spool})(?:${separator})(${designPattern})\\/(.+)$`
      ).exec(normalized);
      if (single?.[1] && isRexrothWE6BaseSpoolSymbol(single[1])) {
        const match = buildHeaderMatch(
          {
            baseSpoolSymbol: single[1],
            functionToken: single[1],
            switchingPositionVariant: null,
            headerDetent: false,
          },
          single[2],
          single[3]
        );
        if (match) {
          return match;
        }
      }
    }
  }

  return null;
}

function matchWEHeader(normalized: string): HeaderMatch | null {
  return (
    matchSeriesHeader(normalized, {
      seriesPrefix: '3WE6',
      sourceFamily: 'WE6',
      nominalSize: '6',
      numberOfMainPorts: 3,
      componentSeriesDigits: '67',
    }) ??
    matchSeriesHeader(normalized, {
      seriesPrefix: '4WE6',
      sourceFamily: 'WE6',
      nominalSize: '6',
      numberOfMainPorts: 4,
      componentSeriesDigits: '67',
    }) ??
    matchSeriesHeader(normalized, {
      seriesPrefix: '4WE10',
      sourceFamily: 'WE10',
      nominalSize: '10',
      numberOfMainPorts: 4,
      componentSeriesDigits: '35',
    })
  );
}

function normalizeRexrothWEInputCode(inputCode: string): string {
  return normalizeProductCode(inputCode);
}

export function diagnoseRexrothWECode(inputCode: string): RexrothWEParserDiagnostics {
  const normalized = normalizeRexrothWEInputCode(inputCode);
  if (!normalized || !isRexrothWECode(normalized)) {
    return {
      parseCompleteness: 'unknown',
      unknownTokens: [],
      unresolvedSegments: [],
      parserNotes: [],
    };
  }

  if (parseRexrothWEProductCode(inputCode)) {
    return {
      parseCompleteness: 'fully_parsed',
      unknownTokens: [],
      unresolvedSegments: [],
      parserNotes: [REXROTH_WE_FULLY_PARSED_NOTE_TR],
    };
  }

  return analyzePartialRexrothWE(normalized);
}

export function parseRexrothWEWithDiagnostics(inputCode: string): {
  attributes: TechnicalAttributeResult[] | null;
  diagnostics: RexrothWEParserDiagnostics;
} {
  const diagnostics = diagnoseRexrothWECode(inputCode);
  const attributes = parseRexrothWE(inputCode);
  return { attributes, diagnostics };
}

export { buildRexrothWEUserFacingParserMessages, type RexrothWEParserDiagnostics };

export function parseRexrothWEProductCode(inputCode: string): RexrothWEParsedCode | null {
  const normalized = normalizeRexrothWEInputCode(inputCode);
  const header = matchWEHeader(normalized);
  if (!header) {
    return null;
  }

  const parseCoil =
    header.format === 're23164_7x' ? parseRe23164CoilSection : parseLegacyCoilSection;
  const coil = parseCoil(header.coilSection);
  if (!coil?.voltageToken) {
    return null;
  }

  const detentOption = header.headerDetent || coil.detentPrefix;
  const parseWarnings: string[] = [];
  let invalidOfWithNonD = false;

  if (coil.detentPrefix && header.baseSpoolSymbol !== 'D') {
    invalidOfWithNonD = true;
    parseWarnings.push(REXROTH_WE6_INVALID_OF_WARNING_TR);
  }

  return {
    seriesPrefix: header.seriesPrefix,
    sourceFamily: header.sourceFamily,
    nominalSize: header.nominalSize,
    numberOfMainPorts: header.numberOfMainPorts,
    spoolSymbol: header.baseSpoolSymbol,
    functionToken: header.functionToken,
    switchingPositionVariant: header.switchingPositionVariant,
    detentOption: detentOption && header.baseSpoolSymbol === 'D',
    invalidOfWithNonD,
    componentSeries: header.componentSeriesFamily,
    rawDesignSeries: header.rawDesignSeries,
    componentSeriesFamily: header.componentSeriesFamily,
    solenoidType: coil.solenoidType,
    voltageToken: coil.voltageToken,
    manualOverrideToken: coil.manualOverrideToken,
    connectorToken: coil.connectorToken,
    format: header.format,
    parseWarnings,
  };
}

/** @deprecated Use parseRexrothWEProductCode */
export const parseRexrothWE6ProductCode = parseRexrothWEProductCode;

function appendSpoolRawFields(
  results: TechnicalAttributeResult[],
  parsed: RexrothWEParsedCode
): void {
  const semantics = getRexrothWE6SpoolSemantics(parsed.spoolSymbol, {
    detentOption: parsed.detentOption,
  });

  results.push(
    buildAttributeResult({
      key: PARSER_KEYS.spool_symbol,
      label: 'Sürgü sembolü',
      value: parsed.spoolSymbol,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolSymbol,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.function_code,
      label: 'Fonksiyon kodu',
      value: parsed.functionToken,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'component_series',
      label: 'Komponent serisi ailesi',
      value: parsed.componentSeriesFamily,
      evidence: 'code',
      confidence: parsed.format === 're23164_7x' ? 'high' : 'medium',
      requiresCatalogCheck: parsed.format !== 're23164_7x',
      sourceToken: parsed.componentSeriesFamily,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.design_series,
      label: 'Tasarım serisi',
      value: parsed.rawDesignSeries ?? parsed.componentSeriesFamily,
      normalizedValue: parsed.componentSeriesFamily,
      evidence: 'code',
      confidence: parsed.format === 're23164_7x' ? 'high' : 'medium',
      requiresCatalogCheck: parsed.format !== 're23164_7x',
      sourceToken: parsed.rawDesignSeries ?? parsed.componentSeriesFamily,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: formatRexrothWEDesignSeriesDisplay(
        parsed.rawDesignSeries,
        parsed.componentSeriesFamily
      ),
    }),
    buildAttributeResult({
      key: 'design_series_family',
      label: 'Tasarım serisi ailesi',
      value: parsed.componentSeriesFamily,
      evidence: 'code',
      confidence: parsed.format === 're23164_7x' ? 'high' : 'medium',
      requiresCatalogCheck: parsed.format !== 're23164_7x',
      sourceToken: parsed.componentSeriesFamily,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );

  if (parsed.rawDesignSeries) {
    results.push(
      buildAttributeResult({
        key: 'raw_design_series',
        label: 'Ham tasarım serisi kodu',
        value: parsed.rawDesignSeries,
        evidence: 'code',
        confidence: 'high',
        requiresCatalogCheck: false,
        sourceToken: parsed.rawDesignSeries,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  results.push(
    buildAttributeResult({
      key: 'parse_completeness',
      label: 'Ayrıştırma durumu',
      value: 'fully_parsed',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: REXROTH_WE_FULLY_PARSED_NOTE_TR,
    })
  );

  const semanticsBlock = semantics;
  if (semanticsBlock) {
    results.push(
      buildAttributeResult({
        key: 'number_of_positions',
        label: 'Konum sayısı',
        value: semanticsBlock.numberOfPositions,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.functionToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.switchingPositionVariant) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.switching_position_variant,
        label: 'Anahtarlama pozisyonu',
        value: parsed.switchingPositionVariant,
        evidence: 'code',
        confidence: 'high',
        requiresCatalogCheck: false,
        sourceToken: parsed.functionToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.invalidOfWithNonD) {
    results.push(
      buildAttributeResult({
        key: 'parse_warning',
        label: 'Ayrıştırma uyarısı',
        value: REXROTH_WE6_INVALID_OF_WARNING_TR,
        evidence: 'inferred',
        confidence: 'low',
        requiresCatalogCheck: true,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }
}

export function parseRexrothWE(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeRexrothWEInputCode(inputCode);
  if (!isRexrothWECode(normalized)) {
    return null;
  }

  const parsed = parseRexrothWEProductCode(inputCode);
  if (!parsed) {
    return null;
  }

  const isCatalogFormat = parsed.format === 're23164_7x';
  const coilToken = parsed.voltageToken;
  const coilSourceToken = coilToken ? normalizeCoilRatingToken(coilToken) : null;
  const isPlainG24Token = coilToken === 'G24';
  const mountingCode = parsed.sourceFamily;

  const results: TechnicalAttributeResult[] = [
    buildAttributeResult({
      key: 'manufacturer',
      label: 'Üretici',
      value: 'Rexroth',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: CATALOG_SOURCE,
    }),
    buildAttributeResult({
      key: 'family',
      label: 'Aile',
      value: 'WE',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'series',
      label: 'Seri',
      value: parsed.seriesPrefix,
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'source_family',
      label: 'Kaynak ailesi',
      value: parsed.sourceFamily,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.sourceFamily,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'nominal_size',
      label: 'Nominal boyut',
      value: parsed.nominalSize,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.nominalSize,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'number_of_main_ports',
      label: 'Ana port sayısı',
      value: parsed.numberOfMainPorts,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: String(parsed.numberOfMainPorts),
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.mounting_standard,
      label: 'Montaj standardı kodu',
      value: mountingCode,
      evidence: 'standard',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: mountingCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
  ];

  appendSpoolRawFields(results, parsed);

  if (coilToken) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.coil_rating,
        label: 'Bobin kodu',
        value: coilToken,
        evidence: 'code',
        confidence:
          coilToken === coilSourceToken &&
          coilSourceToken === 'G24' &&
          (isCatalogFormat || parsed.format === 'we10_ordering')
            ? 'high'
            : 'medium',
        requiresCatalogCheck:
          coilToken !== coilSourceToken ||
          coilSourceToken !== 'G24' ||
          (!isCatalogFormat && parsed.format !== 'we10_ordering'),
        sourceToken: coilSourceToken ?? coilToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.solenoidType) {
    results.push(
      buildAttributeResult({
        key: 'solenoid_type',
        label: 'Bobin tipi kodu',
        value: parsed.solenoidType,
        evidence: 'code',
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: false,
        sourceToken: parsed.solenoidType,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.manualOverrideToken) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.manual_override,
        label: 'Manuel kumanda kodu',
        value: parsed.manualOverrideToken,
        evidence: 'code',
        confidence: isCatalogFormat || parsed.format === 'we10_ordering' ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat && parsed.format !== 'we10_ordering',
        sourceToken: parsed.manualOverrideToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.connectorToken) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.connector_type,
        label: 'Konnektör kodu',
        value: parsed.connectorToken,
        evidence: 'code',
        confidence: isCatalogFormat || parsed.format === 'we10_ordering' ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat && parsed.format !== 'we10_ordering',
        sourceToken: parsed.connectorToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  return results;
}

/** @deprecated Use parseRexrothWE */
export function parseRexrothWE6(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeProductCode(inputCode);
  if (!isRexrothWE6Code(normalized)) {
    return null;
  }
  return parseRexrothWE(inputCode);
}
