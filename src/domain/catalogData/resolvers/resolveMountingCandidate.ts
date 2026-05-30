import { getRexrothMountingCatalog, getYukenMountingCatalog } from '@/domain/catalogData/loadCatalogData';
import type { CatalogResolvedCandidate, ProductResolverContext } from '@/domain/catalogData/types';

function modelKeys(context: ProductResolverContext): string[] {
  const keys = new Set<string>();
  keys.add(context.series.toUpperCase());
  keys.add(context.sourceFamily.toUpperCase());
  if (context.nominalSize) {
    keys.add(`WE${context.nominalSize}`);
    keys.add(`4WE${context.nominalSize}`);
  }
  if (context.family.toUpperCase() === 'WE') {
    const size = context.nominalSize ?? (context.sourceFamily === 'WE10' ? '10' : '6');
    if (size === '10' || context.sourceFamily.toUpperCase() === 'WE10') {
      keys.add('WE10');
      keys.add('4WE10');
    } else {
      keys.add('WE6');
      keys.add('4WE6');
    }
  }
  return [...keys];
}

function mappingMatches(
  mapping: {
    modelPattern?: string;
    matchedModels?: string[];
    alsoAppliesTo?: string[];
  },
  keys: string[]
): boolean {
  const candidates = [
    ...(mapping.matchedModels ?? []),
    ...(mapping.alsoAppliesTo ?? []),
  ].map((m) => m.toUpperCase());

  for (const key of keys) {
    if (candidates.some((c) => c === key)) {
      return true;
    }
  }
  for (const key of keys) {
    const pattern = mapping.modelPattern?.toUpperCase() ?? '';
    if (pattern.includes(key)) {
      return true;
    }
  }
  return false;
}

function resolveFromCatalog(
  context: ProductResolverContext,
  catalog: {
    mountingSurfaceMappings?: Array<{
      modelPattern?: string;
      matchedModels?: string[];
      alsoAppliesTo?: string[];
      isoCode?: string | null;
      needsReview?: boolean;
    }>;
  }
): CatalogResolvedCandidate {
  const keys = modelKeys(context);
  const mapping = catalog.mountingSurfaceMappings?.find((row) => mappingMatches(row, keys));
  const attributeKey = 'mounting_standard';
  if (!mapping?.isoCode) {
    return {
      found: false,
      attributeKey,
      rawToken: context.sourceFamily,
      confidence: 'unknown',
      needsReview: true,
      evidence: 'catalog_data',
    };
  }
  return {
    found: true,
    attributeKey,
    rawToken: context.sourceFamily,
    isoCode: mapping.isoCode,
    displayCandidate: mapping.isoCode,
    confidence: 'medium',
    needsReview: mapping.needsReview ?? true,
    evidence: 'catalog_data',
  };
}

export function resolveMountingCandidate(context: ProductResolverContext): CatalogResolvedCandidate {
  const manufacturer = context.manufacturer.trim().toLowerCase();
  if (manufacturer === 'rexroth') {
    return resolveFromCatalog(context, getRexrothMountingCatalog());
  }
  if (manufacturer === 'yuken') {
    return resolveFromCatalog(context, getYukenMountingCatalog());
  }
  return {
    found: false,
    attributeKey: 'mounting_standard',
    rawToken: context.sourceFamily,
    confidence: 'unknown',
    needsReview: true,
    evidence: 'catalog_data',
  };
}
