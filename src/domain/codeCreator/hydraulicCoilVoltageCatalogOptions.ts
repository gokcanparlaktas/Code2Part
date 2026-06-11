import {
  getEatonDg4vConnectorVoltageCatalog,
  getRexrothConnectorVoltageCatalog,
  getYukenDsgConnectorVoltageCatalog,
} from '@/domain/catalogData/loadCatalogData';
import type { CodeCreatorFieldOption } from '@/types/productCodeCreator';

/** Unified UI / selection keys — not manufacturer ordering tokens. */
export type UnifiedCoilVoltageKey =
  | 'dc_12v'
  | 'dc_24v'
  | 'dc_48v'
  | 'dc_96v'
  | 'dc_110v'
  | 'dc_125v'
  | 'dc_205v'
  | 'dc_220v';

const UNIFIED_VOLTAGE_CATALOG: Record<
  UnifiedCoilVoltageKey,
  { labelTr: string; sortOrder: number }
> = {
  dc_12v: { labelTr: '12 V DC', sortOrder: 12 },
  dc_24v: { labelTr: '24 V DC', sortOrder: 24 },
  dc_48v: { labelTr: '48 V DC', sortOrder: 48 },
  dc_96v: { labelTr: '96 V DC', sortOrder: 96 },
  dc_110v: { labelTr: '110 V DC', sortOrder: 110 },
  dc_125v: { labelTr: '125 V DC', sortOrder: 125 },
  dc_205v: { labelTr: '205 V DC', sortOrder: 205 },
  dc_220v: { labelTr: '220 V DC', sortOrder: 220 },
};

const REXROTH_COIL_BY_UNIFIED: Record<UnifiedCoilVoltageKey, string> = {
  dc_12v: 'G12',
  dc_24v: 'EG24',
  dc_48v: 'G48',
  dc_96v: 'G96',
  dc_110v: 'G110',
  dc_125v: 'G125',
  dc_205v: 'G205',
  dc_220v: 'G220',
};

const YUKEN_COIL_BY_UNIFIED: Partial<Record<UnifiedCoilVoltageKey, string>> = {
  dc_12v: 'D12',
  dc_24v: 'D24',
  dc_48v: 'D48',
};

/** Parseable DG4V coil suffixes when catalog only lists shorthand (e.g. H → H7). */
const VICKERS_PARSEABLE_COIL_BY_UNIFIED: Partial<Record<UnifiedCoilVoltageKey, string>> = {
  dc_12v: 'D12',
  dc_24v: 'H7',
  dc_48v: 'D48',
};

const VICKERS_PARSEABLE_COIL_PATTERN = /^(?:H[4-7]|D12|D24|D48)$/;

function toParseableVickersCoilToken(
  unified: UnifiedCoilVoltageKey,
  catalogToken: string | undefined
): string | null {
  const upper = catalogToken?.trim().toUpperCase();
  if (upper === 'H' && unified === 'dc_24v') {
    return 'H7';
  }
  if (upper && VICKERS_PARSEABLE_COIL_PATTERN.test(upper)) {
    return upper;
  }
  return VICKERS_PARSEABLE_COIL_BY_UNIFIED[unified] ?? null;
}

