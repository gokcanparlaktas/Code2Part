import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';

import { normalizeCanonicalAttributeDisplay } from './canonicalAttributeDisplay';

type ProfileAttribute = ProductCompatibilityProfile['attributes'][string];

export function applyCanonicalDisplayToProfileAttribute(
  attributeKey: string,
  attribute: ProfileAttribute,
  brand?: string
): ProfileAttribute {
  const rawToken =
    attribute.rawToken ??
    (typeof attribute.rawValue === 'string' ? attribute.rawValue : undefined) ??
    (typeof attribute.value === 'string' && !attribute.displayValue ? attribute.value : undefined);

  const display = normalizeCanonicalAttributeDisplay({
    attributeKey,
    rawValue: attribute.rawValue ?? attribute.value,
    rawToken,
    behaviorNoteTr: attribute.notes?.[0],
    sourceManufacturer: brand,
  });

  if (!display) {
    return attribute;
  }

  return {
    ...attribute,
    value: display.displayValue,
    displayValue: display.displayValue,
    canonicalValue: display.canonicalValue,
    rawValue: attribute.rawValue ?? attribute.value,
    rawToken: display.rawToken ?? attribute.rawToken,
    rawTokenLabel: display.rawTokenLabel,
    manufacturer: brand,
    confidence: display.confidence,
    requiresCatalogCheck: display.requiresCatalogCheck,
  };
}
