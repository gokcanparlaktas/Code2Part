import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { buildHydraulicValveCanonicalProfile } from './buildHydraulicValveCanonicalProfile';
import {
  buildHydraulicValveBehaviorDescriptionsFromProfile,
  type HydraulicBehaviorDescription,
} from './hydraulicValveBehaviorDescriptions';

export function buildHydraulicValveBehaviorDescriptions(options: {
  identification: ProductIdentification;
  attributes: TechnicalAttribute[];
  catalogProvider?: CatalogDataProvider;
}): HydraulicBehaviorDescription[] {
  const profile = buildHydraulicValveCanonicalProfile({
    identification: options.identification,
    attributes: options.attributes,
    catalogProvider: options.catalogProvider,
  });
  return buildHydraulicValveBehaviorDescriptionsFromProfile(profile, options.attributes);
}

export function buildHydraulicValveBehaviorDescriptionsFromIdentification(
  identification: ProductIdentification
): HydraulicBehaviorDescription[] {
  return buildHydraulicValveBehaviorDescriptions({
    identification,
    attributes: getTechnicalAttributes(identification),
  });
}
