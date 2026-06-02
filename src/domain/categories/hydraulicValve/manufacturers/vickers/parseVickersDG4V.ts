/**
 * Vickers / Eaton DG4V-3 / DG4V-5 model code parsing.
 * Emits structured raw fields only; canonical meanings come from resolveCanonicalAttribute.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { PARSER_KEYS } from '@/domain/attributes/extractors/parserFieldKeys';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import { getVickersDG4VSpoolSemantics } from './vickersDG4VSemantics';

const CATALOG_SOURCE = 'Vickers / Eaton DG4V katalog model kodu';

const SERIES_BY_SIZE: Record<'3' | '5', string> = {
  '3': 'DG4V-3',
  '5': 'DG4V-5',
};

export type VickersDG4VValveSize = '3' | '5';

export interface VickersDG4VParsedCode {
  valveSize: VickersDG4VValveSize;
  series: string;
  spoolType: string;
  springCode: string;
  spoolFunctionCode: string;
  electricalOption: string;
  connectorOption: string;
  coilRatingCode: string;
  tankPressureRatingCode: string | null;
  designNumber: string | null;
}

/** True when normalized code looks like a Vickers DG4V product code. */
export function isVickersDG4VCode(normalized: string): boolean {
  return /^DG4V-?(3|5)/.test(normalized);
}

function matchDG4VSegments(normalized: string): RegExpMatchArray | null {
  const dashed = normalized.match(
    /^DG4V-?(3|5)-(\d{1,3})([ABCD])-([A-Z])-([A-Z])-((?:H[4-7])|D12|D24|D48)(?:-(\d{2,3}))?$/
  );
  if (dashed) {
    return dashed;
  }

  return normalized.match(
    /^DG4V-?(3|5)(\d)([ABCD])([A-Z])([A-Z])((?:H[4-7])|D12|D24|D48)(\d{2,3})?$/
  );
}

export function parseVickersDG4VProductCode(normalized: string): VickersDG4VParsedCode | null {
  const match = matchDG4VSegments(normalized);
  if (!match) {
    return null;
  }

  const valveSize = match[1] as VickersDG4VValveSize;
  const spoolType = match[2];
  const springCode = match[3];
  const spoolFunctionCode = `${spoolType}${springCode}`;

  const ratingSegment = match[6].toUpperCase();
  const hMatch = ratingSegment.match(/^H([4-7])$/);
  const coilRatingCode = hMatch ? 'H' : ratingSegment;
  const tankPressureRatingCode = hMatch ? hMatch[1] : null;

  return {
    valveSize,
    series: SERIES_BY_SIZE[valveSize],
    spoolType,
    springCode,
    spoolFunctionCode,
    electricalOption: match[4],
    connectorOption: match[5],
    coilRatingCode,
    tankPressureRatingCode,
    designNumber: match[7] ?? null,
  };
}

function appendSpoolRawFields(
  results: TechnicalAttributeResult[],
  parsed: VickersDG4VParsedCode
): void {
  const semantics = getVickersDG4VSpoolSemantics(parsed.spoolFunctionCode);

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

  if (semantics) {
    results.push(
      buildAttributeResult({
        key: 'number_of_positions',
        label: 'Konum sayısı',
        value: semantics.numberOfPositions,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.spoolFunctionCode,
        category: HYDRAULIC_VALVE_CATEGORY,
      }),
      buildAttributeResult({
        key: 'center_condition',
        label: 'Merkez tipi',
        value: semantics.centerCondition,
        evidence: 'code',
        confidence: semantics.centerCondition === 'unknown' ? 'low' : 'medium',
        requiresCatalogCheck: semantics.requiresCatalogCheck,
        sourceToken: parsed.spoolType,
        category: HYDRAULIC_VALVE_CATEGORY,
      }),
      buildAttributeResult({
        key: 'centering',
        label: 'Merkezleme',
        value: semantics.centering,
        evidence: 'code',
        confidence: semantics.centering === 'unknown' ? 'low' : 'medium',
        requiresCatalogCheck: semantics.requiresCatalogCheck,
        sourceToken: parsed.springCode,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }
}

function appendCoilRatingFields(
  results: TechnicalAttributeResult[],
  parsed: VickersDG4VParsedCode
): void {
  results.push(
    buildAttributeResult({
      key: PARSER_KEYS.coil_rating,
      label: 'Bobin kodu',
      value: parsed.coilRatingCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.coilRatingCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );
}

export function parseVickersDG4V(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeProductCode(inputCode);
  if (!isVickersDG4VCode(normalized)) {
    return null;
  }

  const parsed = parseVickersDG4VProductCode(normalized);
  if (!parsed) {
    return null;
  }

  const results: TechnicalAttributeResult[] = [
    buildAttributeResult({
      key: 'manufacturer',
      label: 'Üretici',
      value: 'Vickers',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: `${CATALOG_SOURCE} (Eaton markası ile aynı ürün ailesi).`,
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
      key: PARSER_KEYS.electrical_option,
      label: 'Elektrik seçeneği',
      value: parsed.electricalOption,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.electricalOption,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: PARSER_KEYS.connector_type,
      label: 'Konnektör kodu',
      value: parsed.connectorOption,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.connectorOption,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
  ];

  appendCoilRatingFields(results, parsed);
  appendSpoolRawFields(results, parsed);

  if (parsed.electricalOption.toUpperCase() === 'M') {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.manual_override,
        label: 'Manuel kumanda',
        value: 'M',
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: false,
        sourceToken: 'M',
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'DG4V elektrik seçeneği M: manuel kumanda (kod kanıtı).',
      })
    );
  }

  if (parsed.tankPressureRatingCode) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.tank_pressure_rating,
        label: 'Tank basınç sınıfı kodu',
        value: parsed.tankPressureRatingCode,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.tankPressureRatingCode,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.designNumber) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.design_series,
        label: 'Tasarım serisi kodu',
        value: parsed.designNumber,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.designNumber,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  return results;
}
