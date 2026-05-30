import { formatConnectorDisplayValue } from '@/domain/canonical/connector/formatConnectorDisplayValue';
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import {
  readFirstParserAttr,
  readFirstParserDisplay,
  readFirstParserToken,
} from '@/domain/canonical/readParserAttribute';
import { resolveHydraulicFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { FIELD_LABELS, SEAL_MATERIAL_DICTIONARY } from './hydraulicValveCanonicalDictionary';
import {
  normalizeHydraulicConnectorDisplay,
  normalizeHydraulicManualOverrideDisplay,
  normalizeHydraulicVoltageDisplay,
} from './hydraulicValveAttributeDisplay';
import {
  buildCanonicalField,
  getCenterConditionDisplay,
  getCenteringDisplay,
  getCoilVoltageDisplay,
  getConnectorTypeDisplay,
  getManualOverrideDisplay,
  getMountingStandardDisplay,
  getWaysPositionsDisplay,
  normalizeCenterCondition,
  normalizeCentering,
  normalizeCoilVoltage,
  normalizeConnectorType,
  normalizeManualOverride,
  normalizeMountingStandard,
  normalizeSealMaterial,
  normalizeWaysPositions,
  UNRESOLVED_VOLTAGE_CODES,
} from './normalizeHydraulicValveAttribute';
import { enrichHydraulicProfileFromCatalogData } from './catalogDataProfileBridge';
import { applyBehaviorDisplayToCanonicalProfile } from './hydraulicValveBehaviorDescriptions';
import type {
  CanonicalCoilVoltage,
  CanonicalConfidence,
  CanonicalConnectorType,
  CanonicalField,
  HydraulicValveCanonicalProfile,
} from './hydraulicValveCanonicalTypes';
import type { EvidenceLevel } from '@/types/product';

type AttributeWithNormalized = TechnicalAttribute & {
  normalizedValue?: string | number | null;
  requiresCatalogCheck?: boolean;
  sourceToken?: string;
};

function attrMap(attributes: TechnicalAttribute[]): Map<string, AttributeWithNormalized> {
  return new Map(attributes.map((a) => [a.key, a as AttributeWithNormalized]));
}

function readAttr(map: Map<string, AttributeWithNormalized>, key: string): AttributeWithNormalized | undefined {
  return map.get(key);
}

function readNormalizedString(map: Map<string, AttributeWithNormalized>, key: string): string | undefined {
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

function readDisplayString(map: Map<string, AttributeWithNormalized>, key: string): string | undefined {
  const attr = map.get(key);
  if (!attr || attr.value === null) {
    return undefined;
  }
  const unit = attr.unit ? ` ${attr.unit}` : '';
  return `${attr.value}${unit}`;
}

function readNumber(map: Map<string, AttributeWithNormalized>, key: string): number | null {
  const attr = map.get(key);
  if (!attr || attr.value === null) {
    return null;
  }
  if (typeof attr.value === 'number') {
    return attr.value;
  }
  const match = String(attr.value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function attrEvidence(attr: AttributeWithNormalized | undefined): EvidenceLevel {
  return attr?.evidence ?? 'unknown';
}

function attrConfidence(attr: AttributeWithNormalized | undefined): CanonicalConfidence {
  return attr?.confidence ?? 'unknown';
}

function worstConfidence(current: CanonicalConfidence, next: CanonicalConfidence): CanonicalConfidence {
  const rank: Record<CanonicalConfidence, number> = {
    high: 4,
    medium: 3,
    low: 2,
    unknown: 1,
  };
  return rank[next] < rank[current] ? next : current;
}

function parsePositions(map: Map<string, AttributeWithNormalized>): number | null {
  const raw = map.get('number_of_positions')?.value ?? map.get('number_of_positions')?.normalizedValue;
  if (raw === 2 || raw === '2') {
    return 2;
  }
  if (raw === 3 || raw === '3') {
    return 3;
  }
  return null;
}

function parseValveWays(map: Map<string, AttributeWithNormalized>): number | null {
  const raw = map.get('valve_ways')?.value ?? map.get('valve_ways')?.normalizedValue;
  if (typeof raw === 'number') {
    return raw;
  }
  if (raw === '4' || raw === 4) {
    return 4;
  }
  if (raw === '3' || raw === 3) {
    return 3;
  }
  if (raw === '5' || raw === 5) {
    return 5;
  }
  if (raw === '2' || raw === 2) {
    return 2;
  }
  return null;
}

export interface BuildHydraulicValveCanonicalProfileOptions {
  identification: ProductIdentification;
  attributes: TechnicalAttribute[];
}

export function buildCandidateFallbackCanonicalProfile(candidate: {
  brand: string;
  series: string;
  standardFamily: string;
}): HydraulicValveCanonicalProfile {
  const mounting = normalizeMountingStandard({ rawValue: candidate.standardFamily });

  return {
    productCategory: 'hydraulic_valve',
    brand: candidate.brand,
    series: candidate.series,
    mountingStandard: buildCanonicalField({
      key: 'mountingStandard',
      label: FIELD_LABELS.mountingStandard,
      value: mounting,
      displayFormatter: getMountingStandardDisplay,
      rawValue: candidate.standardFamily,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      importance: 'critical',
    }),
    waysPositions: buildCanonicalField({
      key: 'waysPositions',
      label: FIELD_LABELS.waysPositions,
      value: 'unknown',
      displayFormatter: getWaysPositionsDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'critical',
    }),
    centerCondition: buildCanonicalField({
      key: 'centerCondition',
      label: FIELD_LABELS.centerCondition,
      value: 'unknown',
      displayFormatter: getCenterConditionDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'critical',
    }),
    centering: buildCanonicalField({
      key: 'centering',
      label: FIELD_LABELS.centering,
      value: 'unknown',
      displayFormatter: getCenteringDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'critical',
    }),
    coilVoltage: buildCanonicalField({
      key: 'coilVoltage',
      label: FIELD_LABELS.coilVoltage,
      value: 'unknown',
      displayFormatter: getCoilVoltageDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'critical',
    }),
    connectorType: buildCanonicalField({
      key: 'connectorType',
      label: FIELD_LABELS.connectorType,
      value: 'unknown',
      displayFormatter: getConnectorTypeDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'important',
    }),
    manualOverride: buildCanonicalField({
      key: 'manualOverride',
      label: FIELD_LABELS.manualOverride,
      value: 'unknown',
      displayFormatter: getManualOverrideDisplay,
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      importance: 'important',
    }),
    notes: ['Muadil kod tanımlanamadı; katalogdan doğrulanmalıdır.'],
  };
}

export function buildHydraulicValveCanonicalProfile(
  options: BuildHydraulicValveCanonicalProfileOptions
): HydraulicValveCanonicalProfile {
  const { identification, attributes } = options;
  const map = attrMap(attributes);

  let confidence: CanonicalConfidence = 'medium';
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

  const brand = readDisplayString(map, 'manufacturer') ?? String(identification.brand.value ?? '');
  const series = readDisplayString(map, 'series') ?? String(identification.series.value ?? '');

  const cetopAttr = readAttr(map, 'cetop_ng');
  const cetopRaw =
    readDisplayString(map, 'cetop_ng') ??
    (identification.cetopNgSize?.value ? String(identification.cetopNgSize.value) : undefined) ??
    String(identification.standardFamily.value ?? '');

  const mountingStandard = normalizeMountingStandard({ rawValue: cetopRaw });

  const positions = parsePositions(map);
  const valveWays = parseValveWays(map);
  const waysPositions = normalizeWaysPositions({
    valveWays,
    positions,
    rawValue: positions && valveWays ? `${valveWays}/${positions}` : undefined,
  });

  let centerCondition = normalizeCenterCondition(readNormalizedString(map, 'center_condition'));
  let centering = normalizeCentering(readNormalizedString(map, 'centering'));

  const rawFunctionCode =
    readFirstParserDisplay(map, ['function_code', 'function_token', 'spool_function_code']) ??
    readDisplayString(map, 'spool_symbol');
  const rawSpoolSymbol = readDisplayString(map, 'spool_symbol');

  const coilRatingAttr = readFirstParserAttr(map, ['coil_rating', 'voltage']);
  const rawVoltageCode =
    readFirstParserToken(map, ['coil_rating', 'coil_voltage_code']) ??
    coilRatingAttr?.sourceToken ??
    undefined;

  if (rawVoltageCode && UNRESOLVED_VOLTAGE_CODES.has(rawVoltageCode)) {
    requiresCatalogCheck = true;
    notes.push('Bobin/voltaj kodu katalogdan doğrulanmalıdır.');
  }

  const resolvedCoil = rawVoltageCode
    ? resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: brand,
        series,
        attributeKey: 'coil_rating',
        rawToken: rawVoltageCode,
      })
    : null;

  const coilVoltage: CanonicalCoilVoltage =
    resolvedCoil && !isUnknownCanonical(resolvedCoil) && typeof resolvedCoil.canonicalValue === 'string'
      ? (resolvedCoil.canonicalValue as CanonicalCoilVoltage)
      : normalizeCoilVoltage({
          rawValue: readDisplayString(map, 'voltage'),
          rawToken: rawVoltageCode,
        });

  const connectorAttr = readFirstParserAttr(map, [
    'connector_type',
    'connector',
    'connector_token',
  ]);
  const rawConnectorCode =
    readFirstParserToken(map, ['connector_type', 'connector_token', 'connector_option']) ??
    connectorAttr?.sourceToken;

  const resolvedConnector = rawConnectorCode
    ? resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: brand,
        series,
        attributeKey: 'connector_type',
        rawToken: rawConnectorCode,
        evidence: connectorAttr?.evidence,
        confidence: connectorAttr?.confidence as CanonicalConfidence | undefined,
      })
    : null;

  const connectorType: CanonicalConnectorType =
    resolvedConnector && !isUnknownCanonical(resolvedConnector)
      ? (resolvedConnector.canonicalKey as CanonicalConnectorType)
      : normalizeConnectorType({
          rawValue: readDisplayString(map, 'connector') ?? readDisplayString(map, 'connector_option'),
          rawToken: rawConnectorCode,
          manufacturer: brand,
          series,
        });

  const manualOverrideAttr = readAttr(map, 'manual_override');
  const manualOverride = normalizeManualOverride({
    rawValue: readDisplayString(map, 'manual_override'),
    rawToken: manualOverrideAttr?.sourceToken,
  });

  const sealAttr = readAttr(map, 'seal_material');
  const sealMaterial = normalizeSealMaterial(readNormalizedString(map, 'seal_material'));

  const profile: HydraulicValveCanonicalProfile = {
    productCategory: 'hydraulic_valve',
    brand: brand || undefined,
    series: series || undefined,
    mountingStandard: buildCanonicalField({
      key: 'mountingStandard',
      label: FIELD_LABELS.mountingStandard,
      value: mountingStandard,
      displayFormatter: getMountingStandardDisplay,
      rawValue: cetopRaw,
      evidence: attrEvidence(cetopAttr),
      confidence: attrConfidence(cetopAttr),
      requiresCatalogCheck: cetopAttr?.requiresCatalogCheck,
      importance: 'critical',
    }),
    waysPositions: buildCanonicalField({
      key: 'waysPositions',
      label: FIELD_LABELS.waysPositions,
      value: waysPositions,
      displayFormatter: getWaysPositionsDisplay,
      rawValue: positions && valveWays ? `${valveWays}/${positions}` : positions ?? undefined,
      evidence: attrEvidence(readAttr(map, 'number_of_positions')),
      confidence: attrConfidence(readAttr(map, 'number_of_positions')),
      requiresCatalogCheck: readAttr(map, 'number_of_positions')?.requiresCatalogCheck,
      importance: 'critical',
    }),
    centerCondition: buildCanonicalField({
      key: 'centerCondition',
      label: FIELD_LABELS.centerCondition,
      value: centerCondition,
      displayFormatter: getCenterConditionDisplay,
      rawValue: readNormalizedString(map, 'center_condition'),
      evidence: attrEvidence(readAttr(map, 'center_condition')),
      confidence: attrConfidence(readAttr(map, 'center_condition')),
      requiresCatalogCheck: readAttr(map, 'center_condition')?.requiresCatalogCheck,
      importance: 'critical',
    }),
    centering: buildCanonicalField({
      key: 'centering',
      label: FIELD_LABELS.centering,
      value: centering,
      displayFormatter: getCenteringDisplay,
      rawValue: readNormalizedString(map, 'centering'),
      evidence: attrEvidence(readAttr(map, 'centering')),
      confidence: attrConfidence(readAttr(map, 'centering')),
      requiresCatalogCheck: readAttr(map, 'centering')?.requiresCatalogCheck,
      importance: 'critical',
    }),
    coilVoltage: buildCanonicalField({
      key: 'coilVoltage',
      label: FIELD_LABELS.coilVoltage,
      value: coilVoltage,
      displayFormatter: getCoilVoltageDisplay,
      rawValue: resolvedCoil?.displayValue ?? readDisplayString(map, 'voltage'),
      rawToken: rawVoltageCode,
      evidence: attrEvidence(coilRatingAttr),
      confidence:
        rawVoltageCode && UNRESOLVED_VOLTAGE_CODES.has(rawVoltageCode)
          ? 'unknown'
          : attrConfidence(coilRatingAttr),
      requiresCatalogCheck:
        Boolean(rawVoltageCode && UNRESOLVED_VOLTAGE_CODES.has(rawVoltageCode)) ||
        resolvedCoil?.requiresCatalogCheck ||
        coilRatingAttr?.requiresCatalogCheck,
      importance: 'critical',
    }),
    connectorType: (() => {
      const field = buildCanonicalField({
        key: 'connectorType',
        label: FIELD_LABELS.connectorType,
        value: connectorType,
        displayFormatter: getConnectorTypeDisplay,
        rawValue: readDisplayString(map, 'connector') ?? readDisplayString(map, 'connector_option'),
        rawToken: rawConnectorCode,
        evidence: attrEvidence(connectorAttr),
        confidence: attrConfidence(connectorAttr),
        requiresCatalogCheck:
          resolvedConnector?.requiresCatalogCheck ?? connectorAttr?.requiresCatalogCheck,
        importance: 'important',
      });
      if (resolvedConnector && !isUnknownCanonical(resolvedConnector)) {
        field.displayValue = formatConnectorDisplayValue(resolvedConnector);
        field.connectorFamilyKey = resolvedConnector.connectorFamilyKey;
        field.connectorStandardKey = resolvedConnector.connectorStandardKey;
        field.connectorOptions = resolvedConnector.connectorOptions;
        field.isGenericConnector = resolvedConnector.isGenericConnector;
        field.displayDetail = resolvedConnector.displayDetail;
      }
      return field;
    })(),
    manualOverride: buildCanonicalField({
      key: 'manualOverride',
      label: FIELD_LABELS.manualOverride,
      value: manualOverride,
      displayFormatter: getManualOverrideDisplay,
      rawValue: readDisplayString(map, 'manual_override'),
      rawToken: manualOverrideAttr?.sourceToken,
      evidence: attrEvidence(manualOverrideAttr),
      confidence: attrConfidence(manualOverrideAttr),
      requiresCatalogCheck: manualOverrideAttr?.requiresCatalogCheck,
      importance: 'important',
    }),
    maxPressureBar: buildCanonicalField({
      key: 'maxPressureBar',
      label: FIELD_LABELS.maxPressureBar,
      value: readNumber(map, 'max_pressure_abp'),
      evidence: attrEvidence(readAttr(map, 'max_pressure_abp')),
      confidence: attrConfidence(readAttr(map, 'max_pressure_abp')),
      requiresCatalogCheck: readAttr(map, 'max_pressure_abp')?.requiresCatalogCheck,
      importance: 'important',
    }),
    tankPortMaxPressureBar: buildCanonicalField({
      key: 'tankPortMaxPressureBar',
      label: 'Maks. basınç (T)',
      value: readNumber(map, 'max_pressure_port_t'),
      evidence: attrEvidence(readAttr(map, 'max_pressure_port_t')),
      confidence: attrConfidence(readAttr(map, 'max_pressure_port_t')),
      requiresCatalogCheck: readAttr(map, 'max_pressure_port_t')?.requiresCatalogCheck,
      importance: 'important',
    }),
    maxFlowLpm: buildCanonicalField({
      key: 'maxFlowLpm',
      label: FIELD_LABELS.maxFlowLpm,
      value: readNumber(map, 'max_flow'),
      evidence: attrEvidence(readAttr(map, 'max_flow')),
      confidence: attrConfidence(readAttr(map, 'max_flow')),
      requiresCatalogCheck: readAttr(map, 'max_flow')?.requiresCatalogCheck,
      importance: 'important',
    }),
    sealMaterial: buildCanonicalField({
      key: 'sealMaterial',
      label: FIELD_LABELS.sealMaterial,
      value: sealMaterial,
      dictionary: SEAL_MATERIAL_DICTIONARY,
      rawValue: readNormalizedString(map, 'seal_material'),
      evidence: attrEvidence(sealAttr),
      confidence: attrConfidence(sealAttr),
      requiresCatalogCheck: sealAttr?.requiresCatalogCheck,
      importance: 'optional',
    }),
    rawFunctionCode,
    rawSpoolSymbol,
    rawVoltageCode,
    rawConnectorCode,
    notes: [...new Set(notes)],
  };

  if (brand && series && rawFunctionCode) {
    const behavior = resolveHydraulicFunctionBehavior({
      manufacturer: brand,
      series,
      token: rawFunctionCode,
    });

    if (behavior) {
      if (profile.waysPositions.value === 'unknown' && behavior.positions) {
        profile.waysPositions.value = normalizeWaysPositions({
          valveWays: 4,
          positions: behavior.positions,
        });
        profile.waysPositions.displayValue = getWaysPositionsDisplay(profile.waysPositions.value);
      }
      if (profile.centering.value === 'unknown' && behavior.centering) {
        profile.centering.value = normalizeCentering(behavior.centering);
        profile.centering.displayValue = getCenteringDisplay(profile.centering.value);
      }
      if (profile.centerCondition.value === 'unknown' && behavior.centerCondition) {
        profile.centerCondition.value = normalizeCenterCondition(behavior.centerCondition);
        profile.centerCondition.displayValue = getCenterConditionDisplay(profile.centerCondition.value);
      }
      confidence = worstConfidence(confidence, behavior.confidence);
      if (behavior.requiresCatalogCheck) {
        requiresCatalogCheck = true;
      }
      if (behavior.note) {
        profile.notes.push(behavior.note);
      }
    }
  }

  profile.notes = [...new Set(profile.notes)];

  const voltageDisplay = normalizeHydraulicVoltageDisplay({
    rawValue: resolvedCoil?.displayValue ?? readDisplayString(map, 'voltage'),
    rawToken: rawVoltageCode,
    manufacturer: brand,
  });
  if (voltageDisplay) {
    profile.coilVoltage.displayValue = voltageDisplay.displayValue;
    if (voltageDisplay.requiresCatalogCheck) {
      profile.coilVoltage.requiresCatalogCheck = true;
    }
  }

  const manualDisplay = normalizeHydraulicManualOverrideDisplay({
    rawValue: readDisplayString(map, 'manual_override'),
    rawToken: manualOverrideAttr?.sourceToken,
  });
  if (manualDisplay) {
    profile.manualOverride.displayValue = manualDisplay.displayValue;
    if (manualDisplay.requiresCatalogCheck) {
      profile.manualOverride.requiresCatalogCheck = true;
    }
  }

  applyBehaviorDisplayToCanonicalProfile(profile, attributes);

  return enrichHydraulicProfileFromCatalogData(profile, options.identification);
}

export function buildHydraulicValveCanonicalProfileFromCandidate(options: {
  identification: ProductIdentification | null;
  candidate?: EquivalentCandidate;
  attributes?: TechnicalAttribute[];
}): HydraulicValveCanonicalProfile {
  if (options.identification && options.attributes) {
    return buildHydraulicValveCanonicalProfile({
      identification: options.identification,
      attributes: options.attributes,
    });
  }
  if (options.identification) {
    return buildHydraulicValveCanonicalProfile({
      identification: options.identification,
      attributes: options.attributes ?? [],
    });
  }
  if (options.candidate) {
    return buildCandidateFallbackCanonicalProfile(options.candidate);
  }
  throw new Error('identification or candidate required');
}
