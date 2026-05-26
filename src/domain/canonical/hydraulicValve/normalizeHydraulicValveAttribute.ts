import {
  CENTER_CONDITION_DICTIONARY,
  CENTERING_DICTIONARY,
  COIL_VOLTAGE_DICTIONARY,
  CONNECTOR_TYPE_DICTIONARY,
  MANUAL_OVERRIDE_DICTIONARY,
  MOUNTING_STANDARD_DICTIONARY,
  SEAL_MATERIAL_DICTIONARY,
  WAYS_POSITIONS_DICTIONARY,
  compactToken,
  getDictionaryLabelTr,
  getWaysPositionsDisplay,
  lookupCenterConditionAlias,
  lookupCenteringAlias,
  lookupCoilVoltageAlias,
  lookupConnectorTypeAlias,
  lookupManualOverrideAlias,
  lookupMountingStandardAlias,
  lookupSealMaterialAlias,
  lookupWaysPositionsAlias,
} from './hydraulicValveCanonicalDictionary';
import type {
  CanonicalCoilVoltage,
  CanonicalConfidence,
  CanonicalConnectorType,
  CanonicalField,
  CanonicalImportance,
  CanonicalManualOverride,
  CanonicalSealMaterial,
  HydraulicCenterCondition,
  HydraulicCentering,
  HydraulicMountingStandard,
  HydraulicValveWaysPositions,
} from './hydraulicValveCanonicalTypes';
import type { EvidenceLevel } from '@/types/product';

export const UNRESOLVED_VOLTAGE_CODES = new Set(['H7', 'H6', 'H5']);

const VOLTAGE_DISPLAY_PATTERN =
  /^(?:(\d+)\s*V?\s*(DC|AC)|(?:DC|AC)\s*(\d+)\s*V?|(\d+)\s*(DC|AC))$/i;

function parseVoltageFromDisplay(raw: string): CanonicalCoilVoltage | null {
  const compact = raw.trim();
  const alias = lookupCoilVoltageAlias(compact);
  if (alias) {
    return alias;
  }

  const match = compact.match(VOLTAGE_DISPLAY_PATTERN);
  if (!match) {
    return null;
  }

  const volts = match[1] ?? match[3] ?? match[4];
  const kind = (match[2] ?? match[5] ?? '').toUpperCase();
  if (!volts || !kind) {
    return null;
  }

  const key = `${kind}_${volts}V` as CanonicalCoilVoltage;
  if (key in COIL_VOLTAGE_DICTIONARY) {
    return key;
  }
  return null;
}

export function normalizeCoilVoltage(options: {
  rawValue?: string | number | null;
  rawToken?: string | null;
}): CanonicalCoilVoltage {
  const token = options.rawToken?.trim();
  if (token) {
    if (UNRESOLVED_VOLTAGE_CODES.has(token)) {
      return 'unknown';
    }
    const fromToken = lookupCoilVoltageAlias(token);
    if (fromToken) {
      return fromToken;
    }
  }

  if (options.rawValue === null || options.rawValue === undefined) {
    return 'unknown';
  }

  const raw = String(options.rawValue).trim();
  if (!raw) {
    return 'unknown';
  }

  const fromDisplay = parseVoltageFromDisplay(raw);
  if (fromDisplay) {
    return fromDisplay;
  }

  const fromAlias = lookupCoilVoltageAlias(raw);
  return fromAlias ?? 'unknown';
}

export function normalizeConnectorType(options: {
  rawValue?: string | number | null;
  rawToken?: string | null;
}): CanonicalConnectorType {
  const token = options.rawToken?.trim();
  if (token) {
    const fromToken = lookupConnectorTypeAlias(token);
    if (fromToken) {
      return fromToken;
    }
  }

  if (options.rawValue === null || options.rawValue === undefined) {
    return 'unknown';
  }

  const raw = String(options.rawValue).trim();
  if (!raw) {
    return 'unknown';
  }

  const fromAlias = lookupConnectorTypeAlias(raw);
  if (fromAlias) {
    return fromAlias;
  }

  if (/DIN/i.test(raw) || /175301/i.test(raw) || /43650/i.test(raw)) {
    return 'DIN_43650_FORM_A_EN_175301_803';
  }

  return 'unknown';
}

