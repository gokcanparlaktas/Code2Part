import { getVickersDG4VSpoolSemantics } from '@/domain/categories/hydraulicValve/manufacturers/vickers/vickersDG4VSemantics';
import { getYukenDSGSpoolSemantics } from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';

import {
  getCoilVoltageDisplay,
  getConnectorTypeDisplay,
  getManualOverrideDisplay,
  normalizeCoilVoltage,
  normalizeConnectorType,
  normalizeManualOverride,
  UNRESOLVED_VOLTAGE_CODES,
} from './normalizeHydraulicValveAttribute';

export type HydraulicAttributeDisplay = {
  displayValue: string;
  rawToken?: string;
  rawTokenLabel?: string;
  canonicalValue?: string | null;
  requiresCatalogCheck?: boolean;
  note?: string;
};

const VOLTAGE_TOKEN_DISPLAY: Record<string, string> = {
  G12: '12V DC',
  G24: '24V DC',
  EG24: '24V DC',
  CG24: '24V DC',
  HG24: '24V DC',
  D12: '12V DC',
  D24: '24V DC',
  D48: '48V DC',
  D110: '110V DC',
  H: '24V DC',
  '24DC': '24V DC',
  DC24: '24V DC',
  DC12: '12V DC',
  DC48: '48V DC',
};

const VOLTAGE_TOKEN_PRIORITY = [
  'HG24',
  'EG24',
  'CG24',
  'G24',
  'G12',
  'D110',
  'D48',
  'D24',
  'D12',
  'H',
  '24DC',
  'DC24',
  'DC12',
  'DC48',
] as const;

const CONNECTOR_TOKEN_DISPLAY: Record<string, string> = {
  K4: 'DIN EN 175301-803 konnektör',
  C4Z: 'AMP Junior-Timer konnektör',
  N: 'Fişli konnektör',
  N1: 'Fişli konnektör, gösterge ışıklı',
  U: 'ISO 4400 / DIN 43650',
};

const MANUAL_OVERRIDE_TOKEN_DISPLAY: Record<string, string> = {
  N9: 'Gizli / korumalı manuel kumanda',
};

const YUKEN_FUNCTION_DISPLAY: Record<string, string> = {};

const ATOS_FUNCTION_DISPLAY: Record<string, string> = {};

const VICKERS_FUNCTION_DISPLAY: Record<string, string> = {};

const SPOOL_BEHAVIOR_CATALOG_TR =
  'Çalışma davranışı katalog sembolünden doğrulanmalıdır.';

const ELECTRICAL_OPTION_DISPLAY: Record<string, string> = {
  M: 'Elektrik seçeneği M',
};

const ATOS_FUNCTION_NOTE_TR = 'Hidrolik sembol davranışı katalogdan doğrulanmalıdır.';
const VICKERS_VOLTAGE_NOTE_TR = 'Voltaj değeri katalogdan doğrulanmalıdır.';
const VICKERS_CONNECTOR_NOTE_TR = 'Tam bağlantı tipi katalogdan doğrulanmalıdır.';

function compactToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function rawTokenLabel(rawToken?: string): string | undefined {
  if (!rawToken) {
    return undefined;
  }
  return `Kod kanıtı: ${rawToken}`;
}

