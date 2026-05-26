/**
 * Yuken DSG-01 / DSG-03 directional valve model code parsing.
 * Behavior tags are practical hints; catalog verification is always required.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  getYukenDSGSpoolSemantics,
  springCodeToCentering,
  springCodeToLabelTr,
  YUKEN_DSG_CATALOG_NOTE_TR,
  YUKEN_DSG_CENTER_CONDITION_LABEL_TR,
  YUKEN_DSG_CENTERING_LABEL_TR,
} from './yukenDSGSpoolSemantics';

const CATALOG_SOURCE = 'Yuken DSG katalog model kodu';

const VOLTAGE_BY_TOKEN: Record<string, string> = {
  D12: '12V DC',
  D24: '24V DC',
  D48: '48V DC',
};

const CONNECTOR_BY_TOKEN: Record<string, { labelTr: string; token: string }> = {
  N: { token: 'N', labelTr: 'Takılı konnektör' },
  N1: { token: 'N1', labelTr: 'Göstergeli takılı konnektör' },
};

const CETOP_BY_SIZE: Record<'01' | '03', string> = {
  '01': 'CETOP 03 / NG6',
  '03': 'CETOP 05 / NG10',
};

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
  connectorToken: string;
  designNumber: string;
}

/** True when normalized code matches Yuken DSG-01 / DSG-03 structure. */
export function isYukenDSGCode(normalized: string): boolean {
  return /^DSG-?(01|03)-\d[CBD]\d/.test(normalized);
}

export function parseYukenDSGProductCode(normalized: string): YukenDSGParsedCode | null {
  const match = normalized.match(
    /^DSG-?(01|03)-(\d)([CBD])(\d{2}|\d)-(D12|D24|D48)-(N1?)-(\d{2,3})$/
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
    connectorToken: match[6],
    designNumber: match[7],
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

function appendSpoolBehaviorAttributes(
  results: TechnicalAttributeResult[],
  parsed: YukenDSGParsedCode
): void {
  const semantics = getYukenDSGSpoolSemantics(parsed.spoolFunctionCode);
  const centering = springCodeToCentering(parsed.springCode);
  const positions =
    semantics?.numberOfPositions ?? parsePositionCount(parsed.positionCountDigit);
  const centerCondition = semantics?.centerCondition ?? 'unknown';
  const behaviorNote =
    semantics?.behaviorNoteTr ??
    `${parsed.spoolFunctionCode}: ${YUKEN_DSG_CATALOG_NOTE_TR}`;

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
        note: behaviorNote,
      })
    );
  }

  results.push(
    buildAttributeResult({
      key: 'spring_arrangement',
      label: 'Yay düzeni',
      value: springCodeToLabelTr(parsed.springCode),
      normalizedValue: centering,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.springCode,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'centering',
      label: 'Merkezleme',
      value: YUKEN_DSG_CENTERING_LABEL_TR[centering],
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
      value: YUKEN_DSG_CENTER_CONDITION_LABEL_TR[centerCondition],
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
      evidence: semantics ? 'series_table' : 'unknown',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolFunctionCode,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );
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

  const voltage = VOLTAGE_BY_TOKEN[parsed.voltageToken];
  const connector = CONNECTOR_BY_TOKEN[parsed.connectorToken];

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
      note: 'DSG = solenoid tahrikli yön kontrol valfi.',
    }),
    buildAttributeResult({
      key: 'cetop_ng',
      label: 'CETOP / NG',
      value: CETOP_BY_SIZE[parsed.valveSize],
      evidence: 'code',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: parsed.valveSize === '01' ? 'DSG-01 = CETOP 03 / NG6' : 'DSG-03 = CETOP 05 / NG10',
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
      note: YUKEN_DSG_CATALOG_NOTE_TR,
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
      note: YUKEN_DSG_CATALOG_NOTE_TR,
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
      note: YUKEN_DSG_CATALOG_NOTE_TR,
    }),
    buildAttributeResult({
      key: 'voltage',
      label: 'Bobin voltajı',
      value: voltage ?? null,
      normalizedValue: voltage ?? null,
      evidence: 'code',
      confidence: voltage ? 'high' : 'low',
      requiresCatalogCheck: !voltage,
      sourceToken: parsed.voltageToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: voltage ? `Katalog: ${parsed.voltageToken} = ${voltage}` : undefined,
    }),
    buildAttributeResult({
      key: 'connector_token',
      label: 'Konnektör kodu',
      value: parsed.connectorToken,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.connectorToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'connector',
      label: 'Konnektör',
      value: connector?.labelTr ?? parsed.connectorToken,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
      sourceToken: parsed.connectorToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: connector ? `${connector.labelTr} (${connector.token})` : undefined,
    }),
    buildAttributeResult({
      key: 'design_number',
      label: 'Tasarım numarası',
      value: parsed.designNumber,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.designNumber,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Katalog tasarım / revizyon numarası.',
    }),
  ];

  appendSpoolBehaviorAttributes(results, parsed);

  return results;
}
