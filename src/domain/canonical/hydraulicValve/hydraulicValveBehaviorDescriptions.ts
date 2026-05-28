import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';

import {
  buildHydraulicValveCanonicalProfile,
} from './buildHydraulicValveCanonicalProfile';
import {
  getCenterConditionDisplay,
  getCenteringDisplay,
  getMountingStandardDisplay,
} from './normalizeHydraulicValveAttribute';
import type {
  CanonicalConfidence,
  HydraulicValveCanonicalProfile,
  HydraulicValveWaysPositions,
} from './hydraulicValveCanonicalTypes';
import {
  normalizeHydraulicConnectorDisplay,
  normalizeHydraulicManualOverrideDisplay,
  normalizeHydraulicVoltageDisplay,
} from './hydraulicValveAttributeDisplay';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';

export type HydraulicBehaviorDescription = {
  title: string;
  primaryDescription: string;
  details: string[];
  rawCode?: string;
  confidence: CanonicalConfidence;
  requiresCatalogCheck: boolean;
};

const CATALOG_WAYS_TR = 'Katalogdan doğrulanmalı';
const CATALOG_CENTERING_TR = 'Katalogdan doğrulanmalı';
const CATALOG_CENTER_CONDITION_TR = 'Katalog sembolünden doğrulanmalı';
export const CATALOG_SPOOL_BEHAVIOR_TR =
  'Çalışma davranışı katalog sembolünden doğrulanmalıdır.';
const CATALOG_CONNECTOR_TR = 'Katalogdan doğrulanmalı';

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

function readToken(map: Map<string, AttributeWithNormalized>, key: string): string | undefined {
  const attr = map.get(key);
  return attr?.sourceToken ?? (attr?.value != null ? String(attr.value) : undefined);
}

function rawCodeLabel(token?: string): string | undefined {
  return token ? `Kod kanıtı: ${token}` : undefined;
}

function confidenceFromAttr(
  attr: AttributeWithNormalized | undefined,
  fallback: CanonicalConfidence = 'unknown'
): CanonicalConfidence {
  return attr?.confidence ?? fallback;
}

function canShowVerifiedValue(options: {
  value: string | null | undefined;
  confidence: CanonicalConfidence;
  requiresCatalogCheck?: boolean;
}): boolean {
  if (!options.value || options.value === 'unknown') {
    return false;
  }
  return options.confidence === 'high' && !options.requiresCatalogCheck;
}

export function getWaysPositionsBehaviorText(
  waysPositions: HydraulicValveWaysPositions | null | undefined,
  options?: { positions?: number | null; inferFourWay?: boolean }
): string {
  if (!waysPositions || waysPositions === 'unknown') {
    if (options?.positions === 3 && options.inferFourWay) {
      return '4 yollu, 3 konumlu';
    }
    if (options?.positions === 3) {
      return '3 konumlu';
    }
    if (options?.positions === 2) {
      return '2 konumlu';
    }
    return CATALOG_WAYS_TR;
  }

  const [ways, positions] = waysPositions.split('_').map(Number);
  if (ways && positions) {
    return `${ways} yollu, ${positions} konumlu`;
  }
  return waysPositions.replace('_', '/');
}

export function formatBehaviorDescriptionForUi(description: HydraulicBehaviorDescription): string {
  const primary = description.primaryDescription;
  const details = (description.details ?? [])
    .filter(Boolean)
    .filter((line) => line !== primary)
    .filter((line) => !line.startsWith('Kod kanıtı:'));
  return [primary, ...details].filter(Boolean).join('\n');
}

function isVickersSpoolFunctionToken(token?: string | null): boolean {
  return Boolean(token?.trim().match(/^\d[A-Z]$/i));
}