export function normalizeMountingStandard(options: {
  rawValue?: string | number | null;
  rawToken?: string | null;
}): HydraulicMountingStandard {
  const candidates = [options.rawToken, options.rawValue]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value));

  for (const candidate of candidates) {
    const fromAlias = lookupMountingStandardAlias(candidate);
    if (fromAlias) {
      return fromAlias;
    }

    const compact = compactToken(candidate);
    if (compact.includes('NG6') || compact.includes('CETOP03') || compact.includes('D03')) {
      return 'ISO_4401_03_CETOP_03_NG6_NFPA_D03';
    }
    if (compact.includes('NG10') || compact.includes('CETOP05') || compact.includes('D05')) {
      return 'ISO_4401_05_CETOP_05_NG10_NFPA_D05';
    }
    if (compact.includes('NG16') || compact.includes('D07')) {
      return 'ISO_4401_07_NG16_NFPA_D07';
    }
    if (compact.includes('NG25') || compact.includes('D08')) {
      return 'ISO_4401_08_NG25_NFPA_D08';
    }
    if (compact.includes('NG32') || compact.includes('D10')) {
      return 'ISO_4401_10_NG32_NFPA_D10';
    }
  }

  return 'unknown';
}

export function normalizeWaysPositions(options: {
  rawValue?: string | number | null;
  rawToken?: string | null;
  valveWays?: number | null;
  positions?: number | null;
}): HydraulicValveWaysPositions {
  const candidates = [options.rawToken, options.rawValue]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value));

  for (const candidate of candidates) {
    const fromAlias = lookupWaysPositionsAlias(candidate);
    if (fromAlias) {
      return fromAlias;
    }
  }

  if (options.valveWays && options.positions) {
    const inferred = `${options.valveWays}_${options.positions}` as HydraulicValveWaysPositions;
    if (inferred in WAYS_POSITIONS_DICTIONARY) {
      return inferred;
    }
  }

  if (options.positions === 2) {
    return options.valveWays === 3 ? '3_2' : options.valveWays === 4 ? '4_2' : '2_2';
  }
  if (options.positions === 3) {
    return options.valveWays === 5 ? '5_3' : '4_3';
  }

  return 'unknown';
}

export function normalizeCenterCondition(rawValue?: string | null): HydraulicCenterCondition {
  if (!rawValue) {
    return 'unknown';
  }
  const normalized = rawValue.trim().toLowerCase();
  const allowed: HydraulicCenterCondition[] = [
    'closed_center',
    'open_center',
    'tandem_center',
    'float_center',
    'partially_open',
    'not_applicable',
    'unknown',
  ];
  if (allowed.includes(normalized as HydraulicCenterCondition)) {
    return normalized as HydraulicCenterCondition;
  }
  return lookupCenterConditionAlias(rawValue) ?? 'unknown';
}

export function normalizeCentering(rawValue?: string | null): HydraulicCentering {
  if (!rawValue) {
    return 'unknown';
  }
  const normalized = rawValue.trim().toLowerCase();
  const allowed: HydraulicCentering[] = [
    'spring_centered',
    'spring_offset',
    'detented',
    'manual_return',
    'unknown',
  ];
  if (allowed.includes(normalized as HydraulicCentering)) {
    return normalized as HydraulicCentering;
  }
  return lookupCenteringAlias(rawValue) ?? 'unknown';
}

export function normalizeManualOverride(options: {
  rawValue?: string | number | null;
  rawToken?: string | null;
}): CanonicalManualOverride {
  const token = options.rawToken?.trim();
  if (token) {
    const fromToken = lookupManualOverrideAlias(token);
    if (fromToken) {
      return fromToken;
    }
  }

  if (options.rawValue === null || options.rawValue === undefined) {
    return 'unknown';
  }

  const raw = String(options.rawValue).trim();
  if (!raw) {
    return 'unknown';
  }

  const lower = raw.toLowerCase();
  if (lower.includes('gizli') || lower.includes('concealed')) {
    return 'concealed_manual_override';
  }
  if (lower.includes('korum') || lower.includes('protected')) {
    return 'protected_manual_override';
  }
  if (lower.includes('detent')) {
    return 'detent_manual_override';
  }
  if (lower.includes('yok') || lower === 'none') {
    return 'none';
  }
  if (lower.includes('manuel')) {
    return 'manual_override';
  }

  return lookupManualOverrideAlias(raw) ?? 'unknown';
}

