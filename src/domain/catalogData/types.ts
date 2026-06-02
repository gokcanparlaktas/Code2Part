import type { ProductResolverCategory } from '@/types/category';

/** Explicit P/T/A/B connection state from catalog-data spool candidates. */
export type CatalogPortState = {
  P: string | null;
  T: string | null;
  A: string | null;
  B: string | null;
};

export type CatalogCandidateConfidence = 'high' | 'medium' | 'low' | 'unknown';

/** Product-level context for catalog lookups (no single attribute yet). */
export interface ProductResolverContext {
  manufacturer: string;
  category: ProductResolverCategory;
  /** Series family: WE, DSG, DSHG */
  family: string;
  /** Catalog series label: 4WE6, DSG-01, 4WE10 */
  series: string;
  /** Catalog sourceFamily: WE6, DSG-01, DSHG-03 */
  sourceFamily: string;
  /** Rexroth nominal size as string: "6" | "10" */
  nominalSize?: string;
  /** Eaton/Vickers DG4V spring arrangement raw token (A, B, N, AL, BL, C). */
  springArrangement?: string;
}

/** Attribute-level context passed into catalog resolvers. */
export interface CatalogResolverContext extends ProductResolverContext {
  attributeKey: string;
  rawToken: string;
}

/** Attached to canonical profile fields after catalog-data bridge (Phase B). */
export type CatalogFieldEvidence = {
  source: 'catalog_data';
  displayCandidate?: string;
  isoCode?: string;
  portState?: CatalogPortState | null;
  centerCondition?: string;
  centerFlowDescription?: string;
  /** Normalized bar value for pressure candidates (comparison). */
  numericValueBar?: number;
  /** Normalized L/min for flow candidates (comparison). */
  numericValueLpm?: number;
  technicalNotes?: string;
  needsReview: boolean;
  confidence: CatalogCandidateConfidence;
  reviewReason?: string;
};

export interface CatalogResolvedCandidate {
  found: boolean;
  attributeKey: string;
  rawToken: string;
  /** Human-readable candidate meaning from catalog (not final UI canonical). */
  displayCandidate?: string;
  isoCode?: string;
  portState?: CatalogPortState | null;
  centerCondition?: string;
  centerFlowDescription?: string;
  voltageKind?: string;
  voltageValue?: number;
  voltageUnit?: string;
  confidence: CatalogCandidateConfidence;
  needsReview: boolean;
  evidence: 'catalog_data';
  reviewReason?: string;
  sourceStatus?: string;
}

export function toCatalogResolverContext(
  base: ProductResolverContext,
  attributeKey: string,
  rawToken: string
): CatalogResolverContext {
  return {
    ...base,
    attributeKey,
    rawToken: rawToken.trim(),
  };
}
