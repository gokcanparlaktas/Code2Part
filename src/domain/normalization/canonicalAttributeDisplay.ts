import {
  normalizeHydraulicConnectorDisplay,
  normalizeHydraulicFunctionDisplay,
  normalizeHydraulicManualOverrideDisplay,
  normalizeHydraulicVoltageDisplay,
} from '@/domain/canonical/hydraulicValve/hydraulicValveAttributeDisplay';

import {
  getCanonicalCushioningDisplay,
  getCanonicalStandardFamilyDisplay,
  normalizeCushioningToken,
  normalizeStandardFamilyToken,
  type CanonicalCushioningType,
  type CanonicalStandardFamily,
} from './canonicalTechnicalMeanings';

import { getRexrothWE6SpoolSemantics, isRexrothWE6BaseSpoolSymbol } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';

const UNRESOLVED_COIL_VOLTAGE_CODES = new Set(['H7', 'H6', 'H5']);

export type CanonicalDisplayConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type NormalizedAttributeDisplay = {
  canonicalKey: string;
  canonicalValue: string | number | boolean | null;
  displayValue: string;
  rawToken?: string;
  rawTokenLabel?: string;
  sourceManufacturer?: string;
  confidence: CanonicalDisplayConfidence;
  requiresCatalogCheck?: boolean;
};

const VOLTAGE_TOKEN_MAP: Record<string, string> = {
  G12: '12V DC',
  G24: '24V DC',
  EG24: '24V DC',
  CG24: '24V DC',
  HG24: '24V DC',
  D24: '24V DC',
  '24DC': '24V DC',
  D110: '110V DC',
  D12: '12V DC',
};

const VOLTAGE_TOKEN_PRIORITY = [
  'EG24',
  'CG24',
  'HG24',
  'G24',
  'G12',
  'D110',
  'D24',
  'D12',
  '24DC',
] as const;

const CONNECTOR_TOKEN_MAP: Record<string, string> = {
  K4: 'DIN EN 175301-803',
  C4Z: 'AMP Junior-Timer',
};

const MANUAL_OVERRIDE_TOKEN_MAP: Record<string, string> = {
  N9: 'Gizli/korumalı manuel kumanda',
};

const CETOP_CANONICAL_DISPLAY: Record<string, string> = {
  cetop_ng6: 'CETOP 03 / NG6',
  iso_15552: 'ISO 15552',
};

function compactToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function rawTokenLabel(rawToken?: string): string | undefined {
  if (!rawToken) {
    return undefined;
  }
  return `Kod: ${rawToken}`;
}

function buildDisplay(options: {
  canonicalKey: string;
  canonicalValue: string | number | boolean | null;
  displayValue: string;
  rawToken?: string;
  rawTokenLabel?: string;
  sourceManufacturer?: string;
  confidence: CanonicalDisplayConfidence;
  requiresCatalogCheck?: boolean;
}): NormalizedAttributeDisplay {
  return {
    canonicalKey: options.canonicalKey,
    canonicalValue: options.canonicalValue,
    displayValue: options.displayValue,
    rawToken: options.rawToken,
    rawTokenLabel: options.rawTokenLabel ?? rawTokenLabel(options.rawToken),
    sourceManufacturer: options.sourceManufacturer,
    confidence: options.confidence,
    requiresCatalogCheck: options.requiresCatalogCheck,
  };
}

export function normalizeVoltageDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  const display = normalizeHydraulicVoltageDisplay({
    rawValue: options.rawValue,
    rawToken: options.rawToken,
    manufacturer: options.sourceManufacturer,
  });
  if (!display) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'voltage',
    canonicalValue: display.canonicalValue ?? display.displayValue,
    displayValue: display.displayValue,
    rawToken: display.rawToken,
    sourceManufacturer: options.sourceManufacturer,
    confidence: display.requiresCatalogCheck ? 'low' : 'high',
    requiresCatalogCheck: display.requiresCatalogCheck,
  });
}

export function normalizeConnectorDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  const display = normalizeHydraulicConnectorDisplay({
    rawValue: options.rawValue,
    rawToken: options.rawToken,
    manufacturer: options.sourceManufacturer,
  });
  if (!display) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'connector',
    canonicalValue: display.canonicalValue ?? display.displayValue,
    displayValue: display.displayValue,
    rawToken: display.rawToken,
    sourceManufacturer: options.sourceManufacturer,
    confidence: display.requiresCatalogCheck ? 'medium' : 'high',
    requiresCatalogCheck: display.requiresCatalogCheck,
  });
}

export function normalizeManualOverrideDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  const display = normalizeHydraulicManualOverrideDisplay({
    rawValue: options.rawValue,
    rawToken: options.rawToken,
  });
  if (!display) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'manual_override',
    canonicalValue: display.displayValue,
    displayValue: display.displayValue,
    rawToken: display.rawToken,
    rawTokenLabel: display.rawTokenLabel,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'high',
    requiresCatalogCheck: display.requiresCatalogCheck,
  });
}

