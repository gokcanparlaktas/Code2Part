/**
 * Vickers / Eaton DG4V-3 / DG4V-5 model code parsing.
 * H7 and spool semantics are hints only — catalog verification required.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  getVickersDG4VSpoolSemantics,
  springCodeToCentering,
  springCodeToLabelTr,
  VICKERS_DG4V_CATALOG_NOTE_TR,
  VICKERS_DG4V_CENTER_CONDITION_LABEL_TR,
  VICKERS_DG4V_CENTERING_LABEL_TR,
  VICKERS_DG4V_VOLTAGE_NOTE_TR,
} from './vickersDG4VSemantics';

const CATALOG_SOURCE = 'Vickers / Eaton DG4V katalog model kodu';

const CONFIRMED_VOLTAGE_BY_TOKEN: Record<string, string> = {
  D12: '12V DC',
  D24: '24V DC',
  D48: '48V DC',
  H: '24V DC',
};

const UNRESOLVED_VOLTAGE_CODES = new Set<string>([]);

const CETOP_BY_SERIES: Record<'3' | '5', string> = {
  '3': 'CETOP 03 / NG6',
  '5': 'CETOP 05 / NG10',
};

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
    /^DG4V-?(3|5)-(\d)([ABCD])-([A-Z])-([A-Z])-((?:H[4-7])|D12|D24|D48)(?:-(\d{2,3}))?$/
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

function appendSpoolBehaviorAttributes(
  results: TechnicalAttributeResult[],
  parsed: VickersDG4VParsedCode
): void {
  const semantics = getVickersDG4VSpoolSemantics(parsed.spoolFunctionCode);
  const centering = springCodeToCentering(parsed.springCode);
  const positions = semantics?.numberOfPositions ?? 3;
  const centerCondition = semantics?.centerCondition ?? 'unknown';
  const behaviorNote =
    semantics?.behaviorNoteTr ??
    `${parsed.spoolFunctionCode}: ${VICKERS_DG4V_CATALOG_NOTE_TR}`;

  results.push(
    buildAttributeResult({
      key: 'number_of_positions',
      label: 'Konum sayısı',
      value: positions,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'spring_arrangement',
      label: 'Yay düzeni',
      value: springCodeToLabelTr(parsed.springCode),
      normalizedValue: centering,
      evidence: 'code',
      confidence: centering === 'unknown' ? 'low' : 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.springCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'centering',
      label: 'Merkezleme',
      value: VICKERS_DG4V_CENTERING_LABEL_TR[centering],
      normalizedValue: centering,
      evidence: 'code',
      confidence: centering === 'unknown' ? 'low' : 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.springCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'center_condition',
      label: 'Merkez durumu',
      value: VICKERS_DG4V_CENTER_CONDITION_LABEL_TR[centerCondition],
      normalizedValue: centerCondition,
      evidence: semantics ? 'series_table' : 'unknown',
      confidence: semantics ? 'medium' : 'low',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'spool_behavior_note',
      label: 'Sürgü davranışı',
      value: behaviorNote,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );
}

function appendVoltageAttributes(
  results: TechnicalAttributeResult[],
  parsed: VickersDG4VParsedCode
): void {
  const confirmed = CONFIRMED_VOLTAGE_BY_TOKEN[parsed.coilRatingCode];
  const isUnresolved = UNRESOLVED_VOLTAGE_CODES.has(parsed.coilRatingCode);

  results.push(
    buildAttributeResult({
      key: 'coil_voltage_code',
      label: 'Bobin kodu',
      value: parsed.coilRatingCode,
      evidence: 'code',
      confidence: isUnresolved ? 'low' : 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.coilRatingCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: isUnresolved ? VICKERS_DG4V_VOLTAGE_NOTE_TR : undefined,
    })
  );

  if (isUnresolved) {
    results.push(
      buildAttributeResult({
        key: 'voltage',
        label: 'Bobin voltajı',
        value: null,
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
        sourceToken: parsed.voltageCode,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: VICKERS_DG4V_VOLTAGE_NOTE_TR,
      })
    );
    return;
  }

  results.push(
    buildAttributeResult({
      key: 'voltage',
      label: 'Bobin voltajı',
      value: confirmed ?? null,
      normalizedValue: confirmed ?? null,
      evidence: 'code',
      confidence: confirmed ? 'medium' : 'low',
      requiresCatalogCheck: true,
      sourceToken: parsed.coilRatingCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: confirmed
        ? `${parsed.coilRatingCode} koddan okundu; katalogdan doğrulanmalıdır.`
        : VICKERS_DG4V_VOLTAGE_NOTE_TR,
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
      key: 'product_type',
      label: 'Ürün tipi',
      value: 'Hidrolik yön kontrol valfi',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'DG4V = solenoid tahrikli yön kontrol valfi.',
    }),
    buildAttributeResult({
      key: 'cetop_ng',
      label: 'CETOP / NG',
      value: CETOP_BY_SERIES[parsed.valveSize],
      evidence: 'code',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note:
        parsed.valveSize === '3'
          ? 'DG4V-3 = CETOP 03 / NG6'
          : 'DG4V-5 = CETOP 05 / NG10',
    }),
    buildAttributeResult({
      key: 'spool_function_code',
      label: 'Sürgü fonksiyon kodu',
      value: parsed.spoolFunctionCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: VICKERS_DG4V_CATALOG_NOTE_TR,
    }),
    buildAttributeResult({
      key: 'function_token',
      label: 'Fonksiyon / spool',
      value: parsed.spoolFunctionCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: VICKERS_DG4V_CATALOG_NOTE_TR,
    }),
    buildAttributeResult({
      key: 'spool_type',
      label: 'Sürgü tipi',
      value: parsed.spoolType,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolType,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: VICKERS_DG4V_CATALOG_NOTE_TR,
    }),
    buildAttributeResult({
      key: 'spring_arrangement_code',
      label: 'Yay kodu',
      value: parsed.springCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.springCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'electrical_option',
      label: 'Elektrik seçeneği',
      value: parsed.electricalOption,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.electricalOption,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Elektrik seçeneği anlamı katalogdan doğrulanmalıdır.',
    }),
    buildAttributeResult({
      key: 'connector_option',
      label: 'Konnektör / bobin muhafaza',
      value: parsed.connectorOption,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.connectorOption,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Konnektör veya bobin muhafaza seçeneği katalogdan doğrulanmalıdır.',
    }),
    buildAttributeResult({
      key: 'connector_token',
      label: 'Konnektör kodu',
      value: parsed.connectorOption,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.connectorOption,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
  ];

  appendVoltageAttributes(results, parsed);
  appendSpoolBehaviorAttributes(results, parsed);

  if (parsed.tankPressureRatingCode) {
    results.push(
      buildAttributeResult({
        key: 'tank_pressure_rating_code',
        label: 'Tank hattı basınç sınıfı (kod)',
        value: parsed.tankPressureRatingCode,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.tankPressureRatingCode,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Tank hattı basınç sınıfı katalogdan doğrulanmalıdır.',
      })
    );
  }

  if (parsed.designNumber) {
    results.push(
      buildAttributeResult({
        key: 'design_number',
        label: 'Tasarım serisi',
        value: parsed.designNumber,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.designNumber,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Katalog tasarım / revizyon numarası.',
      })
    );
  }

  return results;
}
