import {
  getEatonSpoolCatalog,
  getRexrothSpoolCatalog,
  getYukenSpoolCatalog,
} from '@/domain/catalogData/loadCatalogData';
import type { CatalogPortState } from '@/domain/catalogData/types';
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
  vickersFunctionToken: string | null;
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

function isVickersFunctionRow(row: SpoolCatalogRow, manufacturer: 'rexroth' | 'yuken' | 'eaton'): boolean {
  if (manufacturer !== 'eaton') {
    return false;
  }
  const token = row.rawToken?.trim().toUpperCase() ?? '';
  return /^[0-9][A-Z]$/.test(token);
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
      vickersFunctionToken: isVickersFunctionRow(row, manufacturer) ? token : null,
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
  if (isVickersFunctionRow(row, manufacturer) && token) {
    existing.vickersFunctionToken = token;
  }
}

function ingestCatalog(
  map: Map<string, HydraulicCenterTypeOption>,
  rows: SpoolCatalogRow[] | undefined,
  manufacturer: 'rexroth' | 'yuken' | 'eaton'
): void {
  for (const row of rows ?? []) {
    if (row.attributeKey && row.attributeKey !== 'spool_symbol') {
      continue;
    }
    upsertOption(map, row, manufacturer);
  }
}

let cachedOptions: HydraulicCenterTypeOption[] | null = null;

/** Test-only: bust in-memory option cache after catalog ingest rule changes. */
export function clearHydraulicCenterTypeCatalogOptionsCache(): void {
  cachedOptions = null;
}

function ensureUniqueDisplayLabels(
  options: HydraulicCenterTypeOption[]
): HydraulicCenterTypeOption[] {
  const labelUseCount = new Map<string, number>();

  return options.map((option) => {
    const seen = labelUseCount.get(option.labelTr) ?? 0;
    labelUseCount.set(option.labelTr, seen + 1);
    if (seen === 0) {
      return option;
    }

    const hint =
      option.rexrothSpoolToken ??
      option.yukenFunctionToken ??
      option.vickersFunctionToken ??
      String(seen + 1);

    return {
      ...option,
      labelTr: `${option.labelTr} (${hint})`,
    };
  });
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

  cachedOptions = ensureUniqueDisplayLabels([...byPortStateId.values()]).sort((a, b) =>
    a.labelTr.localeCompare(b.labelTr, 'tr')
  );

  return cachedOptions;
}

export function getHydraulicCenterTypeOption(id: string): HydraulicCenterTypeOption | undefined {
  return buildHydraulicCenterTypeCatalogOptions().find((option) => option.id === id);
}

const YUKEN_DSG_ORDERING_FUNCTION_PATTERN = /^[0-9][CBD]\d{1,2}$/i;

function isYukenDsgOrderingFunctionToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && YUKEN_DSG_ORDERING_FUNCTION_PATTERN.test(token.trim()));
}

/** Rexroth WE sipariş sürgü harfi → aynı PTAB port durumuna sahip Yuken DSG fonksiyon kodu. */
export function resolveYukenFunctionTokenForRexrothSpool(
  rexrothSpoolToken: string
): string | null {
  const token = rexrothSpoolToken.trim().toUpperCase();
  const rexrothOption = buildHydraulicCenterTypeCatalogOptions().find(
    (entry) => entry.rexrothSpoolToken === token
  );
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

/** Yuken DSG fonksiyon kodu → aynı PTAB port durumuna sahip Rexroth WE sürgü harfi. */
export function resolveRexrothSpoolTokenForYukenFunction(
  yukenFunctionToken: string
): string | null {
  const token = yukenFunctionToken.trim().toUpperCase();
  const option = buildHydraulicCenterTypeCatalogOptions().find(
    (entry) => entry.yukenFunctionToken === token && entry.rexrothSpoolToken
  );
  return option?.rexrothSpoolToken ?? null;
}

export function hydraulicCenterTypeOptionsForCreator(): Array<{
  value: string;
  labelTr: string;
}> {
  return buildHydraulicCenterTypeCatalogOptions().map((option) => ({
    value: option.id,
    labelTr: option.labelTr,
  }));
}
