/**
 * Rexroth WE6 (4WE6…) parsing backed by catalog RE 23164.
 * Emits structured raw fields only; canonical meanings come from resolveCanonicalAttribute.
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

const CATALOG_SOURCE = 'Rexroth RE 23164';

export type RexrothWE6CodeFormat = 're23164_7x' | 'legacy_6x' | null;

export interface RexrothWE6ParsedCode {
  spoolSymbol: RexrothWE6BaseSpoolSymbol;
  functionToken: string;
  switchingPositionVariant: RexrothWE6SwitchingPositionVariant | null;
  detentOption: boolean;
  invalidOfWithNonD: boolean;
  componentSeries: string;
  solenoidType: string | null;
  voltageToken: string | null;
  manualOverrideToken: string | null;
  connectorToken: string | null;
  format: RexrothWE6CodeFormat;
  parseWarnings: string[];
}

/** Returns true when normalized code looks like a Rexroth 4WE6 product code. */
export function isRexrothWE6Code(normalized: string): boolean {
  return /^4WE6(?:[ABCDEGHJY]|E[AB]|DOF)/.test(normalized);
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
  const match = section.match(/^(?:OF)?(EG24|CG24|G24)(N9)?(K4)?$/);
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
  baseSpoolSymbol: RexrothWE6BaseSpoolSymbol;
  functionToken: string;
  switchingPositionVariant: RexrothWE6SwitchingPositionVariant | null;
  headerDetent: boolean;
  componentSeries: string;
  coilSection: string;
  format: RexrothWE6CodeFormat;
};

function matchWE6Header(normalized: string): HeaderMatch | null {
  const eaEb = normalized.match(/^4WE6E([AB])(?:-?)([67])X\/(.+)$/);
  if (eaEb) {
    const variant = eaEb[1].toLowerCase() as RexrothWE6SwitchingPositionVariant;
    return {
      baseSpoolSymbol: 'E',
      functionToken: `E${eaEb[1]}`,
      switchingPositionVariant: variant,
      headerDetent: false,
      componentSeries: `${eaEb[2]}X`,
      coilSection: eaEb[3],
      format: eaEb[2] === '7' ? 're23164_7x' : 'legacy_6x',
    };
  }

  const dOfHeader = normalized.match(/^4WE6DOF(?:-?)([67])X\/(.+)$/);
  if (dOfHeader) {
    return {
      baseSpoolSymbol: 'D',
      functionToken: 'D',
      switchingPositionVariant: null,
      headerDetent: true,
      componentSeries: `${dOfHeader[1]}X`,
      coilSection: dOfHeader[2],
      format: dOfHeader[1] === '7' ? 're23164_7x' : 'legacy_6x',
    };
  }

  const single = normalized.match(/^4WE6([ABCDEGHJY])(?:-?)([67])X\/(.+)$/);
  if (single?.[1] && isRexrothWE6BaseSpoolSymbol(single[1])) {
    return {
      baseSpoolSymbol: single[1],
      functionToken: single[1],
      switchingPositionVariant: null,
      headerDetent: false,
      componentSeries: `${single[2]}X`,
      coilSection: single[3],
      format: single[2] === '7' ? 're23164_7x' : 'legacy_6x',
    };
  }

  return null;
}

export function parseRexrothWE6ProductCode(
  normalized: string
): RexrothWE6ParsedCode | null {
  const header = matchWE6Header(normalized);
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
    spoolSymbol: header.baseSpoolSymbol,
    functionToken: header.functionToken,
    switchingPositionVariant: header.switchingPositionVariant,
    detentOption: detentOption && header.baseSpoolSymbol === 'D',
    invalidOfWithNonD,
    componentSeries: header.componentSeries,
    solenoidType: coil.solenoidType,
    voltageToken: coil.voltageToken,
    manualOverrideToken: coil.manualOverrideToken,
    connectorToken: coil.connectorToken,
    format: header.format,
    parseWarnings,
  };
}

function appendSpoolRawFields(
  results: TechnicalAttributeResult[],
  parsed: RexrothWE6ParsedCode
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
      key: PARSER_KEYS.design_series,
      label: 'Komponent serisi',
      value: parsed.componentSeries,
      evidence: 'code',
      confidence: parsed.format === 're23164_7x' ? 'high' : 'medium',
      requiresCatalogCheck: parsed.format !== 're23164_7x',
      sourceToken: parsed.componentSeries,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );

  if (semantics) {
    results.push(
      buildAttributeResult({
        key: 'number_of_positions',
        label: 'Konum sayısı',
        value: semantics.numberOfPositions,
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

export function parseRexrothWE6(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeProductCode(inputCode);
  if (!isRexrothWE6Code(normalized)) {
    return null;
  }

  const parsed = parseRexrothWE6ProductCode(normalized);
  if (!parsed) {
    return null;
  }

  const isCatalogFormat = parsed.format === 're23164_7x';
  const coilToken = parsed.voltageToken;

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
      key: 'series',
      label: 'Seri',
      value: '4WE6',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.mounting_standard,
      label: 'Montaj standardı kodu',
      value: 'WE6',
      evidence: 'standard',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: 'WE6',
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
        confidence: coilToken === 'G24' && isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: coilToken !== 'G24' || !isCatalogFormat,
        sourceToken: coilToken,
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
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat,
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
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat,
        sourceToken: parsed.connectorToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  return results;
}