function parseFunctionTokenParts(raw: string): { positions?: string; spring?: string; centerType?: string } {
  const token = raw.trim().toUpperCase();
  // Yuken style: 3C2, 3C12, 3C60 etc.
  const match = token.match(/^(\d)([A-Z])(\d+)$/);
  if (!match) {
    return {};
  }
  return { positions: match[1], spring: match[2], centerType: match[3] };
}

function describeMounting(profile: HydraulicValveCanonicalProfile): HydraulicBehaviorDescription | null {
  if (!profile.mountingStandard.value || profile.mountingStandard.value === 'unknown') {
    return null;
  }
  return {
    title: 'Montaj standardı',
    primaryDescription: getMountingStandardDisplay(profile.mountingStandard.value),
    details: profile.mountingStandard.rawValue
      ? [rawCodeLabel(String(profile.mountingStandard.rawValue))].filter(Boolean) as string[]
      : [],
    confidence: profile.mountingStandard.confidence,
    requiresCatalogCheck: Boolean(profile.mountingStandard.requiresCatalogCheck),
  };
}

function describeWaysFromProfile(
  profile: HydraulicValveCanonicalProfile,
  inferFourWay: boolean
): HydraulicBehaviorDescription {
  const positionsRaw = profile.waysPositions.rawValue;
  const positions =
    typeof positionsRaw === 'number'
      ? positionsRaw
      : typeof positionsRaw === 'string' && /^\d+$/.test(positionsRaw)
        ? Number(positionsRaw)
        : profile.waysPositions.value === '4_3'
          ? 3
          : null;

  const primaryDescription = getWaysPositionsBehaviorText(profile.waysPositions.value, {
    positions,
    inferFourWay,
  });
  const requiresCatalogCheck =
    profile.waysPositions.requiresCatalogCheck ||
    profile.waysPositions.value === 'unknown' ||
    primaryDescription === CATALOG_WAYS_TR;

  return {
    title: 'Yol / konum yapısı',
    primaryDescription,
    details: [
      ...(requiresCatalogCheck ? [CATALOG_WAYS_TR] : []),
      ...(profile.rawFunctionCode
        ? (() => {
            const parts = parseFunctionTokenParts(profile.rawFunctionCode);
            return parts.positions ? [rawCodeLabel(parts.positions)!] : [];
          })()
        : []),
    ],
    confidence: profile.waysPositions.confidence,
    requiresCatalogCheck,
  };
}

function describeCenteringFromProfile(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const centeringAttr = readAttr(map, 'centering');
  const isVickers = manufacturer.includes('vickers') || manufacturer.includes('eaton');

  if (isVickers) {
    return {
      title: 'Merkezleme',
      primaryDescription: CATALOG_CENTERING_TR,
      details: profile.rawFunctionCode ? [rawCodeLabel(profile.rawFunctionCode)].filter(Boolean) as string[] : [],
      rawCode: profile.rawFunctionCode,
      confidence: 'unknown',
      requiresCatalogCheck: true,
    };
  }

  const hasCentering =
    profile.centering.value && profile.centering.value !== 'unknown';

  if (hasCentering) {
    return {
      title: 'Merkezleme',
      primaryDescription: getCenteringDisplay(profile.centering.value),
      details: [
        ...(profile.centering.requiresCatalogCheck ? [CATALOG_CENTERING_TR] : []),
        ...(profile.rawFunctionCode
          ? (() => {
              const parts = parseFunctionTokenParts(profile.rawFunctionCode);
              return parts.spring ? [rawCodeLabel(parts.spring)!] : [];
            })()
          : []),
      ],
      confidence: profile.centering.confidence,
      requiresCatalogCheck: Boolean(profile.centering.requiresCatalogCheck),
    };
  }

  return {
    title: 'Merkezleme',
    primaryDescription: CATALOG_CENTERING_TR,
    details: [CATALOG_CENTERING_TR],
    confidence: profile.centering.confidence,
    requiresCatalogCheck: true,
  };
}

