import { resolveHydraulicFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import {
  CENTER_CONDITION_LABEL_TR,
  CENTERING_LABEL_TR,
  HYDRAULIC_VALVE_BEHAVIOR_CATEGORY,
  type HydraulicValveBehaviorConfidence,
  type HydraulicValveBehaviorProfile,
  type HydraulicValveCenterCondition,
  type HydraulicValveCentering,
  type HydraulicValveNormallyState,
  type HydraulicValvePositions,
  UNRESOLVED_VOLTAGE_CODES,
} from './hydraulicValveBehaviorProfile';

type AttributeWithNormalized = TechnicalAttribute & {
  normalizedValue?: string | number | null;
  requiresCatalogCheck?: boolean;
};

function attrMap(attributes: TechnicalAttribute[]): Map<string, AttributeWithNormalized> {
  return new Map(attributes.map((a) => [a.key, a as AttributeWithNormalized]));
}

function readNormalizedString(
  map: Map<string, AttributeWithNormalized>,
  key: string
): string | undefined {
  const attr = map.get(key);
  if (!attr) {
    return undefined;
  }
  if (attr.normalizedValue !== undefined && attr.normalizedValue !== null) {
    return String(attr.normalizedValue);
  }
  if (attr.value === null || attr.value === undefined) {
    return undefined;
  }
  return String(attr.value);
}

function readDisplayString(
  map: Map<string, AttributeWithNormalized>,
  key: string
): string | undefined {
  const attr = map.get(key);
  if (!attr || attr.value === null) {
    return undefined;
  }
  const unit = attr.unit ? ` ${attr.unit}` : '';
  return `${attr.value}${unit}`;
}

function readPositions(map: Map<string, AttributeWithNormalized>): HydraulicValvePositions {
  const raw = map.get('number_of_positions')?.value ?? map.get('number_of_positions')?.normalizedValue;
  if (raw === 2 || raw === '2') {
    return 2;
  }
  if (raw === 3 || raw === '3') {
    return 3;
  }
  return 'unknown';
}

function parseCenterCondition(value: string | undefined): HydraulicValveCenterCondition {
  if (!value) {
    return 'unknown';
  }
  const normalized = value.trim().toLowerCase();
  const allowed: HydraulicValveCenterCondition[] = [
    'closed_center',
    'open_center',
    'tandem_center',
    'float_center',
    'partially_open',
    'not_applicable',
    'unknown',
  ];
  if (allowed.includes(normalized as HydraulicValveCenterCondition)) {
    return normalized as HydraulicValveCenterCondition;
  }
  return 'unknown';
}

function parseCentering(value: string | undefined): HydraulicValveCentering {
  if (!value) {
    return 'unknown';
  }
  const normalized = value.trim().toLowerCase();
  const allowed: HydraulicValveCentering[] = [
    'spring_centered',
    'spring_offset',
    'detented',
    'unknown',
  ];
  if (allowed.includes(normalized as HydraulicValveCentering)) {
    return normalized as HydraulicValveCentering;
  }
  return 'unknown';
}

function parseNormallyState(value: string | undefined): HydraulicValveNormallyState {
  if (!value) {
    return 'unknown';
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'normally_open' || normalized === 'normally_closed') {
    return normalized;
  }
  return 'unknown';
}

function parsePressureBar(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.match(/(\d+(?:\.\d+)?)\s*bar/i);
  return match ? Number(match[1]) : null;
}

function parseFlowLpm(map: Map<string, AttributeWithNormalized>): number | null {
  const attr = map.get('max_flow');
  if (!attr || attr.value === null) {
    return null;
  }
  if (typeof attr.value === 'number') {
    return attr.value;
  }
  const match = String(attr.value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function worstConfidence(
  current: HydraulicValveBehaviorConfidence,
  next: HydraulicValveBehaviorConfidence
): HydraulicValveBehaviorConfidence {
  const rank: Record<HydraulicValveBehaviorConfidence, number> = {
    high: 4,
    medium: 3,
    low: 2,
    unknown: 1,
  };
  return rank[next] < rank[current] ? next : current;
}

function enrichFromBehaviorTable(
  profile: HydraulicValveBehaviorProfile,
  attributes: TechnicalAttribute[]
): void {
  if (!profile.brand || !profile.series || !profile.manufacturerFunctionCode) {
    return;
  }

  const behavior = resolveHydraulicFunctionBehavior({
    manufacturer: profile.brand,
    series: profile.series,
    token: profile.manufacturerFunctionCode,
  });

  if (!behavior) {
    return;
  }

  if (profile.positions === 'unknown' && behavior.positions) {
    profile.positions = behavior.positions;
  }
  if (profile.centering === 'unknown' && behavior.centering) {
    profile.centering = behavior.centering;
  }
  if (profile.centerCondition === 'unknown' && behavior.centerCondition) {
    profile.centerCondition = behavior.centerCondition;
  }
  if (profile.normallyState === 'unknown' && behavior.normallyState) {
    profile.normallyState = behavior.normallyState;
  }

  profile.confidence = worstConfidence(profile.confidence, behavior.confidence);
  if (behavior.requiresCatalogCheck) {
    profile.requiresCatalogCheck = true;
  }
  if (behavior.note) {
    profile.notes.push(behavior.note);
  }
}

export interface BuildHydraulicValveBehaviorProfileOptions {
  identification: ProductIdentification;
  attributes: TechnicalAttribute[];
}

/** Minimal profile when only equivalent-series metadata is available. */
export function buildCandidateFallbackBehaviorProfile(
  candidate: {
    brand: string;
    series: string;
    standardFamily: string;
  }
): HydraulicValveBehaviorProfile {
  return {
    productCategory: HYDRAULIC_VALVE_BEHAVIOR_CATEGORY,
    brand: candidate.brand,
    series: candidate.series,
    cetopNg: candidate.standardFamily,
    valveWays: 'unknown',
    positions: 'unknown',
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    voltage: null,
    voltageCode: null,
    connector: null,
    connectorCode: null,
    manualOverride: null,
    designSeries: null,
    maxPressureBar: null,
    maxFlowLpm: null,
    confidence: 'unknown',
    requiresCatalogCheck: true,
    notes: ['Muadil kod tanımlanamadı; katalogdan doğrulanmalıdır.'],
  };
}

export function buildHydraulicValveBehaviorProfile(
  options: BuildHydraulicValveBehaviorProfileOptions
): HydraulicValveBehaviorProfile {
  const { identification, attributes } = options;
  const map = attrMap(attributes);

  let confidence: HydraulicValveBehaviorConfidence = 'medium';
  let requiresCatalogCheck = false;
  const notes: string[] = [];

  for (const attr of attributes) {
    const a = attr as AttributeWithNormalized;
    confidence = worstConfidence(confidence, a.confidence ?? 'unknown');
    if (a.requiresCatalogCheck) {
      requiresCatalogCheck = true;
      if (a.note) {
        notes.push(a.note);
      }
    }
  }

  const brand =
    readDisplayString(map, 'manufacturer') ?? String(identification.brand.value ?? '');
  const series =
    readDisplayString(map, 'series') ?? String(identification.series.value ?? '');

  const cetopNg =
    readDisplayString(map, 'cetop_ng') ??
    (identification.cetopNgSize?.value
      ? String(identification.cetopNgSize.value)
      : String(identification.standardFamily.value ?? ''));

  const manufacturerFunctionCode =
    readDisplayString(map, 'function_token') ??
    readDisplayString(map, 'spool_function_code') ??
    readDisplayString(map, 'spool_symbol');

  const voltageCode =
    readDisplayString(map, 'coil_voltage_code') ??
    map.get('voltage')?.sourceToken ??
    undefined;

  let voltage: string | null =
    readDisplayString(map, 'voltage') ?? null;
  if (voltageCode && UNRESOLVED_VOLTAGE_CODES.has(voltageCode)) {
    voltage = null;
    requiresCatalogCheck = true;
    notes.push('Bobin/voltaj kodu katalogdan doğrulanmalıdır.');
  }

  const connectorCode =
    readDisplayString(map, 'connector_token') ??
    readDisplayString(map, 'connector_option') ??
    undefined;
  const connector = readDisplayString(map, 'connector') ?? connectorCode ?? null;

  const profile: HydraulicValveBehaviorProfile = {
    productCategory: HYDRAULIC_VALVE_BEHAVIOR_CATEGORY,
    brand: brand || undefined,
    series: series || undefined,
    cetopNg: cetopNg || undefined,
    valveWays: 'unknown',
    positions: readPositions(map),
    centering: parseCentering(readNormalizedString(map, 'centering')),
    centerCondition: parseCenterCondition(readNormalizedString(map, 'center_condition')),
    normallyState: parseNormallyState(readNormalizedString(map, 'normally_state')),
    spoolSymbol: readDisplayString(map, 'spool_symbol'),
    spoolType: readDisplayString(map, 'spool_type'),
    manufacturerFunctionCode,
    voltage,
    voltageCode: voltageCode ?? null,
    connector,
    connectorCode: connectorCode ?? null,
    manualOverride: readDisplayString(map, 'manual_override') ?? null,
    designSeries:
      readDisplayString(map, 'design_number') ?? readDisplayString(map, 'component_series') ?? null,
    maxPressureBar: parsePressureBar(readDisplayString(map, 'max_pressure_abp')),
    maxFlowLpm: parseFlowLpm(map),
    confidence,
    requiresCatalogCheck,
    notes: [...new Set(notes)],
  };

  enrichFromBehaviorTable(profile, attributes);

  if (profile.centerCondition !== 'unknown') {
    profile.notes.push(
      `Merkez tipi (tahmini): ${CENTER_CONDITION_LABEL_TR[profile.centerCondition]}`
    );
  }
  if (profile.centering !== 'unknown') {
    profile.notes.push(`Yay düzeni (tahmini): ${CENTERING_LABEL_TR[profile.centering]}`);
  }

  return profile;
}
