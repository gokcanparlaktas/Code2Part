import type { ProductResolverCategory } from './category';
import type { AttributeEvidenceSource } from './technicalAttribute';

export type CanonicalConfidence = 'high' | 'medium' | 'low' | 'unknown';

/** Machine-readable canonical identifier used for comparison (never a human label). */
export type CanonicalKey = string;

export const UNKNOWN_CANONICAL_KEY = 'unknown' as const;

/** UI-only fallback when canonicalKey is unknown. Not a canonical value. */
export const CATALOG_CHECK_DISPLAY_MESSAGE = 'Katalogdan doğrulanmalı';

export type ConnectorFamilyKey =
  | 'DIN_VALVE_CONNECTOR'
  | 'PLUG_IN_CONNECTOR'
  | 'AMP_JUNIOR_TIMER'
  | 'DEUTSCH_CONNECTOR'
  | 'M12_CONNECTOR'
  | 'NO_CONNECTOR'
  | 'FLYING_LEAD'
  | 'TERMINAL_BOX'
  | 'UNKNOWN';

export type ConnectorOptionKey = 'INDICATOR_LIGHT' | 'PG11_ENTRY';

export interface CanonicalConnectorMetadata {
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  connectorSubtypeKey?: string;
  pinCount?: number | 'unknown';
  hasIndicatorLight?: boolean;
  hasPgPlug?: boolean;
  isGenericConnector?: boolean;
  connectorOptions?: ConnectorOptionKey[];
  displayDetail?: string;
}

export interface CanonicalMappingEntry {
  id: string;
  category: ProductResolverCategory;
  manufacturer?: string;
  series?: string;
  /** Broader family when multiple series share tokens (e.g. DG4V-3 and DG4V-5 → DG4V). */
  seriesFamily?: string;
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
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  connectorSubtypeKey?: string;
  pinCount?: number | 'unknown';
  hasIndicatorLight?: boolean;
  hasPgPlug?: boolean;
  isGenericConnector?: boolean;
  connectorOptions?: ConnectorOptionKey[];
  displayDetail?: string;
}

export interface CanonicalResolveContext {
  category: ProductResolverCategory;
  manufacturer?: string | null;
  series?: string | null;
  /** Inferred from series when omitted (e.g. DG4V-5 → DG4V). */
  seriesFamily?: string | null;
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
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  connectorSubtypeKey?: string;
  pinCount?: number | 'unknown';
  hasIndicatorLight?: boolean;
  hasPgPlug?: boolean;
  isGenericConnector?: boolean;
  connectorOptions?: ConnectorOptionKey[];
  displayDetail?: string;
}
