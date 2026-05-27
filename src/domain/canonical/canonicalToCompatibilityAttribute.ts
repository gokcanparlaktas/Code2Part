import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import { CATALOG_CHECK_DISPLAY_MESSAGE } from '@/types/canonicalAttribute';
import type { CanonicalResolvedField } from '@/types/canonicalAttribute';

import {
  formatRawTokenEvidenceLabel,
  getCanonicalDisplayValueForUi,
  isUnknownCanonical,
} from './resolveCanonicalAttribute';

type ProfileAttribute = ProductCompatibilityProfile['attributes'][string];

export function canonicalResolvedToProfileAttribute(
  resolved: CanonicalResolvedField,
  options: Pick<ProfileAttribute, 'label' | 'importance' | 'compareMode'> & {
    unit?: string;
    sourceDocument?: string;
    notes?: string[];
  },
): ProfileAttribute {
  const unknown = isUnknownCanonical(resolved);
  const displayValue = unknown
    ? CATALOG_CHECK_DISPLAY_MESSAGE
    : getCanonicalDisplayValueForUi(resolved);

  return {
    label: options.label,
    value: unknown ? resolved.rawToken ?? null : resolved.displayValue,
    displayValue,
    canonicalValue: unknown ? null : resolved.canonicalValue,
    canonicalKey: resolved.canonicalKey,
    rawValue: resolved.rawToken ?? null,
    rawToken: resolved.rawToken,
    rawTokenLabel: resolved.rawTokenLabel ?? formatRawTokenEvidenceLabel(resolved.rawToken),
    unit: options.unit,
    importance: options.importance,
    compareMode: options.compareMode,
    evidence: resolved.evidence,
    confidence: resolved.confidence,
    requiresCatalogCheck: resolved.requiresCatalogCheck,
    sourceDocument: resolved.sourceDocument ?? options.sourceDocument,
    notes: options.notes ?? resolved.notes,
  };
}