function normalizeManufacturer(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function extractVoltageToken(candidate?: string | null): string | null {
  if (!candidate) {
    return null;
  }
  const compact = compactToken(candidate);
  if (compact === 'H') {
    return 'H';
  }
  for (const token of VOLTAGE_TOKEN_PRIORITY) {
    if (compact === token) {
      return token;
    }
  }
  if (/^H?(G12|G24|EG24|CG24|HG24|D12|D24|D48|D110)$/.test(compact)) {
    const match = compact.match(/(G12|G24|EG24|CG24|HG24|D12|D24|D48|D110)/);
    return match?.[1] ?? null;
  }
  return null;
}

function isLikelyVoltageToken(token: string): boolean {
  return extractVoltageToken(token) !== null || UNRESOLVED_VOLTAGE_CODES.has(token);
}

export function normalizeHydraulicFunctionDisplay(options: {
  rawToken?: string | null;
  rawValue?: string | null;
  manufacturer?: string;
  series?: string;
  behaviorNoteTr?: string | null;
}): HydraulicAttributeDisplay | null {
  const token = compactToken(options.rawToken ?? options.rawValue ?? '');
  if (!token) {
    return null;
  }

  if (isLikelyVoltageToken(token)) {
    return null;
  }

  const manufacturer = normalizeManufacturer(options.manufacturer);
  const series = options.series?.trim().toUpperCase() ?? '';

  if (manufacturer.includes('yuken') || series.startsWith('DSG')) {
    const mapped = YUKEN_FUNCTION_DISPLAY[token];
    if (mapped) {
      return {
        displayValue: mapped,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
      };
    }
    if (getYukenDSGSpoolSemantics(token)) {
      return {
        displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
      };
    }
  }

  if (manufacturer.includes('atos') || series.startsWith('DHI') || series.startsWith('DHU')) {
    const mapped = ATOS_FUNCTION_DISPLAY[token];
    if (mapped) {
      return {
        displayValue: mapped,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: ATOS_FUNCTION_NOTE_TR,
      };
    }
    if (/^\d{4}$/.test(token)) {
      return {
        displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: ATOS_FUNCTION_NOTE_TR,
      };
    }
  }

  if (manufacturer.includes('vickers') || manufacturer.includes('eaton') || series.startsWith('DG4V')) {
    const mapped = VICKERS_FUNCTION_DISPLAY[token];
    if (mapped) {
      return {
        displayValue: mapped,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
      };
    }
    if (getVickersDG4VSpoolSemantics(token)) {
      return {
        displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
      };
    }
  }

  if (manufacturer.includes('rexroth') || series.startsWith('4WE')) {
    if (token.length === 1 || /^E[AB]$/.test(token)) {
      return {
        displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
        rawToken: token,
        rawTokenLabel: rawTokenLabel(token),
        requiresCatalogCheck: true,
        note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
      };
    }
  }

  if (options.behaviorNoteTr) {
    return {
      displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
      rawToken: token,
      rawTokenLabel: rawTokenLabel(token),
      requiresCatalogCheck: true,
      note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
    };
  }

  return {
    displayValue: SPOOL_BEHAVIOR_CATALOG_TR,
    rawToken: token,
    rawTokenLabel: rawTokenLabel(token),
    requiresCatalogCheck: true,
    note: 'Sürgü sembolü katalogdan doğrulanmalıdır.',
  };
}

export function normalizeHydraulicVoltageDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  manufacturer?: string;
}): HydraulicAttributeDisplay | null {
  const rawToken = options.rawToken ? compactToken(options.rawToken) : null;

  if (rawToken && UNRESOLVED_VOLTAGE_CODES.has(rawToken)) {
    return {
      displayValue: `Bobin kodu: ${rawToken}`,
      rawToken,
      rawTokenLabel: rawTokenLabel(rawToken),
      requiresCatalogCheck: true,
      note: VICKERS_VOLTAGE_NOTE_TR,
    };
  }

  const extractedToken = extractVoltageToken(rawToken) ?? extractVoltageToken(options.rawValue);
  if (extractedToken) {
    const display = VOLTAGE_TOKEN_DISPLAY[extractedToken] ?? getCoilVoltageDisplay(normalizeCoilVoltage({ rawToken: extractedToken }));
    return {
      displayValue: display,
      rawToken: extractedToken,
      rawTokenLabel: rawTokenLabel(extractedToken),
      canonicalValue: display,
      requiresCatalogCheck: false,
      note: extractedToken === 'H' ? VICKERS_VOLTAGE_NOTE_TR : undefined,
    };
  }

  const raw = options.rawValue?.trim();
  if (raw && /24\s*V\s*DC/i.test(raw)) {
    return {
      displayValue: '24V DC',
      rawToken: rawToken ?? undefined,
      rawTokenLabel: rawToken ? rawTokenLabel(rawToken) : undefined,
      canonicalValue: '24V DC',
      requiresCatalogCheck: false,
    };
  }

  if (raw && /12\s*V\s*DC/i.test(raw)) {
    return {
      displayValue: '12V DC',
      rawToken: rawToken ?? undefined,
      rawTokenLabel: rawToken ? rawTokenLabel(rawToken) : undefined,
      canonicalValue: '12V DC',
      requiresCatalogCheck: false,
    };
  }

  if (rawToken) {
    return {
      displayValue: `Bobin kodu: ${rawToken}`,
      rawToken,
      rawTokenLabel: rawTokenLabel(rawToken),
      requiresCatalogCheck: true,
      note: VICKERS_VOLTAGE_NOTE_TR,
    };
  }

  return null;
}

export function normalizeHydraulicConnectorDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
  manufacturer?: string;
  series?: string;
}): HydraulicAttributeDisplay | null {
  const token = compactToken(options.rawToken ?? options.rawValue ?? '');
  if (!token) {
    return null;
  }

  const mapped = CONNECTOR_TOKEN_DISPLAY[token];
  if (mapped) {
    const note =
      token === 'U'
        ? undefined
        : token === 'N' || token === 'N1'
          ? undefined
          : undefined;
    return {
      displayValue: mapped,
      rawToken: token,
      rawTokenLabel: rawTokenLabel(token),
      canonicalValue: getConnectorTypeDisplay(normalizeConnectorType({ rawToken: token })),
      requiresCatalogCheck: token === 'M',
      note,
    };
  }

  const canonical = getConnectorTypeDisplay(normalizeConnectorType({ rawValue: options.rawValue, rawToken: token }));
  if (canonical !== 'Bilinmiyor') {
    return {
      displayValue: canonical,
      rawToken: token,
      rawTokenLabel: rawTokenLabel(token),
      canonicalValue: canonical,
      requiresCatalogCheck: normalizeConnectorType({ rawToken: token }) === 'PLUG_IN_CONNECTOR',
      note:
        normalizeConnectorType({ rawToken: token }) === 'PLUG_IN_CONNECTOR'
          ? 'Konnektör tipi katalogdan doğrulanmalıdır.'
          : undefined,
    };
  }

  if (options.rawValue && /175301|DIN/i.test(String(options.rawValue))) {
    return {
      displayValue: String(options.rawValue),
      rawToken: token,
      rawTokenLabel: rawTokenLabel(token),
      requiresCatalogCheck: false,
    };
  }

  return {
    displayValue: `Konnektör / bobin seçeneği ${token}`,
    rawToken: token,
    rawTokenLabel: rawTokenLabel(token),
    requiresCatalogCheck: true,
    note: VICKERS_CONNECTOR_NOTE_TR,
  };
}

export function normalizeHydraulicManualOverrideDisplay(options: {
  rawValue?: string | null;
  rawToken?: string | null;
}): HydraulicAttributeDisplay | null {
  const token = compactToken(options.rawToken ?? '');
  const mapped = token ? MANUAL_OVERRIDE_TOKEN_DISPLAY[token] : null;
  if (mapped) {
    return {
      displayValue: mapped,
      rawToken: token,
      rawTokenLabel: rawTokenLabel(token),
      requiresCatalogCheck: false,
    };
  }

  const canonical = getManualOverrideDisplay(normalizeManualOverride(options));
  if (canonical !== 'Bilinmiyor') {
    return {
      displayValue: canonical,
      rawToken: token || undefined,
      rawTokenLabel: token ? rawTokenLabel(token) : undefined,
      requiresCatalogCheck: false,
    };
  }

  if (options.rawValue) {
    return {
      displayValue: String(options.rawValue),
      rawToken: token || undefined,
      rawTokenLabel: token ? rawTokenLabel(token) : undefined,
      requiresCatalogCheck: true,
    };
  }

  return null;
}

export function normalizeHydraulicElectricalOptionDisplay(options: {
  rawToken?: string | null;
}): HydraulicAttributeDisplay | null {
  const token = compactToken(options.rawToken ?? '');
  if (!token) {
    return null;
  }
  const mapped = ELECTRICAL_OPTION_DISPLAY[token];
  return {
    displayValue: mapped ?? `Elektrik seçeneği ${token}`,
    rawToken: token,
    rawTokenLabel: rawTokenLabel(token),
    requiresCatalogCheck: true,
    note: 'Elektrik seçeneği katalogdan doğrulanmalıdır.',
  };
}

export function formatHydraulicAttributeForUi(display: HydraulicAttributeDisplay): string {
  const lines = [display.displayValue];
  if (display.rawTokenLabel) {
    lines.push(display.rawTokenLabel);
  }
  if (display.note) {
    lines.push(display.note);
  }
  return lines.join('\n');
}
