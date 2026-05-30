import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { compareProducts } from '@/domain/resolver/compareProducts';
import type { CompatibilityResult, EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

export function compareSourceToCandidate(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  catalogProvider: CatalogDataProvider
): CompatibilityResult {
  return compareProducts(source, candidate, { catalogProvider });
}
