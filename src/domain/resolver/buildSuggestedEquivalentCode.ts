import { buildHydraulicValveSuggestedCode } from '@/domain/categories/hydraulicValve/hydraulicValveSuggestedCode';
import { buildPneumaticCylinderSuggestedCode } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestedCode';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
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

  if (category === HYDRAULIC_VALVE_CATEGORY) {
    return buildHydraulicValveSuggestedCode(source, targetSeries);
  }

  return null;
}
