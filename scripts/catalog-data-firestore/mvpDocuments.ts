import type { CatalogManufacturer } from './types';

/** Paths relative to data/catalog-data/. */
export const MVP_CATALOG_RELATIVE_PATHS = [
  'rexroth/directional-controls/family-index.json',
  'rexroth/directional-controls/shared/spool-symbol-candidates.json',
  'rexroth/directional-controls/shared/mounting-surface-candidates.json',
  'rexroth/directional-controls/we/parser-spec-candidate.json',
  'rexroth/directional-controls/we/connector-voltage-candidates.json',
  'rexroth/directional-controls/we/technical-data-candidates.json',
  'rexroth/directional-controls/we/mapping-candidates.json',
  'rexroth/directional-controls/we/catalog-source.json',
  'rexroth/directional-controls/we/unknown-or-review.json',
  'yuken/directional-controls/family-index.json',
  'yuken/directional-controls/shared/spool-symbol-candidates.json',
  'yuken/directional-controls/shared/mounting-surface-candidates.json',
  'yuken/directional-controls/shared/technical-data-candidates.json',
  'yuken/directional-controls/dsg/parser-spec-candidate.json',
  'yuken/directional-controls/dsg/connector-voltage-candidates.json',
  'yuken/directional-controls/dsg/technical-data-candidates.json',
  'yuken/directional-controls/dsg/mapping-candidates.json',
  'yuken/directional-controls/dshg/parser-spec-candidate.json',
  'yuken/directional-controls/dshg/connector-voltage-candidates.json',
  'yuken/directional-controls/dshg/technical-data-candidates.json',
  'yuken/directional-controls/dshg/mapping-candidates.json',
] as const;

/** Mirrors src/domain/catalogData/loadCatalogData.ts static imports. */
export const RUNTIME_USED_RELATIVE_PATHS = new Set<string>([
  'rexroth/directional-controls/shared/spool-symbol-candidates.json',
  'rexroth/directional-controls/shared/mounting-surface-candidates.json',
  'rexroth/directional-controls/we/connector-voltage-candidates.json',
  'rexroth/directional-controls/we/technical-data-candidates.json',
  'yuken/directional-controls/shared/spool-symbol-candidates.json',
  'yuken/directional-controls/shared/mounting-surface-candidates.json',
  'yuken/directional-controls/dsg/connector-voltage-candidates.json',
  'yuken/directional-controls/dsg/technical-data-candidates.json',
  'yuken/directional-controls/dshg/connector-voltage-candidates.json',
  'yuken/directional-controls/dshg/parser-spec-candidate.json',
]);

export function isRuntimeUsedCatalogPath(relativePath: string): boolean {
  return RUNTIME_USED_RELATIVE_PATHS.has(relativePath.replace(/\\/g, '/'));
}

export function mvpFamiliesByManufacturer(): Record<
  CatalogManufacturer,
  readonly ('we' | 'dsg' | 'dshg')[]
> {
  return {
    rexroth: ['we'],
    yuken: ['dsg', 'dshg'],
  };
}