function describeCenterConditionFromProfile(
  profile: HydraulicValveCanonicalProfile
): HydraulicBehaviorDescription {
  const verified = canShowVerifiedValue({
    value: profile.centerCondition.value,
    confidence: profile.centerCondition.confidence,
    requiresCatalogCheck: profile.centerCondition.requiresCatalogCheck,
  });

  return {
    title: 'Merkez tipi',
    primaryDescription: verified
      ? getCenterConditionDisplay(profile.centerCondition.value)
      : CATALOG_CENTER_CONDITION_TR,
    details: [
      ...(verified ? [] : [CATALOG_CENTER_CONDITION_TR]),
      ...(profile.rawFunctionCode &&
      !isVickersSpoolFunctionToken(profile.rawFunctionCode)
        ? (() => {
            const parts = parseFunctionTokenParts(profile.rawFunctionCode);
            return parts.centerType ? [rawCodeLabel(parts.centerType)!] : [];
          })()
        : []),
    ],
    confidence: profile.centerCondition.confidence,
    requiresCatalogCheck: Boolean(profile.centerCondition.requiresCatalogCheck) || !verified,
  };
}

function describeSpoolSymbol(profile: HydraulicValveCanonicalProfile): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const token = profile.rawSpoolSymbol ?? profile.rawFunctionCode;
  if (!token) {
    return null;
  }
  const isRexroth = manufacturer.includes('rexroth') || series.startsWith('4WE');
  const isAtos = manufacturer.includes('atos') || series.startsWith('DHI') || series.startsWith('DHU');
  if (!isRexroth && !isAtos) {
    return null;
  }
  return {
    title: 'Sürgü sembolü',
    primaryDescription: CATALOG_CENTER_CONDITION_TR,
    details: [rawCodeLabel(String(token))].filter(Boolean) as string[],
    rawCode: String(token),
    confidence: 'unknown',
    requiresCatalogCheck: true,
  };
}

function describeCoilVoltage(
  profile: HydraulicValveCanonicalProfile
): HydraulicBehaviorDescription | null {
  const display = normalizeHydraulicVoltageDisplay({
    rawValue: profile.coilVoltage.rawValue ? String(profile.coilVoltage.rawValue) : null,
    rawToken: profile.coilVoltage.rawToken ?? profile.rawVoltageCode,
    manufacturer: profile.brand,
  });
  if (!display) {
    return null;
  }

  return {
    title: 'Bobin voltajı',
    primaryDescription: display.displayValue,
    details: [
      ...(display.rawTokenLabel ? [display.rawTokenLabel] : []),
      ...(display.note ? [display.note] : []),
    ],
    rawCode: display.rawToken,
    confidence: profile.coilVoltage.confidence,
    requiresCatalogCheck: Boolean(display.requiresCatalogCheck),
  };
}

function describeConnector(
  profile: HydraulicValveCanonicalProfile
): HydraulicBehaviorDescription | null {
  const token = profile.connectorType.rawToken ?? profile.rawConnectorCode;
  const display = normalizeHydraulicConnectorDisplay({
    rawValue: profile.connectorType.rawValue ? String(profile.connectorType.rawValue) : null,
    rawToken: token,
    manufacturer: profile.brand,
    series: profile.series,
  });
  if (!display) {
    return null;
  }

  return {
    title: 'Konnektör tipi',
    primaryDescription: display.displayValue,
    details: [
      ...(token ? [rawCodeLabel(String(token))].filter(Boolean) as string[] : []),
      ...(display.note ? [display.note] : []),
    ],
    rawCode: token,
    confidence: profile.connectorType.confidence,
    requiresCatalogCheck: Boolean(display.requiresCatalogCheck),
  };
}

