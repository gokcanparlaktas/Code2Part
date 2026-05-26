/**
 * Rexroth WE6 (4WE6…) parsing backed by catalog RE 23164.
 * Spool behavior tags are practical hints; always require catalog verification.
 */

import { buildAttributeResult } from '@/domain/attributes/extractors/attributeEvidence';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  formatSwitchingVariantNoteTr,
  getRexrothWE6SpoolSemantics,
  isRexrothWE6BaseSpoolSymbol,
  REXROTH_WE6_CENTER_CONDITION_LABEL_TR,
  REXROTH_WE6_CENTERING_LABEL_TR,
  REXROTH_WE6_INVALID_OF_WARNING_TR,
  REXROTH_WE6_NORMALLY_STATE_LABEL_TR,
  type RexrothWE6BaseSpoolSymbol,
  type RexrothWE6SwitchingPositionVariant,
} from './rexrothWE6SpoolSemantics';

const CATALOG_SOURCE = 'Rexroth RE 23164';

const VOLTAGE_BY_TOKEN: Record<string, string> = {
  G12: '12V DC',
  G24: '24V DC',
};

const CONNECTOR_BY_TOKEN: Record<string, string> = {
  K4: 'DIN EN 175301-803',
  C4Z: 'AMP Junior-Timer',
};

export type RexrothWE6CodeFormat = 're23164_7x' | 'legacy_6x' | null;

export interface RexrothWE6ParsedCode {
  /** Base spool symbol letter (E for EA/EB). */
  spoolSymbol: RexrothWE6BaseSpoolSymbol;
  /** Full ordering function token (E, EA, EB, D, …). */
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
  const match = section.match(/^(?:OF)?(H)?(G12|G24)(N9)?(K4|C4Z)?$/);
  if (!match) {
    return null;
  }

