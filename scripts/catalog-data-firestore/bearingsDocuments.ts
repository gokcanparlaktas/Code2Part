/** Bearings catalog-data paths relative to data/catalog-data/ (staging; not in MVP hydraulic import). */
export const BEARINGS_CATALOG_RELATIVE_PATHS = [
  'bearings/rolling-bearings/family-index.json',
  'bearings/rolling-bearings/manufacturers/manufacturer-index.json',
  'bearings/rolling-bearings/shared/brand-detection-candidates.json',
  'bearings/rolling-bearings/shared/bore-code-candidates.json',
  'bearings/rolling-bearings/shared/dimension-candidates.json',
  'bearings/rolling-bearings/shared/series-candidates.json',
  'bearings/rolling-bearings/shared/suffix-candidates.json',
  'bearings/rolling-bearings/standard-series/parser-spec-candidate.json',
  'bearings/rolling-bearings/standard-series/generation-spec-candidate.json',
  'bearings/rolling-bearings/standard-series/mapping-candidates.json',
  'bearings/rolling-bearings/standard-series/unknown-or-review.json',
] as const;

/** Prep-only bearing documents (no app resolver runtime yet). */
export const BEARINGS_PREP_RELATIVE_PATHS = new Set<string>([
  'bearings/rolling-bearings/standard-series/parser-spec-candidate.json',
  'bearings/rolling-bearings/standard-series/generation-spec-candidate.json',
]);

export function isBearingsPrepCatalogPath(relativePath: string): boolean {
  return BEARINGS_PREP_RELATIVE_PATHS.has(relativePath.replace(/\\/g, '/'));
}
