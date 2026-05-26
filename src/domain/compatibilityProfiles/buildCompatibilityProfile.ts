import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductResolverCategory } from '@/types/category';
import type { ProductIdentification } from '@/types/product';

import { buildHydraulicValveCompatibilityProfile } from '@/domain/categories/hydraulicValve/hydraulicValveCompatibilityProfile';
import { buildPneumaticCylinderCompatibilityProfile } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderCompatibilityProfile';
import type { ProductCompatibilityProfile } from './compatibilityProfile';

export function buildCompatibilityProfileFromIdentification(
  identification: ProductIdentification
): ProductCompatibilityProfile | null {
  const category = identification.resolverCategoryKey;
  if (!category) {
    return null;
  }

  if (category === 'pneumatic_cylinder') {
    return buildPneumaticCylinderCompatibilityProfile({ identification });
  }

  if (category === 'hydraulic_valve') {
    return buildHydraulicValveCompatibilityProfile({ identification });
  }

  return null;
}

export function buildCompatibilityProfileFromCandidateFallback(options: {
  candidate: EquivalentCandidate;
  resolverCategoryKey: ProductResolverCategory;
}): ProductCompatibilityProfile | null {
  if (options.resolverCategoryKey === 'pneumatic_cylinder') {
    return buildPneumaticCylinderCompatibilityProfile({
      identification: null,
      candidate: options.candidate,
    });
  }

  if (options.resolverCategoryKey === 'hydraulic_valve') {
    return buildHydraulicValveCompatibilityProfile({
      identification: null,
      candidate: options.candidate,
    });
  }

  return null;
}