function describeManualOverride(
  profile: HydraulicValveCanonicalProfile
): HydraulicBehaviorDescription | null {
  const display = normalizeHydraulicManualOverrideDisplay({
    rawValue: profile.manualOverride.rawValue ? String(profile.manualOverride.rawValue) : null,
    rawToken: profile.manualOverride.rawToken,
  });
  if (!display) {
    return null;
  }

  return {
    title: 'Manuel kumanda',
    primaryDescription: display.displayValue,
    details: display.rawTokenLabel ? [display.rawTokenLabel] : [],
    rawCode: display.rawToken,
    confidence: profile.manualOverride.confidence,
    requiresCatalogCheck: Boolean(display.requiresCatalogCheck),
  };
}

function describeComponentSeriesFromAttributes(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const isRexroth = manufacturer.includes('rexroth') || series.startsWith('4WE');
  if (!isRexroth) {
    return null;
  }

  const token = readToken(map, 'design_number');
  if (!token) {
    return null;
  }

  return {
    title: 'Komponent serisi',
    primaryDescription: String(token),
    details: [rawCodeLabel(String(token))].filter(Boolean) as string[],
    rawCode: String(token),
    confidence: confidenceFromAttr(readAttr(map, 'design_number'), 'medium'),
    requiresCatalogCheck: true,
  };
}

function describeElectricalOptionFromAttributes(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const isVickers = manufacturer.includes('vickers') || manufacturer.includes('eaton') || series.startsWith('DG4V');
  if (!isVickers) {
    return null;
  }
  const token = readToken(map, 'electrical_option');
  if (!token) {
    return null;
  }
  const upper = token.trim().toUpperCase();
  const display = upper === 'M' ? 'Elektriksel opsiyonlar / ek özellikler' : CATALOG_WAYS_TR;
  return {
    title: 'Elektrik seçeneği',
    primaryDescription: display,
    details: [rawCodeLabel(upper)!],
    rawCode: upper,
    confidence: confidenceFromAttr(readAttr(map, 'electrical_option'), 'medium'),
    requiresCatalogCheck: display === CATALOG_WAYS_TR,
  };
}

function describeVickersSpoolSpringFromAttributes(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const isVickers = manufacturer.includes('vickers') || manufacturer.includes('eaton') || series.startsWith('DG4V');
  if (!isVickers || !profile.rawFunctionCode) {
    return null;
  }
  const token = profile.rawFunctionCode.trim().toUpperCase();
  const match = token.match(/^(\d)([A-Z])$/);
  if (!match) {
    return null;
  }
  const spring = match[2];
  const springMeaning =
    spring === 'A'
      ? 'Yay ofsetli, uçtan uca'
      : spring === 'B'
        ? 'Yay ofsetli, uçtan merkeze'
        : spring === 'C'
          ? 'Yay merkezlemeli'
          : spring === 'N'
            ? 'Yaysız, kilitlemeli (detent)'
            : CATALOG_WAYS_TR;

  return {
    title: 'Sürgü / yay düzeni',
    primaryDescription: springMeaning,
    details: [rawCodeLabel(token)!],
    rawCode: token,
    confidence: confidenceFromAttr(
      readAttr(map, 'function_code') ?? readAttr(map, 'function_token'),
      'medium',
    ),
    requiresCatalogCheck: springMeaning === CATALOG_WAYS_TR,
  };
}

function describeVickersDesignNumberFromAttributes(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const isVickers = manufacturer.includes('vickers') || manufacturer.includes('eaton') || series.startsWith('DG4V');
  if (!isVickers) {
    return null;
  }
  const token = readToken(map, 'design_series') ?? readToken(map, 'design_number');
  if (!token) {
    return null;
  }
  const upper = token.trim().toUpperCase();
  const resolved = resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    manufacturer: profile.brand ?? undefined,
    series: profile.series ?? undefined,
    attributeKey: 'design_series',
    rawToken: upper,
  });
  const display = !isUnknownCanonical(resolved) ? resolved.displayValue : upper;
  return {
    title: 'Tasarım serisi',
    primaryDescription: display,
    details: [rawCodeLabel(upper)!],
    rawCode: upper,
    confidence: confidenceFromAttr(
      readAttr(map, 'design_series') ?? readAttr(map, 'design_number'),
      'medium',
    ),
    requiresCatalogCheck: isUnknownCanonical(resolved) || resolved.requiresCatalogCheck,
  };
}

