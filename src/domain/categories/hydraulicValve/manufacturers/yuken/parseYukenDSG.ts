/**
 * Yuken DSG-01 / DSG-03 directional valve model code parsing.
 * Emits structured raw fields only; canonical meanings come from resolveCanonicalAttribute.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { PARSER_KEYS } from '@/domain/attributes/extractors/parserFieldKeys';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import { getYukenDSGSpoolSemantics } from './yukenDSGSpoolSemantics';

const CATALOG_SOURCE = 'Yuken DSG katalog model kodu';

const SERIES_BY_SIZE: Record<'01' | '03', string> = {
  '01': 'DSG-01',
  '03': 'DSG-03',
};

export type YukenDSGValveSize = '01' | '03';

export interface YukenDSGParsedCode {
  valveSize: YukenDSGValveSize;
  series: string;
  positionCountDigit: string;
  springCode: string;
  spoolType: string;
  spoolFunctionCode: string;
  voltageToken: string;
  /** Catalog manual-override segment: omitted in code = default (pin); C = push button + lock nut. */
  manualOverrideToken: 'default' | 'C';
  connectorToken: string;
  designNumber: string;
}

/** True when normalized code matches Yuken DSG-01 / DSG-03 structure. */
export function isYukenDSGCode(normalized: string): boolean {
  return /^DSG-?(01|03)-\d[CBD]\d/.test(normalized);
}

export function parseYukenDSGProductCode(normalized: string): YukenDSGParsedCode | null {
  const match = normalized.match(
    /^DSG-?(01|03)-(\d)([CBD])(\d{2}|\d)-(D12|D24|D48)-(?:([C])-)?(N1?)-(\d{2,3})$/
  );
  if (!match) {
    return null;
  }

  const valveSize = match[1] as YukenDSGValveSize;
  const positionCountDigit = match[2];
  const springCode = match[3];
  const spoolType = match[4];
  const spoolFunctionCode = `${positionCountDigit}${springCode}${spoolType}`;

  return {
    valveSize,
    series: SERIES_BY_SIZE[valveSize],
    positionCountDigit,
    springCode,
    spoolType,
    spoolFunctionCode,
    voltageToken: match[5],
    manualOverrideToken: match[6] === 'C' ? 'C' : 'default',
    connectorToken: match[7],
    designNumber: match[8],
  };
}

function parsePositionCount(digit: string): 2 | 3 | null {
  if (digit === '2') {
    return 2;
  }
  if (digit === '3') {
    return 3;
  }
  return null;
}

function appendSpoolRawFields(
  results: TechnicalAttributeResult[],
  parsed: YukenDSGParsedCode
): void {
  const semantics = getYukenDSGSpoolSemantics(parsed.spoolFunctionCode);
  const positions =
    semantics?.numberOfPositions ?? parsePositionCount(parsed.positionCountDigit);

  results.push(
    buildAttributeResult({
      key: PARSER_KEYS.function_code,
      label: 'Fonksiyon kodu',
      value: parsed.spoolFunctionCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.spool_symbol,
      label: 'Sürgü tipi',
      value: parsed.spoolType,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolType,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.spring_arrangement,
      label: 'Yay kodu',
      value: parsed.springCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.springCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );

  if (positions !== null) {
    results.push(
      buildAttributeResult({
        key: 'number_of_positions',
        label: 'Konum sayısı',
        value: positions,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.positionCountDigit,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }
}

export function parseYukenDSG(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeProductCode(inputCode);
  if (!isYukenDSGCode(normalized)) {
    return null;
  }

  const parsed = parseYukenDSGProductCode(normalized);
  if (!parsed) {
    return null;
  }

  const results: TechnicalAttributeResult[] = [
    buildAttributeResult({
      key: 'manufacturer',
      label: 'Üretici',
      value: 'Yuken',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: CATALOG_SOURCE,
    }),
    buildAttributeResult({
      key: 'family',
      label: 'Aile',
      value: 'DSG',
      evidence: 'code',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'source_family',
      label: 'Kaynak aile',
      value: parsed.series,
      evidence: 'code',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'series',
      label: 'Seri',
      value: parsed.series,
      evidence: 'code',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'model_size',
      label: 'Model boyutu',
      value: parsed.valveSize,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.valveSize,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.mounting_standard,
      label: 'Montaj boyutu kodu',
      value: parsed.valveSize,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.valveSize,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.coil_rating,
      label: 'Bobin kodu',
      value: parsed.voltageToken,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.voltageToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.connector_type,
      label: 'Konnektör kodu',
      value: parsed.connectorToken,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.connectorToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.manual_override,
      label: 'Manual override code',
      value: parsed.manualOverrideToken,
      evidence: 'series_table',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.manualOverrideToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.design_series,
      label: 'Tasarım serisi kodu',
      value: parsed.designNumber,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.designNumber,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.design_number,
      label: 'Tasarım numarası',
      value: parsed.designNumber,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.designNumber,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
  ];

  appendSpoolRawFields(results, parsed);

  return results;
}