export function normalizeCetopNgDisplay(options: {
  rawValue?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  if (!options.rawValue) {
    return null;
  }

  const compact = compactToken(options.rawValue);
  if (
    compact.includes('NG6') ||
    compact.includes('CETOP03') ||
    compact.includes('4WE6') ||
    compact === 'WE6'
  ) {
    return buildDisplay({
      canonicalKey: 'cetop_ng',
      canonicalValue: 'cetop_ng6',
      displayValue: CETOP_CANONICAL_DISPLAY.cetop_ng6,
      rawToken: options.rawValue,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  if (compact.includes('NG10') || compact.includes('CETOP05') || compact.includes('4WE10')) {
    return buildDisplay({
      canonicalKey: 'cetop_ng',
      canonicalValue: 'cetop_ng10',
      displayValue: 'CETOP 05 / NG10',
      rawToken: options.rawValue,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  return buildDisplay({
    canonicalKey: 'cetop_ng',
    canonicalValue: options.rawValue,
    displayValue: options.rawValue,
    rawToken: options.rawValue,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'medium',
    requiresCatalogCheck: true,
  });
}

export function normalizeStandardFamilyDisplay(options: {
  rawValue?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  if (!options.rawValue) {
    return null;
  }

  const canonical = normalizeStandardFamilyToken(options.rawValue);
  if (!canonical) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'standard_family',
    canonicalValue: canonical,
    displayValue: getCanonicalStandardFamilyDisplay(canonical),
    rawToken: options.rawValue,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'high',
    requiresCatalogCheck: false,
  });
}

export function normalizeCushioningDisplay(options: {
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  if (!options.rawToken) {
    return null;
  }

  const canonical = normalizeCushioningToken(options.rawToken);
  if (!canonical) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'cushioning_type',
    canonicalValue: canonical,
    displayValue: getCanonicalCushioningDisplay(canonical),
    rawToken: options.rawToken,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'high',
    requiresCatalogCheck: false,
  });
}

export function normalizeSpoolSymbolDisplay(options: {
  rawToken?: string | null;
  behaviorNoteTr?: string | null;
  sourceManufacturer?: string;
  sourceSeries?: string;
}): NormalizedAttributeDisplay | null {
  const display = normalizeHydraulicFunctionDisplay({
    rawToken: options.rawToken,
    manufacturer: options.sourceManufacturer,
    series: options.sourceSeries,
    behaviorNoteTr: options.behaviorNoteTr,
  });
  if (!display) {
    return null;
  }

  return buildDisplay({
    canonicalKey: 'spool_symbol',
    canonicalValue: display.rawToken ?? display.displayValue,
    displayValue: display.displayValue,
    rawToken: display.rawToken,
    sourceManufacturer: options.sourceManufacturer,
    confidence: display.requiresCatalogCheck ? 'medium' : 'high',
    requiresCatalogCheck: display.requiresCatalogCheck,
  });
}

export function normalizeCanonicalAttributeDisplay(options: {
  attributeKey: string;
  rawValue?: string | number | boolean | null;
  rawToken?: string | null;
  behaviorNoteTr?: string | null;
  sourceManufacturer?: string;
  sourceSeries?: string;
}): NormalizedAttributeDisplay | null {
  const rawString =
    options.rawValue === null || options.rawValue === undefined
      ? null
      : String(options.rawValue);

  switch (options.attributeKey) {
    case 'voltage':
    case 'voltageCode':
      return normalizeVoltageDisplay({
        rawValue: rawString,
        rawToken: options.rawToken ?? rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'connector':
    case 'connectorCode':
    case 'connectorTokenRaw':
      return normalizeConnectorDisplay({
        rawValue: rawString,
        rawToken: options.rawToken ?? rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'manualOverride':
      return normalizeManualOverrideDisplay({
        rawValue: rawString,
        rawToken: options.rawToken ?? rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'cetopNg':
      return normalizeCetopNgDisplay({
        rawValue: rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'standardFamily':
      return normalizeStandardFamilyDisplay({
        rawValue: rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'cushioning':
      return normalizeCushioningDisplay({
        rawToken: options.rawToken ?? rawString,
        sourceManufacturer: options.sourceManufacturer,
      });
    case 'spoolSymbol':
    case 'spoolFunctionCode':
      return normalizeSpoolSymbolDisplay({
        rawToken: options.rawToken ?? rawString,
        behaviorNoteTr: options.behaviorNoteTr,
        sourceManufacturer: options.sourceManufacturer,
        sourceSeries: options.sourceSeries,
      });
    default:
      return null;
  }
}

export type { CanonicalCushioningType, CanonicalStandardFamily };
