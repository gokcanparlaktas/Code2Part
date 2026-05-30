import { getRexrothSpoolCatalog, getYukenSpoolCatalog } from '@/domain/catalogData/loadCatalogData';
import type { CatalogPortState, CatalogResolvedCandidate, CatalogResolverContext } from '@/domain/catalogData/types';

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

function toPortState(row: {
  portState?: { P?: string | null; T?: string | null; A?: string | null; B?: string | null } | null;
}): CatalogPortState | null {
  if (!row.portState) {
    return null;
  }
  return {
    P: row.portState.P ?? null,
    T: row.portState.T ?? null,
    A: row.portState.A ?? null,
    B: row.portState.B ?? null,
  };
}

function resolveRexrothSpool(context: CatalogResolverContext): CatalogResolvedCandidate {
  const catalog = getRexrothSpoolCatalog();
  const token = context.rawToken.trim().toUpperCase();
  const entry = catalog.spoolSymbolMeanings?.find((row) => {
    if (row.attributeKey !== 'spool_symbol' || row.rawToken?.toUpperCase() !== token) {
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
  if (!entry) {
    return notFound(context);
  }
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    portState: toPortState(entry),
    centerCondition: entry.centerCondition,
    centerFlowDescription: entry.centerFlowDescription,
    displayCandidate: entry.centerFlowDescription ?? entry.centerCondition,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
    reviewReason: entry.reviewReason,
    sourceStatus: entry.sourceStatus,
  };
}

function resolveYukenSpool(context: CatalogResolverContext): CatalogResolvedCandidate {
  const catalog = getYukenSpoolCatalog();
  const token = context.rawToken.trim();
  const entry = catalog.spoolSymbolMeanings?.find((row) => {
    if (row.attributeKey !== 'spool_symbol' || row.rawToken !== token) {
      return false;
    }
    const appearsIn = row.appearsIn as string[] | undefined;
    if (!appearsIn?.length) {
      return true;
    }
    const family = context.sourceFamily.toUpperCase();
    const series = context.series.toUpperCase();
    return appearsIn.some((example) => {
      const upper = example.toUpperCase();
      if (upper.includes(family) || upper.includes(series)) {
        return true;
      }
      if (family.startsWith('DSHG') && upper.startsWith('DSHG')) {
        return true;
      }
      return false;
    });
  });
  if (!entry) {
    return notFound(context);
  }
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    portState: toPortState(entry),
    centerCondition: entry.centerCondition,
    centerFlowDescription: entry.centerFlowDescription,
    displayCandidate: entry.suggestedDisplayValue ?? entry.centerFlowDescription,
    confidence: entry.confidence ?? 'medium',
    needsReview: entry.needsReview ?? true,
    evidence: 'catalog_data',
    reviewReason: entry.reviewReason,
    sourceStatus: entry.sourceStatus,
  };
}

export function resolveSpoolCandidate(context: CatalogResolverContext): CatalogResolvedCandidate {
  if (context.attributeKey !== 'spool_symbol') {
    return notFound(context);
  }
  const manufacturer = context.manufacturer.trim().toLowerCase();
  if (manufacturer === 'rexroth') {
    return resolveRexrothSpool(context);
  }
  if (manufacturer === 'yuken') {
    return resolveYukenSpool(context);
  }
  return notFound(context);
}

export function portStatesMatch(
  a: CatalogPortState | null | undefined,
  b: CatalogPortState | null | undefined
): boolean {
  if (!a || !b) {
    return false;
  }
  return a.P === b.P && a.T === b.T && a.A === b.A && a.B === b.B;
}