function parseVoltsFromOrderingToken(token: string): number | null {
  const upper = token.trim().toUpperCase();
  const match = upper.match(/(\d{2,3})/);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

function unifiedKeyFromVolts(volts: number): UnifiedCoilVoltageKey | null {
  const entry = (
    Object.entries(UNIFIED_VOLTAGE_CATALOG) as Array<
      [UnifiedCoilVoltageKey, { labelTr: string; sortOrder: number }]
    >
  ).find(([, meta]) => meta.sortOrder === volts);
  return entry?.[0] ?? null;
}

export function unifiedKeyFromOrderingToken(token: string): UnifiedCoilVoltageKey | null {
  const upper = token.trim().toUpperCase();
  if (upper === 'H' || upper === 'H7') {
    return 'dc_24v';
  }
  const volts = parseVoltsFromOrderingToken(upper);
  if (volts === null) {
    return null;
  }
  return unifiedKeyFromVolts(volts);
}

function rankVickersVoltageToken(token: string, unified: UnifiedCoilVoltageKey): number {
  const upper = token.trim().toUpperCase();
  if (unified === 'dc_24v' && upper === 'H7') {
    return 10;
  }
  if (unified === 'dc_24v' && upper === 'H') {
    return 8;
  }
  if (unified === 'dc_24v' && upper === 'D24') {
    return 6;
  }
  return upper.length;
}

function buildVickersCoilByUnifiedFromCatalog(): Partial<Record<UnifiedCoilVoltageKey, string>> {
  const ranked = new Map<UnifiedCoilVoltageKey, { token: string; score: number }>();
  const catalog = getEatonDg4vConnectorVoltageCatalog();

  for (const entry of catalog.voltageTokenMeanings ?? []) {
    const rawToken = entry.rawVoltageToken?.trim().toUpperCase();
    if (!rawToken) {
      continue;
    }

    const dcUsage = entry.contextualUsages?.find((usage) => usage.voltage != null) ?? null;
    const voltageValue = entry.voltage ?? dcUsage?.voltage;
    const voltageKind = entry.baseVoltageKind ?? entry.voltageKind;
    if (voltageKind !== 'DC' || voltageValue == null) {
      continue;
    }

    const unified = unifiedKeyFromVolts(voltageValue);
    if (!unified) {
      continue;
    }

    const score = rankVickersVoltageToken(rawToken, unified);
    const current = ranked.get(unified);
    if (!current || score > current.score) {
      ranked.set(unified, { token: rawToken, score });
    }
  }

  const map: Partial<Record<UnifiedCoilVoltageKey, string>> = {};
  for (const [key, value] of ranked.entries()) {
    map[key] = value.token;
  }
  return map;
}

let cachedVickersCoilByUnified: Partial<Record<UnifiedCoilVoltageKey, string>> | null = null;

function getVickersCoilByUnified(): Partial<Record<UnifiedCoilVoltageKey, string>> {
  if (!cachedVickersCoilByUnified) {
    const fromCatalog = buildVickersCoilByUnifiedFromCatalog();
    const merged: Partial<Record<UnifiedCoilVoltageKey, string>> = {};
    for (const key of Object.keys(UNIFIED_VOLTAGE_CATALOG) as UnifiedCoilVoltageKey[]) {
      const token = toParseableVickersCoilToken(key, fromCatalog[key]);
      if (token) {
        merged[key] = token;
      }
    }
    cachedVickersCoilByUnified = merged;
  }
  return cachedVickersCoilByUnified;
}

/** Clears cached Eaton-derived Vickers coil map (tests). */
export function clearVickersCoilByUnifiedCache(): void {
  cachedVickersCoilByUnified = null;
}

function collectOrderingTokensFromCatalogs(): string[] {
  const tokens = new Set<string>();

  const rexroth = getRexrothConnectorVoltageCatalog();
  for (const entry of rexroth.entries ?? []) {
    if (entry.voltageType !== 'DC') {
      continue;
    }
    if (entry.rawConnectorToken !== 'K4' && entry.rawConnectorToken !== 'K4K') {
      continue;
    }
    for (const token of entry.availableVoltageTokens ?? []) {
      tokens.add(token.toUpperCase());
    }
  }

  const yuken = getYukenDsgConnectorVoltageCatalog();
  for (const entry of yuken.voltageTokenMeanings ?? []) {
    if (entry.voltageKind !== 'DC' || !entry.rawVoltageToken) {
      continue;
    }
    tokens.add(entry.rawVoltageToken.toUpperCase());
  }

  const eaton = getEatonDg4vConnectorVoltageCatalog();
  for (const entry of eaton.voltageTokenMeanings ?? []) {
    if (!entry.rawVoltageToken) {
      continue;
    }
    tokens.add(entry.rawVoltageToken.toUpperCase());
  }

  return [...tokens];
}

export function buildHydraulicCoilVoltageOptions(): CodeCreatorFieldOption[] {
  const keys = new Set<UnifiedCoilVoltageKey>();

  for (const token of collectOrderingTokensFromCatalogs()) {
    const key = unifiedKeyFromOrderingToken(token);
    if (key) {
      keys.add(key);
    }
  }

  if (keys.size === 0) {
    keys.add('dc_12v');
    keys.add('dc_24v');
    keys.add('dc_48v');
  }

  keys.add('dc_24v');

  return [...keys]
    .sort((a, b) => UNIFIED_VOLTAGE_CATALOG[a].sortOrder - UNIFIED_VOLTAGE_CATALOG[b].sortOrder)
    .map((key) => ({
      value: key,
      labelTr: UNIFIED_VOLTAGE_CATALOG[key].labelTr,
    }));
}

export function isUnifiedCoilVoltageKey(value: string): value is UnifiedCoilVoltageKey {
  return value in UNIFIED_VOLTAGE_CATALOG;
}

export function mapUnifiedCoilToRexroth(selection: string | null): string | null {
  if (!selection) {
    return null;
  }
  if (isUnifiedCoilVoltageKey(selection)) {
    return REXROTH_COIL_BY_UNIFIED[selection];
  }
  return mapLegacyOrderingTokenToRexroth(selection);
}

export function mapUnifiedCoilToYuken(selection: string | null): string | null {
  if (!selection) {
    return null;
  }
  if (isUnifiedCoilVoltageKey(selection)) {
    return YUKEN_COIL_BY_UNIFIED[selection] ?? null;
  }
  const upper = selection.toUpperCase();
  if (upper === 'EG24' || upper === 'G24') {
    return 'D24';
  }
  if (upper === 'G12') {
    return 'D12';
  }
  if (upper === 'G48') {
    return 'D48';
  }
  if (/^D\d+$/.test(upper)) {
    return upper;
  }
  return null;
}

export function mapUnifiedCoilToVickers(selection: string | null): string | null {
  if (!selection) {
    return null;
  }
  if (isUnifiedCoilVoltageKey(selection)) {
    return getVickersCoilByUnified()[selection] ?? null;
  }
  const unified = unifiedKeyFromOrderingToken(selection);
  if (unified) {
    return getVickersCoilByUnified()[unified] ?? null;
  }
  return null;
}

/** @deprecated Use mapUnifiedCoilToRexroth */
export function mapCreatorCoilToRexroth(token: string | null): string | null {
  return mapUnifiedCoilToRexroth(token);
}

/** @deprecated Use mapUnifiedCoilToYuken */
export function mapCreatorCoilToYuken(token: string | null): string | null {
  return mapUnifiedCoilToYuken(token);
}

function mapLegacyOrderingTokenToRexroth(token: string): string | null {
  const upper = token.toUpperCase();
  const unified = unifiedKeyFromOrderingToken(upper);
  if (unified) {
    return REXROTH_COIL_BY_UNIFIED[unified];
  }
  if (upper === 'HG24' || upper === 'CG24') {
    return upper;
  }
  if (/^G\d+$/.test(upper)) {
    return upper;
  }
  if (/^E?G\d+$/.test(upper)) {
    return upper.startsWith('E') ? upper : `E${upper}`;
  }
  return upper;
}
