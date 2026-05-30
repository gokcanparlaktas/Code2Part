import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { compareHydraulicValves } from '@/domain/categories/hydraulicValve/hydraulicValveComparison';
import { compareProducts, resolveResolverCategory } from '@/domain/resolver/compareProducts';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { CompatibilityResult, EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

export function compareSourceToCandidate(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  catalogProvider: CatalogDataProvider
): CompatibilityResult {
  const category = resolveResolverCategory(source);
  if (category === HYDRAULIC_VALVE_CATEGORY) {
    return compareHydraulicValves(source, candidate, { catalogProvider });
  }
  return compareProducts(source, candidate);
}
