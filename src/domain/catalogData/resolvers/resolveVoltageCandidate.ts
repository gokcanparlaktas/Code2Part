import {
  getDefaultCatalogDataProvider,
  type CatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import type {
  CatalogResolvedCandidate,
  CatalogResolverContext,
  ProductResolverContext,
} from '@/domain/catalogData/types';

function notFound(context: CatalogResolverContext): CatalogResolvedCandidate {
  return {
    found: false,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    confidence: 'unknown',
    needsReview: true,
    evidence: 'catalog_data',
  };
}

function normalizeVoltageToken(raw: string): string {
  const upper = raw.trim().toUpperCase();
  const prefixed = upper.match(/^[ECH](G\d+)$/);
  if (prefixed) {
    return prefixed[1];
  }
  const hg = upper.match(/^H(G\d+)$/);
  if (hg) {
    return hg[1];
  }
  return upper;
}

function resolveRexrothVoltage(
  context: CatalogResolverContext,
  catalogProvider: CatalogDataProvider
): CatalogResolvedCandidate {
  const catalog = catalogProvider.getRexrothConnectorVoltageCatalog();
  const token = normalizeVoltageToken(context.rawToken);
  const entry = catalog.voltageTokenMeanings?.find(
    (row) => row.rawVoltageToken?.toUpperCase() === token
  );
  if (!entry) {
    return notFound(context);
  }
  const usage = entry.contextualUsages?.find((u) => u.voltageType === 'DC') ?? entry.contextualUsages?.[0];
  const displayCandidate = usage?.meaning ?? `${entry.baseVoltageValue} ${entry.unit} ${entry.baseVoltageKind}`;
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    displayCandidate,
    voltageKind: entry.baseVoltageKind,
    voltageValue: entry.baseVoltageValue,
    voltageUnit: entry.unit,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
    sourceStatus: entry.sourceStatus,
  };
}

function yukenVoltageEntryApplies(
  appliesToModelSeries: string[] | undefined,
  product: ProductResolverContext
): boolean {
  if (!appliesToModelSeries?.length) {
    return true;
  }
  const sourceFamily = product.sourceFamily.toUpperCase();
  const series = product.series.toUpperCase();
  const family = product.family.toUpperCase();
  return appliesToModelSeries.some((pattern) => {
    const p = pattern.toUpperCase();
    return (
      sourceFamily === p ||
      series === p ||
      family === p ||
      sourceFamily.startsWith(`${p}-`)
    );
  });
}

function resolveYukenVoltage(
  context: CatalogResolverContext,
  catalogProvider: CatalogDataProvider
): CatalogResolvedCandidate {
  const token = context.rawToken.trim().toUpperCase();
  const catalogs = [
    catalogProvider.getYukenDsgConnectorVoltageCatalog(),
    catalogProvider.getYukenDshgConnectorVoltageCatalog(),
  ];
  const entry = catalogs
    .flatMap((catalog) => catalog.voltageTokenMeanings ?? [])
    .find(
      (row) =>
        row.rawVoltageToken?.toUpperCase() === token &&
        yukenVoltageEntryApplies(row.appliesToModelSeries as string[] | undefined, context)
    );
  if (!entry) {
    return notFound(context);
  }
  const displayCandidate =
    entry.voltageKind === 'DC' && entry.voltage != null && entry.unit
      ? `${entry.voltage} ${entry.unit} ${entry.voltageKind}`
      : `${entry.rawVoltageToken}`;
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    displayCandidate,
    voltageKind: entry.voltageKind,
    voltageValue: entry.voltage,
    voltageUnit: entry.unit,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
    sourceStatus: entry.sourceStatus,
  };
}

export function resolveVoltageCandidate(
  context: CatalogResolverContext,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): CatalogResolvedCandidate {
  if (context.attributeKey !== 'coil_rating') {
    return notFound(context);
  }
  const manufacturer = context.manufacturer.trim().toLowerCase();
  if (manufacturer === 'rexroth') {
    return resolveRexrothVoltage(context, catalogProvider);
  }
  if (manufacturer === 'yuken') {
    return resolveYukenVoltage(context, catalogProvider);
  }
  return notFound(context);
}