  return {
    detentPrefix: section.startsWith('OF'),
    solenoidType: match[1] ?? null,
    voltageToken: match[2] ?? null,
    manualOverrideToken: match[3] ?? null,
    connectorToken: match[4] ?? null,
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

function voltageFromToken(token: string | null, format: RexrothWE6CodeFormat): {
  value: string | null;
  sourceToken: string | null;
  confidence: TechnicalAttributeResult['confidence'];
  requiresCatalogCheck: boolean;
  note?: string;
} {
  if (!token) {
    return { value: null, sourceToken: null, confidence: 'unknown', requiresCatalogCheck: true };
  }

  if (token === 'G12' || token === 'G24') {
    return {
      value: VOLTAGE_BY_TOKEN[token],
      sourceToken: token,
      confidence: 'high',
      requiresCatalogCheck: false,
      note: `Katalog (${CATALOG_SOURCE}): ${token} bobin voltajı.`,
    };
  }

  if (format === 'legacy_6x' && (token === 'EG24' || token === 'CG24')) {
    return {
      value: '24V DC',
      sourceToken: token,
      confidence: 'medium',
      requiresCatalogCheck: true,
      note: 'Eski/mock kod formatı (6X/EG24); RE 23164 7X/HG24 formatı tercih edilir.',
    };
  }

  return { value: null, sourceToken: token, confidence: 'low', requiresCatalogCheck: true };
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

function appendSpoolBehaviorAttributes(
  results: TechnicalAttributeResult[],
  parsed: RexrothWE6ParsedCode
): void {
  const semantics = getRexrothWE6SpoolSemantics(parsed.spoolSymbol, {
    detentOption: parsed.detentOption,
  });

  const notes: string[] = [semantics.behaviorNoteTr];
  if (parsed.switchingPositionVariant) {
    notes.unshift(
      formatSwitchingVariantNoteTr(parsed.spoolSymbol, parsed.switchingPositionVariant)
    );
  }
  if (parsed.invalidOfWithNonD) {
    notes.unshift(REXROTH_WE6_INVALID_OF_WARNING_TR);
  }
  for (const warning of parsed.parseWarnings) {
    if (!notes.includes(warning)) {
      notes.unshift(warning);
    }
  }

  const behaviorNote = notes.join(' ');

  results.push(
    buildAttributeResult({
      key: 'number_of_positions',
      label: 'Konum sayısı',
      value: semantics.numberOfPositions,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'centering',
      label: 'Merkezleme',
      value: REXROTH_WE6_CENTERING_LABEL_TR[semantics.centering],
      normalizedValue: semantics.centering,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'center_condition',
      label: 'Merkez durumu',
      value: REXROTH_WE6_CENTER_CONDITION_LABEL_TR[semantics.centerCondition],
      normalizedValue: semantics.centerCondition,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: behaviorNote,
    }),
    buildAttributeResult({
      key: 'normally_state',
      label: 'Normal durum',
      value: REXROTH_WE6_NORMALLY_STATE_LABEL_TR[semantics.normallyState],
      normalizedValue: semantics.normallyState,
      evidence: 'series_table',
      confidence: semantics.normallyState === 'unknown' ? 'low' : 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
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
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    })
  );

  if (parsed.switchingPositionVariant) {
    results.push(
      buildAttributeResult({
        key: 'switching_position_variant',
        label: 'Anahtarlama pozisyonu',
        value: parsed.switchingPositionVariant,
        evidence: 'code',
        confidence: 'high',
        requiresCatalogCheck: false,
        sourceToken: parsed.functionToken,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: formatSwitchingVariantNoteTr(parsed.spoolSymbol, parsed.switchingPositionVariant),
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
  const voltage = voltageFromToken(parsed.voltageToken, parsed.format);

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
      key: 'product_type',
      label: 'Ürün tipi',
      value: 'Hidrolik yön kontrol valfi',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'RE 23164: WE tipi solenoid tahrikli yön kontrol sürgü valfi.',
    }),
    buildAttributeResult({
      key: 'cetop_ng',
      label: 'CETOP / NG',
      value: 'CETOP 03 / NG6',
      evidence: 'standard',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'WE6 = NG6 (RE 23164).',
    }),
    buildAttributeResult({
      key: 'porting_pattern',
      label: 'Port deseni',
      value: 'DIN 24340 form A',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
    }),
    buildAttributeResult({
      key: 'spool_symbol',
      label: 'Sürgü sembolü',
      value: parsed.spoolSymbol,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.spoolSymbol,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Temel sürgü sembolü; sipariş kodu varyantları ayrıca işlenir.',
    }),
    buildAttributeResult({
      key: 'function_token',
      label: 'Fonksiyon / spool',
      value: parsed.functionToken,
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: parsed.functionToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Sürgü sembolünün hidrolik davranışı katalog sembol tablosundan doğrulanmalıdır.',
    }),
    buildAttributeResult({
      key: 'component_series',
      label: 'Komponent serisi',
      value: parsed.componentSeries,
      evidence: 'code',
      confidence: isCatalogFormat ? 'high' : 'medium',
      requiresCatalogCheck: !isCatalogFormat,
      sourceToken: parsed.componentSeries,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: isCatalogFormat
        ? 'RE 23164: komponent serisi 7X.'
        : 'Eski örnek kod formatı (6X); RE 23164 için 7X beklenir.',
    }),
    buildAttributeResult({
      key: 'voltage',
      label: 'Bobin voltajı',
      value: voltage.value,
      normalizedValue: voltage.value,
      evidence: 'code',
      confidence: voltage.confidence,
      requiresCatalogCheck: voltage.requiresCatalogCheck,
      sourceToken: voltage.sourceToken ?? undefined,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: voltage.note,
    }),
    buildAttributeResult({
      key: 'max_pressure_abp',
      label: 'Maks. çalışma basıncı (A/B/P)',
      value: '315 bar',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: CATALOG_SOURCE,
    }),
    buildAttributeResult({
      key: 'max_pressure_port_t',
      label: 'Maks. basınç (T portu)',
      value: '160 bar',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: CATALOG_SOURCE,
    }),
    buildAttributeResult({
      key: 'max_flow',
      label: 'Maks. debi',
      value: 60,
      unit: 'l/min',
      evidence: 'series_table',
      confidence: 'high',
      category: HYDRAULIC_VALVE_CATEGORY,
      note: CATALOG_SOURCE,
    }),
  ];

  appendSpoolBehaviorAttributes(results, parsed);

  if (parsed.solenoidType) {
    results.push(
      buildAttributeResult({
        key: 'solenoid_type',
        label: 'Bobin tipi',
        value: parsed.solenoidType,
        evidence: 'code',
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: false,
        sourceToken: parsed.solenoidType,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'RE 23164: H = AC bobin (katalog sembolü).',
      })
    );
  }

  if (parsed.manualOverrideToken === 'N9') {
    results.push(
      buildAttributeResult({
        key: 'manual_override',
        label: 'Manuel kumanda',
        value: 'Gizli/korumalı manuel kumanda',
        evidence: 'code',
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat,
        sourceToken: 'N9',
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'RE 23164: N9 gizli/korumalı manuel kumanda.',
      })
    );
  }

  if (parsed.connectorToken) {
    const connectorLabel = CONNECTOR_BY_TOKEN[parsed.connectorToken];
    results.push(
      buildAttributeResult({
        key: 'connector_token',
        label: 'Konnektör',
        value: parsed.connectorToken,
        evidence: 'code',
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat,
        sourceToken: parsed.connectorToken,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: connectorLabel ? `${connectorLabel} (${parsed.connectorToken})` : undefined,
      }),
      buildAttributeResult({
        key: 'connector',
        label: 'Konnektör tipi',
        value: connectorLabel ?? parsed.connectorToken,
        evidence: isCatalogFormat ? 'series_table' : 'code',
        confidence: isCatalogFormat ? 'high' : 'medium',
        requiresCatalogCheck: !isCatalogFormat || !connectorLabel,
        sourceToken: parsed.connectorToken,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  return results;
}
