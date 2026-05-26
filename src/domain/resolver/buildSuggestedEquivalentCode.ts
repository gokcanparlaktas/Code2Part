import { buildPneumaticCylinderSuggestedCode } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestedCode';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type {
  ProductIdentification,
  ProductSeriesRecord,
} from '@/types/product';

export function buildSuggestedEquivalentCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  const category = targetSeries.resolverCategory;

  if (category === PNEUMATIC_CYLINDER_CATEGORY) {
    return buildPneumaticCylinderSuggestedCode(source, targetSeries);
  }

  return null;
}
