import {
  getCanonicalCushioningDisplay,
  getCanonicalStandardFamilyDisplay,
  normalizeCushioningToken,
  normalizeStandardFamilyToken,
  type CanonicalCushioningType,
  type CanonicalStandardFamily,
} from './canonicalTechnicalMeanings';

import { getRexrothWE6SpoolSemantics, isRexrothWE6BaseSpoolSymbol } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';

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
  sourceManufacturer?: string;
  confidence: CanonicalDisplayConfidence;
  requiresCatalogCheck?: boolean;
}): NormalizedAttributeDisplay {
  return {
    canonicalKey: options.canonicalKey,
    canonicalValue: options.canonicalValue,
    displayValue: options.displayValue,
    rawToken: options.rawToken,
    rawTokenLabel: rawTokenLabel(options.rawToken),
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
  const candidate = options.rawToken ?? options.rawValue;
  if (!candidate) {
    return null;
  }

  const compact = compactToken(candidate);

  for (const token of VOLTAGE_TOKEN_PRIORITY) {
    if (compact === token || compact.includes(token)) {
      const display = VOLTAGE_TOKEN_MAP[token];
      return buildDisplay({
        canonicalKey: 'voltage',
        canonicalValue: display,
        displayValue: display,
        rawToken: token,
        sourceManufacturer: options.sourceManufacturer,
        confidence: 'high',
        requiresCatalogCheck: false,
      });
    }
  }

  if (/24\s*V\s*DC/i.test(candidate)) {
    return buildDisplay({
      canonicalKey: 'voltage',
      canonicalValue: '24V DC',
      displayValue: '24V DC',
      rawToken: compact !== '24VDC' ? candidate : undefined,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  if (/12\s*V\s*DC/i.test(candidate)) {
    return buildDisplay({
      canonicalKey: 'voltage',
      canonicalValue: '12V DC',
      displayValue: '12V DC',
      rawToken: compact !== '12VDC' ? candidate : undefined,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  if (/110\s*V/i.test(candidate)) {
    return buildDisplay({
      canonicalKey: 'voltage',
      canonicalValue: '110V DC',
      displayValue: '110V DC',
      rawToken: candidate,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'medium',
      requiresCatalogCheck: true,
    });
  }

  return buildDisplay({
    canonicalKey: 'voltage',
    canonicalValue: candidate,
    displayValue: candidate,
    rawToken: candidate,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'low',
    requiresCatalogCheck: true,
  });
}

export function normalizeConnectorDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  const candidate = options.rawToken ?? options.rawValue;
  if (!candidate) {
    return null;
  }

  const token = compactToken(candidate);
  const mapped = CONNECTOR_TOKEN_MAP[token];
  if (mapped) {
    return buildDisplay({
      canonicalKey: 'connector',
      canonicalValue: mapped,
      displayValue: mapped,
      rawToken: token,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  if (candidate.includes('175301') || candidate.includes('DIN EN')) {
    return buildDisplay({
      canonicalKey: 'connector',
      canonicalValue: 'DIN EN 175301-803',
      displayValue: 'DIN EN 175301-803',
      rawToken: token !== 'DINEN175301803' ? candidate : undefined,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  return buildDisplay({
    canonicalKey: 'connector',
    canonicalValue: candidate,
    displayValue: candidate,
    rawToken: token,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'medium',
    requiresCatalogCheck: true,
  });
}

export function normalizeManualOverrideDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  sourceManufacturer?: string;
}): NormalizedAttributeDisplay | null {
  const candidate = options.rawToken ?? options.rawValue;
  if (!candidate) {
    return null;
  }

  const token = compactToken(candidate);
  const mapped = MANUAL_OVERRIDE_TOKEN_MAP[token];
  if (mapped) {
    return buildDisplay({
      canonicalKey: 'manual_override',
      canonicalValue: mapped,
      displayValue: mapped,
      rawToken: token,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'high',
      requiresCatalogCheck: false,
    });
  }

  if (candidate.toLowerCase().includes('manuel')) {
    return buildDisplay({
      canonicalKey: 'manual_override',
      canonicalValue: candidate,
      displayValue: candidate,
      rawToken: token.length <= 4 ? token : undefined,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'medium',
      requiresCatalogCheck: false,
    });
  }

  return null;
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
}): NormalizedAttributeDisplay | null {
  if (!options.rawToken) {
    return null;
  }

  const token = options.rawToken.trim().toUpperCase();
  const base = token.length === 1 ? token : token.charAt(0);

  if (isRexrothWE6BaseSpoolSymbol(base)) {
    const semantics = getRexrothWE6SpoolSemantics(base as Parameters<typeof getRexrothWE6SpoolSemantics>[0]);
    const behaviorHint = semantics.behaviorNoteTr.split('.')[0];
    return buildDisplay({
      canonicalKey: 'spool_symbol',
      canonicalValue: base,
      displayValue: `Sürgü sembolü ${base} — ${behaviorHint}`,
      rawToken: token,
      sourceManufacturer: options.sourceManufacturer,
      confidence: 'medium',
      requiresCatalogCheck: true,
    });
  }

  const note = options.behaviorNoteTr ?? 'Temel davranış: katalog sembolüyle doğrulanmalı';
  return buildDisplay({
    canonicalKey: 'spool_symbol',
    canonicalValue: token,
    displayValue: `Sürgü sembolü: ${token} — ${note}`,
    rawToken: token,
    sourceManufacturer: options.sourceManufacturer,
    confidence: 'low',
    requiresCatalogCheck: true,
  });
}

export function normalizeCanonicalAttributeDisplay(options: {
  attributeKey: string;
  rawValue?: string | number | boolean | null;
  rawToken?: string | null;
  behaviorNoteTr?: string | null;
  sourceManufacturer?: string;
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
      });
    default:
      return null;
  }
}

export type { CanonicalCushioningType, CanonicalStandardFamily };
