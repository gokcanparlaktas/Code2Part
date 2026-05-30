import { getRexrothConnectorVoltageCatalog, getYukenDsgConnectorVoltageCatalog } from '@/domain/catalogData/loadCatalogData';
import type { CatalogResolvedCandidate, CatalogResolverContext } from '@/domain/catalogData/types';

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

function resolveRexrothConnector(context: CatalogResolverContext): CatalogResolvedCandidate {
  const catalog = getRexrothConnectorVoltageCatalog();
  const token = context.rawToken.trim().toUpperCase();
  const entry = catalog.entries?.find((row) => {
    if (row.rawConnectorToken?.toUpperCase() !== token) {
      return false;
    }
    if (row.sourceFamily && context.sourceFamily) {
      return row.sourceFamily.toUpperCase() === context.sourceFamily.toUpperCase();
    }
    if (row.nominalSize && context.nominalSize) {
      return String(row.nominalSize) === String(context.nominalSize);
    }
    return true;
  });
  if (!entry?.connectorDescription) {
    return notFound(context);
  }
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    displayCandidate: entry.connectorDescription,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
  };
}

function resolveYukenConnector(context: CatalogResolverContext): CatalogResolvedCandidate {
  const catalog = getYukenDsgConnectorVoltageCatalog();
  const token = context.rawToken.trim().toUpperCase();
  const entry = catalog.connectorTokenMeanings?.find((row) => {
    if (row.rawConnectorToken?.toUpperCase() !== token) {
      return false;
    }
    const applies = row.appliesToModelSeries as string[] | undefined;
    if (!applies?.length) {
      return true;
    }
    return applies.some(
      (series) =>
        series.toUpperCase() === context.sourceFamily.toUpperCase() ||
        series.toUpperCase() === context.series.toUpperCase()
    );
  });
  if (!entry) {
    return notFound(context);
  }
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    displayCandidate: entry.meaning,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
    sourceStatus: entry.sourceStatus,
  };
}

export function resolveConnectorCandidate(context: CatalogResolverContext): CatalogResolvedCandidate {
  if (context.attributeKey !== 'connector_type') {
    return notFound(context);
  }
  const manufacturer = context.manufacturer.trim().toLowerCase();
  if (manufacturer === 'rexroth') {
    return resolveRexrothConnector(context);
  }
  if (manufacturer === 'yuken') {
    return resolveYukenConnector(context);
  }
  return notFound(context);
}
