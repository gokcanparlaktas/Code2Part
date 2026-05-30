/**
 * Yuken DSHG pilot-operated directional valve model code parsing.
 * Separate from DSG (direct solenoid operated). Raw fields only.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { PARSER_KEYS } from '@/domain/attributes/extractors/parserFieldKeys';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

const CATALOG_SOURCE = 'Yuken DSHG katalog model kodu';

const DSHG_SIZES = ['01', '03', '04', '06', '10'] as const;
export type YukenDSHGValveSize = (typeof DSHG_SIZES)[number];

const COIL_TOKENS = /^(D12|D24|D48|A100|A120|A200|A240|R100|R200)$/;
const CONNECTOR_TOKENS = /^N1?$/;
const PILOT_CHOKE_TOKENS = new Set(['C1', 'C2', 'C1C2']);
const SPOOL_CONTROL_MOD_TOKENS = new Set(['R2', 'RA', 'RB', 'P2', 'PA', 'PB']);

const SERIES_BY_SIZE: Record<YukenDSHGValveSize, string> = {
  '01': 'DSHG-01',
  '03': 'DSHG-03',
  '04': 'DSHG-04',
  '06': 'DSHG-06',
  '10': 'DSHG-10',
};

export interface YukenDSHGParsedCode {
  valveSize: YukenDSHGValveSize;
  series: string;
  performanceOption: string | null;
  shocklessType: string | null;
  positionCountDigit: string;
  springCode: string;
  spoolType: string;
  functionCode: string;
  pilotChoke: string | null;
  pilotConnection: string | null;
  pilotDrainType: string | null;
  spoolControlModification: string | null;
  voltageToken: string;
  manualOverride: string | null;
  connectorToken: string | null;
  designNumber: string;
  unparsedPilotTokens: string[];
}

/** True when normalized code matches Yuken DSHG structure (not DSG). */
export function isYukenDSHGCode(normalized: string): boolean {
  return /^(?:(?:H|P)-)?(?:(?:S|G)-)?DSHG-?(?:01|03|04|06|10)-\d[CBD]\d/.test(
    normalized
  );
}

function parseDshgTail(tail: string): {
  pilotChoke: string | null;
  pilotConnection: string | null;
  pilotDrainType: string | null;
  spoolControlModification: string | null;
  voltageToken: string;
  manualOverride: string | null;
  connectorToken: string | null;
  designNumber: string;
  unparsedPilotTokens: string[];
} | null {
  const parts = tail.split('-').filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const designNumber = parts[parts.length - 1];
  if (!/^\d{2,3}$/.test(designNumber)) {
    return null;
  }

  let index = parts.length - 2;
  let connectorToken: string | null = null;
  if (CONNECTOR_TOKENS.test(parts[index])) {
    connectorToken = parts[index];
    index -= 1;
  }

  let manualOverride: string | null = null;
  if (parts[index] === 'C') {
    manualOverride = 'C';
    index -= 1;
  }

  const voltageToken = parts[index];
  if (!COIL_TOKENS.test(voltageToken)) {
    return null;
  }
  index -= 1;

  const pilotRaw = parts.slice(0, index + 1);
  let pilotChoke: string | null = null;
  let pilotConnection: string | null = null;
  let pilotDrainType: string | null = null;
  let spoolControlModification: string | null = null;
  const unparsedPilotTokens: string[] = [];

  for (const token of pilotRaw) {
    if (PILOT_CHOKE_TOKENS.has(token)) {
      pilotChoke = token;
      continue;
    }
    if (token === 'E') {
      pilotConnection = 'E';
      continue;
    }
    if (token === 'T') {
      pilotDrainType = 'T';
      continue;
    }
    if (SPOOL_CONTROL_MOD_TOKENS.has(token)) {
      spoolControlModification = token;
      continue;
    }
    unparsedPilotTokens.push(token);
  }

  return {
    pilotChoke,
    pilotConnection,
    pilotDrainType,
    spoolControlModification,
    voltageToken,
    manualOverride,
    connectorToken,
    designNumber,
    unparsedPilotTokens,
  };
}

