import {
  getEatonSpoolCatalog,
  getRexrothSpoolCatalog,
  getYukenSpoolCatalog,
} from '@/domain/catalogData/loadCatalogData';
import type { CatalogPortState } from '@/domain/catalogData/types';
import {
  isRexrothWEOrderingSpoolSymbol,
  rexrothWE6OrderingSpoolTokenForEquivalent,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import {
  formatUnifiedCenterDisplay,
  portStateBehaviorSummary,
} from '@/domain/presentation/formatCenterTypeDisplay';

export interface HydraulicCenterTypeOption {
  /** Stable key (serialized port state). */
  id: string;
  labelTr: string;
  portState: CatalogPortState | null;
  centerCondition: string | null;
  rexrothSpoolToken: string | null;
  yukenFunctionToken: string | null;
  /** DG4V sipariş fonksiyon kodu (ör. 2A, 24A). */
  vickersFunctionToken: string | null;
  /** Eaton katalog sürgü tipi (ör. 2, 24, 6) — yay harfi ayrı eklenir. */
  vickersSpoolTypeToken: string | null;
}

type SpoolCatalogRow = {
  attributeKey?: string;
  rawToken?: string;
  sourceFamily?: string;
  nominalSize?: string;
  centerCondition?: string;
  portState?: {
    P?: string | null;
    T?: string | null;
    A?: string | null;
    B?: string | null;
  } | null;
};

function toPortState(row: SpoolCatalogRow): CatalogPortState | null {
  if (!row.portState?.P || !row.portState.T || !row.portState.A || !row.portState.B) {
    return null;
  }
  return {
    P: row.portState.P,
    T: row.portState.T,
    A: row.portState.A,
    B: row.portState.B,
  };
}

export function serializePortStateKey(portState: CatalogPortState): string {
  return JSON.stringify({
    P: portState.P,
    T: portState.T,
    A: portState.A,
    B: portState.B,
  });
}

function resolveCenterLabel(portState: CatalogPortState | null, centerCondition?: string): string {
  const unified = formatUnifiedCenterDisplay({
    portState,
    centerConditionValue: centerCondition ?? null,
  });
  if (unified) {
    return unified;
  }

  const portOnly = formatUnifiedCenterDisplay({
    portState,
    centerConditionValue: null,
  });
  if (portOnly) {
    return portOnly;
  }

  const summary = portState ? portStateBehaviorSummary(portState) : null;
  if (summary) {
    return summary;
  }

  return centerCondition?.trim() || 'Bilinmiyor';
}

function preferCenterLabel(
  current: string,
  portState: CatalogPortState,
  centerCondition: string | null | undefined
): string {
  const next = resolveCenterLabel(portState, centerCondition);
  if (current.includes('(') && !next.includes('(')) {
    return current;
  }
  if (next.length > current.length) {
    return next;
  }
  return current;
}

function isAllPortsBlocked(portState: CatalogPortState): boolean {
  return (
    portState.P === 'blocked' &&
    portState.T === 'blocked' &&
    portState.A === 'blocked' &&
    portState.B === 'blocked'
  );
}

/** Creator/UI: skip only rows that cannot be labeled with a clear PTAB summary. */
function isUsableCenterTypeOptionForCreator(option: HydraulicCenterTypeOption): boolean {
  return canonicalCreatorLabel(option) !== null;
}

function isPreferredRexrothWe6Row(row: SpoolCatalogRow, portState: CatalogPortState): boolean {
  const family = row.sourceFamily?.trim().toUpperCase();
  const token = row.rawToken?.trim().toUpperCase() ?? '';
  if (family !== 'WE6' || String(row.nominalSize ?? '') !== '6') {
    return false;
  }
  if (isAllPortsBlocked(portState) && token === 'E') {
    return true;
  }
  return token.length === 1 && !token.endsWith('73');
}

function isPreferredYukenDsgRow(row: SpoolCatalogRow): boolean {
  const token = row.rawToken?.trim().toUpperCase() ?? '';
  return /^[0-9][CBD]\d{1,2}$/.test(token);
}

function isSupportedSpoolCatalogRow(
  row: SpoolCatalogRow,
  manufacturer: 'rexroth' | 'yuken' | 'eaton'
): boolean {
  if (!row.attributeKey) {
    return true;
  }
  if (manufacturer === 'eaton') {
    return row.attributeKey === 'spool_type' || row.attributeKey === 'spool_symbol';
  }
  return row.attributeKey === 'spool_symbol';
}

function isVickersOrderingFunctionToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && /^\d{1,3}[ABCD]$/i.test(token.trim()));
}

function isEatonSpoolTypeToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && /^\d{1,3}$/.test(token.trim()));
}

export function formatVickersOrderingFunctionCode(
  spoolType: string,
  springCode: 'A' | 'B' | 'C' | 'D' = 'A'
): string {
  return `${spoolType.trim()}${springCode.toUpperCase()}`;
}

