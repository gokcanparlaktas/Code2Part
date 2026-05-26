import type { AttributeComparison } from '@/types/compatibility';

import type { CanonicalValveFunctionId } from './canonicalValveFunctions';
import {
  HYDRAULIC_FUNCTION_ALIASES,
  type HydraulicFunctionAlias,
  type ValveFunctionMatchType,
} from './hydraulicFunctionAliases';

export interface CompareValveFunctionsResult {
  comparison: AttributeComparison;
  matchType: ValveFunctionMatchType;
  canonicalFunctionId: CanonicalValveFunctionId;
  requiresCatalogCheck: boolean;
  /** Check-item or caution text; never implies full compatibility across manufacturers. */
  statusMessageTr?: string;
}

function normalizeManufacturer(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSeries(value: string): string {
  return value.trim().toUpperCase();
}

function toSeriesFamily(series: string): string {
  if (series.startsWith('4WE6') || series.startsWith('4WE10') || series === '4WE6' || series === '4WE10') {
    return '4WE';
  }
  if (series.startsWith('DSG')) {
    return 'DSG';
  }
  if (series.startsWith('DG4V')) {
    return 'DG4V';
  }
  if (series === 'DHI' || series === 'DHU') {
    return 'DHI';
  }
  return series;
}

function findAlias(options: {
  manufacturer: string;
  series: string;
  token: string;
}): HydraulicFunctionAlias | null {
  const manufacturerKey = normalizeManufacturer(options.manufacturer);
  const seriesKey = toSeriesFamily(normalizeSeries(options.series));
  const tokenKey = options.token.trim().toUpperCase();

  const alias = HYDRAULIC_FUNCTION_ALIASES.find(
    (a) =>
      normalizeManufacturer(a.manufacturer) === manufacturerKey &&
      normalizeSeries(a.series) === seriesKey &&
      a.token.toUpperCase() === tokenKey
  );
  return alias ?? null;
}

function isVerifiedSameCanonical(
  sourceAlias: HydraulicFunctionAlias,
  targetAlias: HydraulicFunctionAlias
): boolean {
  return (
    sourceAlias.confidence === 'high' &&
    targetAlias.confidence === 'high' &&
    !sourceAlias.requiresCatalogCheck &&
    !targetAlias.requiresCatalogCheck
  );
}

function buildCautiousSimilarMessage(sourceToken: string, targetToken: string): string {
  return `Sürgü/fonksiyon tipi benzer olabilir: ${sourceToken} / ${targetToken}. Katalog sembolleriyle doğrulanmalıdır.`;
}

export function compareValveFunctions(options: {
  label: string;
  source: { manufacturer: string; series: string; token: string | null };
  target: { manufacturer: string; series: string; token: string | null };
}): CompareValveFunctionsResult {
  const sourceToken = options.source.token?.trim().toUpperCase() ?? null;
  const targetToken = options.target.token?.trim().toUpperCase() ?? null;

  const sourceDisplay = sourceToken ?? 'Doğrulanamadı';
  const targetDisplay = targetToken ?? 'Doğrulanamadı';

  if (!sourceToken || !targetToken) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      matchType: 'unknown',
      canonicalFunctionId: 'unknown',
      requiresCatalogCheck: true,
    };
  }

  if (sourceToken === targetToken) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      matchType: 'exact_token_match',
      canonicalFunctionId: 'unknown',
      requiresCatalogCheck: false,
      statusMessageTr: `Sürgü/fonksiyon kodu aynı: ${sourceToken}`,
    };
  }

  const sourceAlias = findAlias({
    manufacturer: options.source.manufacturer,
    series: options.source.series,
    token: sourceToken,
  });
  const targetAlias = findAlias({
    manufacturer: options.target.manufacturer,
    series: options.target.series,
    token: targetToken,
  });

  if (!sourceAlias || !targetAlias) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      matchType: 'unknown',
      canonicalFunctionId: 'unknown',
      requiresCatalogCheck: true,
    };
  }

  if (sourceAlias.canonicalFunctionId === 'unknown' || targetAlias.canonicalFunctionId === 'unknown') {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      matchType: 'unknown',
      canonicalFunctionId: 'unknown',
      requiresCatalogCheck: true,
    };
  }

  if (sourceAlias.canonicalFunctionId !== targetAlias.canonicalFunctionId) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'different',
      },
      matchType: 'different',
      canonicalFunctionId: 'unknown',
      requiresCatalogCheck: true,
      statusMessageTr:
        'Fonksiyon kodları farklı ailede görünüyor; katalog sembolleriyle doğrulanmalıdır.',
    };
  }

  if (isVerifiedSameCanonical(sourceAlias, targetAlias)) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      matchType: 'same_canonical_function',
      canonicalFunctionId: sourceAlias.canonicalFunctionId,
      requiresCatalogCheck: false,
    };
  }

  const matchType: ValveFunctionMatchType =
    sourceAlias.confidence === 'high' && targetAlias.confidence === 'high'
      ? 'same_canonical_function'
      : 'possible_same_family';

  return {
    comparison: {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    },
    matchType,
    canonicalFunctionId: sourceAlias.canonicalFunctionId,
    requiresCatalogCheck: true,
    statusMessageTr: buildCautiousSimilarMessage(sourceToken, targetToken),
  };
}
