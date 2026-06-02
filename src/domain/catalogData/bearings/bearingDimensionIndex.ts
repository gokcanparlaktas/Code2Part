import {
  getRollingBearingDimensionCatalog,
  type RollingBearingDimensionCatalog,
  type RollingBearingDimensionRow,
} from '@/domain/catalogData/bearings/loadBearingCatalogData';

let cachedIndex: Map<string, RollingBearingDimensionRow> | null = null;

export function buildBearingDimensionIndex(
  catalog: RollingBearingDimensionCatalog
): Map<string, RollingBearingDimensionRow> {
  const index = new Map<string, RollingBearingDimensionRow>();
  for (const row of catalog.dimensionRows) {
    index.set(row.baseCode, row);
  }
  return index;
}

export function getBearingDimensionIndex(): Map<string, RollingBearingDimensionRow> {
  if (!cachedIndex) {
    cachedIndex = buildBearingDimensionIndex(getRollingBearingDimensionCatalog());
  }
  return cachedIndex;
}

/** Test helper: reset lazy index between tests. */
export function resetBearingDimensionIndexForTests(): void {
  cachedIndex = null;
}