function parseVickersSpringLetter(
  functionToken: string | null | undefined
): 'A' | 'B' | 'C' | 'D' | null {
  const token = functionToken?.trim().toUpperCase();
  if (!token || !isVickersOrderingFunctionToken(token)) {
    return null;
  }
  const spring = token.slice(-1);
  if (spring === 'A' || spring === 'B' || spring === 'C' || spring === 'D') {
    return spring;
  }
  return null;
}

function pickVickersSpringFromCatalogOptions(
  samePortOptions: HydraulicCenterTypeOption[],
  rexrothSpoolToken: string
): 'A' | 'B' | 'C' | 'D' {
  const springs = samePortOptions
    .map((option) => parseVickersSpringLetter(option.vickersFunctionToken))
    .filter((spring): spring is 'A' | 'B' | 'C' | 'D' => spring !== null);

  const token = rexrothSpoolToken.trim().toUpperCase();
  const preferred =
    token === 'J' ? 'B' : token === 'C' || token === 'C46' ? 'C' : 'A';

  if (springs.includes(preferred)) {
    return preferred;
  }

  return springs[0] ?? preferred;
}

function pickPreferredEatonSpoolType(tokens: string[]): string | null {
  const ranked = [...tokens]
    .map((token) => token.trim())
    .filter(Boolean)
    .sort((a, b) => a.length - b.length || a.localeCompare(b, 'en'));
  return ranked[0] ?? null;
}

function upsertOption(
  map: Map<string, HydraulicCenterTypeOption>,
  row: SpoolCatalogRow,
  manufacturer: 'rexroth' | 'yuken' | 'eaton'
): void {
  const portState = toPortState(row);
  if (!portState) {
    return;
  }

  const id = serializePortStateKey(portState);
  const token = row.rawToken?.trim().toUpperCase() ?? null;

  const existing = map.get(id);
  if (!existing) {
    map.set(id, {
      id,
      labelTr: resolveCenterLabel(portState, row.centerCondition),
      portState,
      centerCondition: row.centerCondition ?? null,
      rexrothSpoolToken: manufacturer === 'rexroth' ? token : null,
      yukenFunctionToken: manufacturer === 'yuken' ? token : null,
      vickersFunctionToken:
        manufacturer === 'eaton' && isVickersOrderingFunctionToken(token) ? token : null,
      vickersSpoolTypeToken:
        manufacturer === 'eaton' && isEatonSpoolTypeToken(token) ? token : null,
    });
    return;
  }

  existing.labelTr = preferCenterLabel(
    existing.labelTr,
    portState,
    row.centerCondition ?? existing.centerCondition
  );

  if (manufacturer === 'rexroth' && token) {
    if (
      !existing.rexrothSpoolToken ||
      isPreferredRexrothWe6Row(row, portState) ||
      (isAllPortsBlocked(portState) && token === 'E')
    ) {
      existing.rexrothSpoolToken = token;
    }
  }
  if (manufacturer === 'yuken' && token) {
    const nextIsOrdering = isPreferredYukenDsgRow(row);
    const currentIsOrdering = isYukenDsgOrderingFunctionToken(existing.yukenFunctionToken);
    if (
      !existing.yukenFunctionToken ||
      (nextIsOrdering && !currentIsOrdering) ||
      (nextIsOrdering && isPreferredYukenDsgRow(row))
    ) {
      existing.yukenFunctionToken = token;
    }
  }
  if (manufacturer === 'eaton' && token) {
    if (isVickersOrderingFunctionToken(token)) {
      existing.vickersFunctionToken = token;
    } else if (isEatonSpoolTypeToken(token)) {
      const candidates = [existing.vickersSpoolTypeToken, token].filter(
        (entry): entry is string => Boolean(entry)
      );
      existing.vickersSpoolTypeToken = pickPreferredEatonSpoolType(candidates);
    }
  }
}

function ingestCatalog(
  map: Map<string, HydraulicCenterTypeOption>,
  rows: SpoolCatalogRow[] | undefined,
  manufacturer: 'rexroth' | 'yuken' | 'eaton'
): void {
  for (const row of rows ?? []) {
    if (!isSupportedSpoolCatalogRow(row, manufacturer)) {
      continue;
    }
    upsertOption(map, row, manufacturer);
  }
}

let cachedOptions: HydraulicCenterTypeOption[] | null = null;
let cachedCreatorOptions: HydraulicCenterTypeOption[] | null = null;

/** Test-only: bust in-memory option cache after catalog ingest rule changes. */
export function clearHydraulicCenterTypeCatalogOptionsCache(): void {
  cachedOptions = null;
  cachedCreatorOptions = null;
}