export function normalizeSealMaterial(rawValue?: string | null): CanonicalSealMaterial {
  if (!rawValue) {
    return 'unknown';
  }
  const upper = rawValue.trim().toUpperCase();
  if (upper.includes('NBR')) {
    return 'NBR';
  }
  if (upper.includes('FKM') || upper.includes('VITON')) {
    return 'FKM';
  }
  if (upper.includes('EPDM')) {
    return 'EPDM';
  }
  return lookupSealMaterialAlias(rawValue) ?? 'unknown';
}

export function buildCanonicalField<T extends string | number | null>(options: {
  key: string;
  label: string;
  value: T | null;
  dictionary?: Record<string, { labelTr: string; importance: CanonicalImportance }>;
  displayFormatter?: (value: T) => string;
  rawValue?: string | number | boolean | null;
  rawToken?: string;
  evidence: EvidenceLevel;
  confidence: CanonicalConfidence;
  requiresCatalogCheck?: boolean;
  importance: CanonicalImportance;
  notes?: string[];
}): CanonicalField<T> {
  const displayValue =
    options.value === null || options.value === undefined || options.value === 'unknown'
      ? 'Bilinmiyor'
      : options.displayFormatter
        ? options.displayFormatter(options.value)
        : options.dictionary
          ? getDictionaryLabelTr(options.dictionary, String(options.value))
          : String(options.value);

  return {
    key: options.key,
    label: options.label,
    value: options.value,
    displayValue,
    rawValue: options.rawValue,
    rawToken: options.rawToken,
    evidence: options.evidence,
    confidence: options.confidence,
    requiresCatalogCheck: options.requiresCatalogCheck,
    importance: options.importance,
    notes: options.notes,
  };
}

export function getCoilVoltageDisplay(value: CanonicalCoilVoltage | null): string {
  return getDictionaryLabelTr(COIL_VOLTAGE_DICTIONARY, value);
}

export function getConnectorTypeDisplay(value: CanonicalConnectorType | null): string {
  return getDictionaryLabelTr(CONNECTOR_TYPE_DICTIONARY, value);
}

export function getMountingStandardDisplay(value: HydraulicMountingStandard | null): string {
  return getDictionaryLabelTr(MOUNTING_STANDARD_DICTIONARY, value);
}

export function getCenterConditionDisplay(value: HydraulicCenterCondition | null): string {
  return getDictionaryLabelTr(CENTER_CONDITION_DICTIONARY, value);
}

export function getCenteringDisplay(value: HydraulicCentering | null): string {
  return getDictionaryLabelTr(CENTERING_DICTIONARY, value);
}

export function getManualOverrideDisplay(value: CanonicalManualOverride | null): string {
  return getDictionaryLabelTr(MANUAL_OVERRIDE_DICTIONARY, value);
}

export { getWaysPositionsDisplay };

export type HydraulicValveAttributeKey =
  | 'mountingStandard'
  | 'waysPositions'
  | 'centerCondition'
  | 'centering'
  | 'coilVoltage'
  | 'connectorType'
  | 'manualOverride'
  | 'sealMaterial';

export function normalizeHydraulicValveAttribute(
  key: HydraulicValveAttributeKey,
  options: {
    rawValue?: string | number | null;
    rawToken?: string | null;
    valveWays?: number | null;
    positions?: number | null;
  }
): string | null {
  switch (key) {
    case 'mountingStandard':
      return normalizeMountingStandard(options);
    case 'waysPositions':
      return normalizeWaysPositions(options);
    case 'centerCondition':
      return normalizeCenterCondition(options.rawValue ? String(options.rawValue) : null);
    case 'centering':
      return normalizeCentering(options.rawValue ? String(options.rawValue) : null);
    case 'coilVoltage':
      return normalizeCoilVoltage(options);
    case 'connectorType':
      return normalizeConnectorType(options);
    case 'manualOverride':
      return normalizeManualOverride(options);
    case 'sealMaterial':
      return normalizeSealMaterial(options.rawValue ? String(options.rawValue) : null);
    default:
      return null;
  }
}
