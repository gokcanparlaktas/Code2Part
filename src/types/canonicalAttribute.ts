import type { ProductResolverCategory } from './category';
import type { AttributeEvidenceSource } from './technicalAttribute';

export type CanonicalConfidence = 'high' | 'medium' | 'low' | 'unknown';

/** Machine-readable canonical identifier used for comparison (never a human label). */
export type CanonicalKey = string;

export const UNKNOWN_CANONICAL_KEY = 'unknown' as const;

/** UI-only fallback when canonicalKey is unknown. Not a canonical value. */
export const CATALOG_CHECK_DISPLAY_MESSAGE = 'Katalogdan doğrulanmalı';

export interface CanonicalMappingEntry {
  id: string;
  category: ProductResolverCategory;
  manufacturer?: string;
  series?: string;
  attributeKey: string;
  rawToken: string;
  canonicalKey: CanonicalKey;
  canonicalValue: string | number | boolean | null;
  displayValue: string;
  evidence: AttributeEvidenceSource;
  confidence: CanonicalConfidence;
  requiresCatalogCheck: boolean;
  sourceDocument?: string;
  sourcePage?: string;
  notes?: string[];
  /** Profile field key after resolution (e.g. coil_rating → coil_voltage). */
  resolvedAttributeKey?: string;
}

export interface CanonicalResolveContext {
  category: ProductResolverCategory;
  manufacturer?: string | null;
  series?: string | null;
  attributeKey: string;
  rawToken?: string | null;
  rawValue?: string | number | boolean | null;
  evidence?: AttributeEvidenceSource;
  confidence?: CanonicalConfidence;
}

export interface CanonicalResolvedField {
  /** Parser attribute key (raw field). */
  rawAttributeKey: string;
  /** Profile / comparison attribute key (defaults to rawAttributeKey). */
  attributeKey: string;
  rawToken?: string;
  rawTokenLabel?: string;
  canonicalKey: CanonicalKey;
  canonicalValue: string | number | boolean | null;
  displayValue: string;
  evidence: AttributeEvidenceSource;
  confidence: CanonicalConfidence;
  requiresCatalogCheck: boolean;
  sourceDocument?: string;
  notes?: string[];
  /** True when a mapping entry matched. */
  resolved: boolean;
}