function canonicalCreatorLabel(option: HydraulicCenterTypeOption): string | null {
  if (!option.portState) {
    return null;
  }

  const label = formatUnifiedCenterDisplay({
    portState: option.portState,
    centerConditionValue: option.centerCondition,
  });

  if (!label || /Belirsiz/i.test(label)) {
    return null;
  }

  if (isPerPortOnlyCenterLabel(label)) {
    return null;
  }

  return label;
}

function isPerPortOnlyCenterLabel(label: string): boolean {
  return /^[PTAB] (?:Bağlı|Kapalı|Belirsiz)(?:, [PTAB] (?:Bağlı|Kapalı|Belirsiz)){3}$/.test(
    label
  );
}

function creatorOptionScore(option: HydraulicCenterTypeOption): number {
  let score = 0;

  if (option.centerCondition) {
    score += 4;
  }

  const rex = option.rexrothSpoolToken?.trim().toUpperCase() ?? '';
  if (rex.length === 1 && isRexrothWEOrderingSpoolSymbol(rex)) {
    score += 8;
  } else if (rex) {
    score += 2;
  }

  if (isYukenDsgOrderingFunctionToken(option.yukenFunctionToken)) {
    score += 4;
  } else if (option.yukenFunctionToken) {
    score += 1;
  }

  if (option.vickersFunctionToken) {
    score += 1;
  }

  const ports = [
    option.portState?.P,
    option.portState?.T,
    option.portState?.A,
    option.portState?.B,
  ];
  if (ports.every((state) => state === 'blocked' || /^connected_to_/i.test(state ?? ''))) {
    score += 3;
  }

  return score;
}

function pickBestToken(
  group: HydraulicCenterTypeOption[],
  field:
    | 'rexrothSpoolToken'
    | 'yukenFunctionToken'
    | 'vickersFunctionToken'
    | 'vickersSpoolTypeToken',
  prefer: (token: string) => number
): string | null {
  const ranked = group
    .map((option) => option[field]?.trim().toUpperCase() ?? '')
    .filter(Boolean)
    .sort((a, b) => prefer(b) - prefer(a));

  return ranked[0] ?? null;
}

function mergeCenterTypeOptions(group: HydraulicCenterTypeOption[]): HydraulicCenterTypeOption {
  const sorted = [...group].sort((a, b) => creatorOptionScore(b) - creatorOptionScore(a));
  const primary = sorted[0]!;
  const labelTr = canonicalCreatorLabel(primary)!;

  return {
    ...primary,
    labelTr,
    centerCondition:
      group.find((option) => option.centerCondition)?.centerCondition ??
      primary.centerCondition,
    rexrothSpoolToken: pickBestToken(group, 'rexrothSpoolToken', (token) => {
      if (token === 'C46') {
        return 12;
      }
      if (token.length === 1 && isRexrothWEOrderingSpoolSymbol(token)) {
        return 10;
      }
      return token.length === 1 ? 5 : 1;
    }),
    yukenFunctionToken: pickBestToken(group, 'yukenFunctionToken', (token) =>
      isYukenDsgOrderingFunctionToken(token) ? 10 : 1
    ),
    vickersFunctionToken: pickBestToken(group, 'vickersFunctionToken', () => 1),
    vickersSpoolTypeToken: pickBestToken(group, 'vickersSpoolTypeToken', (token) => -token.length),
  };
}

export function buildHydraulicCenterTypeCreatorOptions(): HydraulicCenterTypeOption[] {
  if (cachedCreatorOptions) {
    return cachedCreatorOptions;
  }

  const groups = new Map<string, HydraulicCenterTypeOption[]>();

  for (const option of buildHydraulicCenterTypeCatalogOptions()) {
    if (!isUsableCenterTypeOptionForCreator(option)) {
      continue;
    }

    const label = canonicalCreatorLabel(option);
    if (!label) {
      continue;
    }

    const group = groups.get(label) ?? [];
    group.push(option);
    groups.set(label, group);
  }

  cachedCreatorOptions = [...groups.values()]
    .map(mergeCenterTypeOptions)
    .sort((a, b) => a.labelTr.localeCompare(b.labelTr, 'tr'));

  return cachedCreatorOptions;
}

/** PTAB port özetine göre katalogdan türetilmiş merkez tipi seçenekleri (port durumuna göre tekilleştirilmiş). */
export function buildHydraulicCenterTypeCatalogOptions(): HydraulicCenterTypeOption[] {
  if (cachedOptions) {
    return cachedOptions;
  }

  const byPortStateId = new Map<string, HydraulicCenterTypeOption>();

  ingestCatalog(byPortStateId, getRexrothSpoolCatalog().spoolSymbolMeanings, 'rexroth');
  ingestCatalog(byPortStateId, getYukenSpoolCatalog().spoolSymbolMeanings, 'yuken');
  ingestCatalog(byPortStateId, getEatonSpoolCatalog().spoolSymbolMeanings, 'eaton');

  cachedOptions = [...byPortStateId.values()].sort((a, b) =>
    a.labelTr.localeCompare(b.labelTr, 'tr')
  );

  return cachedOptions;
}

