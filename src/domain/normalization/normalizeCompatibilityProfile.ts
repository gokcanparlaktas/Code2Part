import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';

import { applyCanonicalDisplayToProfileAttribute } from './applyCanonicalDisplay';

const PNEUMATIC_CANONICAL_KEYS = new Set(['standardFamily', 'cushioning']);

const HYDRAULIC_CANONICAL_KEYS = new Set([
  'cetopNg',
  'voltage',
  'voltageCode',
  'connector',
  'connectorCode',
  'manualOverride',
  'spoolSymbol',
  'spoolFunctionCode',
  'standardFamily',
  'cushioning',
]);

export function normalizeCompatibilityProfile(
  profile: ProductCompatibilityProfile
): ProductCompatibilityProfile {
  const keys =
    profile.productCategory === PNEUMATIC_CYLINDER_CATEGORY
      ? PNEUMATIC_CANONICAL_KEYS
      : profile.productCategory === HYDRAULIC_VALVE_CATEGORY
        ? HYDRAULIC_CANONICAL_KEYS
        : null;

  if (!keys) {
    return profile;
  }

  const attributes = Object.fromEntries(
    Object.entries(profile.attributes).map(([key, attribute]) => {
      if (!keys.has(key)) {
        return [key, attribute];
      }
      return [key, applyCanonicalDisplayToProfileAttribute(key, attribute, profile.brand)];
    })
  );

  return {
    ...profile,
    attributes,
  };
}