export function parseYukenDSHGProductCode(normalized: string): YukenDSHGParsedCode | null {
  const match = normalized.match(
    /^(?:(H|P)-)?(?:(S|G)-)?DSHG-?(01|03|04|06|10)-(\d)([CBD])(\d{1,2})-(.+)$/
  );
  if (!match) {
    return null;
  }

  const valveSize = match[3] as YukenDSHGValveSize;
  if (!DSHG_SIZES.includes(valveSize)) {
    return null;
  }

  const positionCountDigit = match[4];
  const springCode = match[5];
  const spoolType = match[6];
  const functionCode = `${positionCountDigit}${springCode}${spoolType}`;

  const tail = parseDshgTail(match[7]);
  if (!tail) {
    return null;
  }

  return {
    valveSize,
    series: SERIES_BY_SIZE[valveSize],
    performanceOption: match[1] ?? null,
    shocklessType: match[2] ?? null,
    positionCountDigit,
    springCode,
    spoolType,
    functionCode,
    pilotChoke: tail.pilotChoke,
    pilotConnection: tail.pilotConnection,
    pilotDrainType: tail.pilotDrainType,
    spoolControlModification: tail.spoolControlModification,
    voltageToken: tail.voltageToken,
    manualOverride: tail.manualOverride,
    connectorToken: tail.connectorToken,
    designNumber: tail.designNumber,
    unparsedPilotTokens: tail.unparsedPilotTokens,
  };
}

function appendSpoolRawFields(
  results: TechnicalAttributeResult[],
  parsed: YukenDSHGParsedCode,
  requiresCatalogCheck: boolean
): void {
  results.push(
    buildAttributeResult({
      key: PARSER_KEYS.function_code,
      label: 'Fonksiyon kodu',
      value: parsed.functionCode,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionCode,
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

  const positions = parsed.positionCountDigit === '2' ? 2 : parsed.positionCountDigit === '3' ? 3 : null;
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

  if (requiresCatalogCheck && parsed.unparsedPilotTokens.length > 0) {
    results.push(
      buildAttributeResult({
        key: 'pilot_section_unparsed',
        label: 'Pilot bölümü (inceleme)',
        value: parsed.unparsedPilotTokens.join('-'),
        evidence: 'code',
        confidence: 'unknown',
        requiresCatalogCheck: true,
        sourceToken: parsed.unparsedPilotTokens.join('-'),
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Pilot segmenti katalog ile doğrulanmalıdır.',
      })
    );
  }
}

export function parseYukenDSHG(inputCode: string): TechnicalAttributeResult[] | null {
  const normalized = normalizeProductCode(inputCode);
  if (!isYukenDSHGCode(normalized)) {
    return null;
  }

  const parsed = parseYukenDSHGProductCode(normalized);
  if (!parsed) {
    return null;
  }

  const requiresCatalogCheck = parsed.unparsedPilotTokens.length > 0;

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
      value: 'DSHG',
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

  if (parsed.performanceOption) {
    results.push(
      buildAttributeResult({
        key: 'performance_option',
        label: 'Performans seçeneği',
        value: parsed.performanceOption,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.performanceOption,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.shocklessType) {
    results.push(
      buildAttributeResult({
        key: 'shockless_type',
        label: 'Şoksuz tip',
        value: parsed.shocklessType,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.shocklessType,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.pilotChoke) {
    results.push(
      buildAttributeResult({
        key: 'pilot_choke',
        label: 'Pilot choke',
        value: parsed.pilotChoke,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.pilotChoke,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.pilotConnection) {
    results.push(
      buildAttributeResult({
        key: 'pilot_connection',
        label: 'Pilot bağlantısı',
        value: parsed.pilotConnection,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.pilotConnection,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.pilotDrainType) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.pilot_drain_type,
        label: 'Pilot dreyn tipi',
        value: parsed.pilotDrainType,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.pilotDrainType,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.spoolControlModification) {
    results.push(
      buildAttributeResult({
        key: 'spool_control_modification',
        label: 'Sürgü kontrol modifikasyonu',
        value: parsed.spoolControlModification,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.spoolControlModification,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (parsed.manualOverride) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.manual_override,
        label: 'Manuel override',
        value: parsed.manualOverride,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
        sourceToken: parsed.manualOverride,
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
        confidence: 'high',
        requiresCatalogCheck: false,
        sourceToken: parsed.connectorToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  appendSpoolRawFields(results, parsed, requiresCatalogCheck);

  return results;
}