function describeTankPressureRatingFromAttributes(
  profile: HydraulicValveCanonicalProfile,
  map: Map<string, AttributeWithNormalized>
): HydraulicBehaviorDescription | null {
  const manufacturer = profile.brand?.toLowerCase() ?? '';
  const series = profile.series?.toUpperCase() ?? '';
  const isVickers = manufacturer.includes('vickers') || manufacturer.includes('eaton') || series.startsWith('DG4V');
  if (!isVickers) {
    return null;
  }
  const token =
    readToken(map, 'tank_pressure_rating') ?? readToken(map, 'tank_pressure_rating_code');
  if (!token) {
    return null;
  }
  const upper = token.trim().toUpperCase();
  const ratingBar = upper === '4' ? 70 : upper === '5' ? 100 : upper === '6' ? 207 : upper === '7' ? 207 : null;
  return {
    title: 'Tank hattı basınç sınıfı',
    primaryDescription: ratingBar ? `${ratingBar} bar` : CATALOG_WAYS_TR,
    details: [rawCodeLabel(upper)!],
    rawCode: upper,
    confidence: confidenceFromAttr(
      readAttr(map, 'tank_pressure_rating') ?? readAttr(map, 'tank_pressure_rating_code'),
      'medium',
    ),
    requiresCatalogCheck: ratingBar === null,
  };
}

function inferFourWayFamily(manufacturer?: string, series?: string): boolean {
  const m = manufacturer?.toLowerCase() ?? '';
  const s = series?.toUpperCase() ?? '';
  return (
    m.includes('rexroth') ||
    s.startsWith('4WE') ||
    m.includes('yuken') ||
    s.startsWith('DSG') ||
    m.includes('vickers') ||
    s.startsWith('DG4V') ||
    m.includes('atos') ||
    s.startsWith('DHI') ||
    s.startsWith('DHU')
  );
}

export function buildHydraulicValveBehaviorDescriptions(options: {
  identification: ProductIdentification;
  attributes: TechnicalAttribute[];
}): HydraulicBehaviorDescription[] {
  const profile = buildHydraulicValveCanonicalProfile({
    identification: options.identification,
    attributes: options.attributes,
  });
  return buildHydraulicValveBehaviorDescriptionsFromProfile(profile, options.attributes);
}

export function buildHydraulicValveBehaviorDescriptionsFromProfile(
  profile: HydraulicValveCanonicalProfile,
  attributes: TechnicalAttribute[] = []
): HydraulicBehaviorDescription[] {
  const map = attrMap(attributes);
  const inferFourWay = inferFourWayFamily(profile.brand, profile.series);
  const descriptions: HydraulicBehaviorDescription[] = [];

  const mounting = describeMounting(profile);
  if (mounting) {
    descriptions.push(mounting);
  }

  const componentSeries = describeComponentSeriesFromAttributes(profile, map);
  if (componentSeries) {
    descriptions.push(componentSeries);
  }

  descriptions.push(describeWaysFromProfile(profile, inferFourWay));
  const spoolSymbol = describeSpoolSymbol(profile);
  if (spoolSymbol) {
    descriptions.push(spoolSymbol);
  }

  const vickersSpoolSpring = describeVickersSpoolSpringFromAttributes(profile, map);
  if (!vickersSpoolSpring) {
    descriptions.push(describeCenteringFromProfile(profile, map));
  }
  descriptions.push(describeCenterConditionFromProfile(profile));

  const voltage = describeCoilVoltage(profile);
  if (voltage) {
    descriptions.push(voltage);
  }

  const connector = describeConnector(profile);
  if (connector) {
    descriptions.push(connector);
  }

  const manual = describeManualOverride(profile);
  if (manual) {
    descriptions.push(manual);
  }

  if (vickersSpoolSpring) {
    descriptions.push(vickersSpoolSpring);
  }

  const electricalOption = describeElectricalOptionFromAttributes(profile, map);
  if (electricalOption) {
    descriptions.push(electricalOption);
  }

  const tankPressure = describeTankPressureRatingFromAttributes(profile, map);
  if (tankPressure) {
    descriptions.push(tankPressure);
  }

  const designNumber = describeVickersDesignNumberFromAttributes(profile, map);
  if (designNumber) {
    descriptions.push(designNumber);
  }

  return descriptions;
}