export function getHydraulicCenterTypeOption(id: string): HydraulicCenterTypeOption | undefined {
  return (
    buildHydraulicCenterTypeCreatorOptions().find((option) => option.id === id) ??
    buildHydraulicCenterTypeCatalogOptions().find((option) => option.id === id)
  );
}

const YUKEN_DSG_ORDERING_FUNCTION_PATTERN = /^[0-9][CBD]\d{1,2}$/i;

function isYukenDsgOrderingFunctionToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && YUKEN_DSG_ORDERING_FUNCTION_PATTERN.test(token.trim()));
}

/** Rexroth WE sipariş sürgü harfi → aynı PTAB port durumuna sahip Yuken DSG fonksiyon kodu. */
export function resolveYukenFunctionTokenForRexrothSpool(
  rexrothSpoolToken: string
): string | null {
  const rexrothOption = findRexrothCenterTypeOption(rexrothSpoolToken);
  if (!rexrothOption?.portState) {
    return null;
  }

  const portKey = serializePortStateKey(rexrothOption.portState);
  const samePortOptions = buildHydraulicCenterTypeCatalogOptions().filter(
    (entry) =>
      entry.portState &&
      serializePortStateKey(entry.portState) === portKey &&
      entry.yukenFunctionToken
  );

  const orderingMatch = samePortOptions.find((entry) =>
    isYukenDsgOrderingFunctionToken(entry.yukenFunctionToken)
  );
  if (orderingMatch?.yukenFunctionToken) {
    return orderingMatch.yukenFunctionToken.toUpperCase();
  }

  return samePortOptions[0]?.yukenFunctionToken ?? null;
}

function findRexrothCenterTypeOption(rexrothSpoolToken: string): HydraulicCenterTypeOption | null {
  const token = rexrothSpoolToken.trim().toUpperCase();
  let rexrothOption = buildHydraulicCenterTypeCatalogOptions().find(
    (entry) => entry.rexrothSpoolToken === token
  );
  if (!rexrothOption && token === 'C') {
    rexrothOption = buildHydraulicCenterTypeCatalogOptions().find(
      (entry) => entry.rexrothSpoolToken === 'C46'
    );
  }
  return rexrothOption ?? null;
}

/** Rexroth WE sipariş sürgü harfi → aynı PTAB port durumuna sahip Vickers DG4V fonksiyon kodu. */
export function resolveVickersFunctionTokenForRexrothSpool(
  rexrothSpoolToken: string
): string | null {
  const rexrothOption = findRexrothCenterTypeOption(rexrothSpoolToken);
  if (!rexrothOption?.portState) {
    return null;
  }

  const portKey = serializePortStateKey(rexrothOption.portState);
  const samePortOptions = buildHydraulicCenterTypeCatalogOptions().filter(
    (entry) =>
      entry.portState &&
      serializePortStateKey(entry.portState) === portKey &&
      (entry.vickersFunctionToken || entry.vickersSpoolTypeToken)
  );

  const orderingMatch = samePortOptions.find((entry) =>
    isVickersOrderingFunctionToken(entry.vickersFunctionToken)
  );
  if (orderingMatch?.vickersFunctionToken) {
    return orderingMatch.vickersFunctionToken.toUpperCase();
  }

  const spoolTypeMatch = samePortOptions.find((entry) => entry.vickersSpoolTypeToken);
  if (spoolTypeMatch?.vickersSpoolTypeToken) {
    return formatVickersOrderingFunctionCode(
      spoolTypeMatch.vickersSpoolTypeToken,
      pickVickersSpringFromCatalogOptions(samePortOptions, rexrothSpoolToken)
    );
  }

  return null;
}

/** Yuken DSG fonksiyon kodu → aynı PTAB port durumuna sahip Rexroth WE sürgü harfi. */
export function resolveRexrothSpoolTokenForYukenFunction(
  yukenFunctionToken: string
): string | null {
  const token = yukenFunctionToken.trim().toUpperCase();
  const option = buildHydraulicCenterTypeCatalogOptions().find(
    (entry) => entry.yukenFunctionToken === token && entry.rexrothSpoolToken
  );
  if (option?.rexrothSpoolToken) {
    return rexrothWE6OrderingSpoolTokenForEquivalent(option.rexrothSpoolToken) ?? option.rexrothSpoolToken;
  }

  return null;
}

export function hydraulicCenterTypeOptionsForCreator(): Array<{
  value: string;
  labelTr: string;
}> {
  return buildHydraulicCenterTypeCreatorOptions().map((option) => ({
    value: option.id,
    labelTr: option.labelTr,
  }));
}