export function summarizeSpoolBehaviorForComparison(
  profile: HydraulicValveCanonicalProfile
): string {
  const inferFourWay = inferFourWayFamily(profile.brand, profile.series);
  const parts: string[] = [];

  const waysText = getWaysPositionsBehaviorText(profile.waysPositions.value, {
    inferFourWay,
    positions:
      profile.waysPositions.value === '4_3'
        ? 3
        : profile.waysPositions.value === '4_2'
          ? 2
          : null,
  });
  if (waysText !== CATALOG_WAYS_TR) {
    parts.push(waysText);
  }

  if (
    profile.centering.value &&
    profile.centering.value !== 'unknown' &&
    !profile.centering.requiresCatalogCheck
  ) {
    parts.push(getCenteringDisplay(profile.centering.value));
  }

  if (
    profile.centerCondition.value &&
    profile.centerCondition.value !== 'unknown' &&
    canShowVerifiedValue({
      value: profile.centerCondition.value,
      confidence: profile.centerCondition.confidence,
      requiresCatalogCheck: profile.centerCondition.requiresCatalogCheck,
    })
  ) {
    parts.push(getCenterConditionDisplay(profile.centerCondition.value));
  }

  if (parts.length === 0) {
    return CATALOG_SPOOL_BEHAVIOR_TR;
  }

  if (
    profile.centerCondition.requiresCatalogCheck ||
    profile.centering.requiresCatalogCheck ||
    profile.waysPositions.requiresCatalogCheck
  ) {
    return `${parts.join(', ')} (katalog sembolüyle doğrulanmalıdır)`;
  }

  return parts.join(', ');
}

export function buildHydraulicValveBehaviorDescriptionsFromIdentification(
  identification: ProductIdentification
): HydraulicBehaviorDescription[] {
  return buildHydraulicValveBehaviorDescriptions({
    identification,
    attributes: getTechnicalAttributes(identification),
  });
}

function parsePositionsFromProfile(profile: HydraulicValveCanonicalProfile): number | null {
  const positionsRaw = profile.waysPositions.rawValue;
  if (typeof positionsRaw === 'number') {
    return positionsRaw;
  }
  if (typeof positionsRaw === 'string' && /^\d+$/.test(positionsRaw)) {
    return Number(positionsRaw);
  }
  if (profile.waysPositions.value === '4_3') {
    return 3;
  }
  if (profile.waysPositions.value === '4_2') {
    return 2;
  }
  return null;
}

export function applyBehaviorDisplayToCanonicalProfile(
  profile: HydraulicValveCanonicalProfile,
  attributes: TechnicalAttribute[] = []
): void {
  const map = attrMap(attributes);
  const inferFourWay = inferFourWayFamily(profile.brand, profile.series);
  const positions = parsePositionsFromProfile(profile);

  profile.waysPositions.displayValue = getWaysPositionsBehaviorText(profile.waysPositions.value, {
    positions,
    inferFourWay,
  });

  profile.centering.displayValue = describeCenteringFromProfile(profile, map).primaryDescription;
  profile.centerCondition.displayValue =
    describeCenterConditionFromProfile(profile).primaryDescription;
}
