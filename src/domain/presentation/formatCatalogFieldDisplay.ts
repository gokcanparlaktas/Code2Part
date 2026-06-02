import type { CatalogFieldEvidence, CatalogPortState } from '@/domain/catalogData/types';

import {
  GENERIC_PORT_STATE_RESOLVED_TR,
  isGenericPortStateFallback,
  portStateBehaviorSummary,
  resolveCenterTypeDisplay,
} from '@/domain/presentation/formatCenterTypeDisplay';

export {
  centerTypePartsFromCondition,
  centerTypePartsFromPortState,
  catalogSpoolLookupToken,
  formatCenterTypeSummary,
  formatUnifiedCenterDisplay,
  GENERIC_PORT_STATE_RESOLVED_TR,
  resolveCenterTypeDisplay,
} from '@/domain/presentation/formatCenterTypeDisplay';

export const CATALOG_CANDIDATE_META_TR = 'Katalog adayı — doğrulanmalı';

type FieldWithCatalogEvidence = {
  displayValue: string;
  catalogEvidence?: CatalogFieldEvidence;
};

export function catalogPrimaryFromField(
  field: FieldWithCatalogEvidence,
  fallback: string
): string {
  const catalog = field.catalogEvidence;
  if (catalog?.displayCandidate?.trim()) {
    return catalog.displayCandidate.trim();
  }
  if (catalog?.centerFlowDescription?.trim()) {
    return catalog.centerFlowDescription.trim();
  }
  if (catalog?.isoCode?.trim()) {
    return catalog.isoCode.trim();
  }
  return fallback;
}

export { portStateBehaviorSummary, isGenericPortStateFallback };

/** Prefer portState summary; avoid generic port placeholder when center enum is known. */
export function resolveCenterDisplayFromCatalogEvidence(options: {
  catalogEvidence?: CatalogFieldEvidence;
  centerConditionValue?: string | null;
  spoolToken?: string | null;
  getCenterConditionDisplay: (value: string) => string;
  fallback: string;
}): string {
  const catalog = options.catalogEvidence;

  const resolved = resolveCenterTypeDisplay({
    portState: catalog?.portState,
    centerConditionValue: options.centerConditionValue,
    spoolToken: options.spoolToken,
    getCenterConditionDisplay: options.getCenterConditionDisplay,
    fallback: options.fallback,
  });

  if (resolved !== options.fallback) {
    return resolved;
  }

  const flow = catalog?.centerFlowDescription?.trim();
  if (flow && flow !== GENERIC_PORT_STATE_RESOLVED_TR) {
    return flow;
  }

  return catalogPrimaryFromField(
    { displayValue: options.fallback, catalogEvidence: catalog },
    options.fallback
  );
}

export function catalogEvidenceDetailLines(options: {
  rawToken?: string | null;
  catalogEvidence?: CatalogFieldEvidence;
  extra?: string[];
  /** When true, omit internal review meta (for product detail UI). */
  forUserDisplay?: boolean;
}): string[] {
  const lines: string[] = [];

  for (const entry of options.extra ?? []) {
    if (entry?.trim()) {
      lines.push(entry.trim());
    }
  }

  if (options.rawToken?.trim()) {
    lines.push(`Kod kanıtı: ${options.rawToken.trim()}`);
  }

  if (!options.forUserDisplay && options.catalogEvidence?.needsReview) {
    lines.push(catalogEvidenceMetaLabel(options.catalogEvidence));
  }

  return lines;
}

export function catalogEvidenceMetaLabel(
  catalogEvidence?: CatalogFieldEvidence
): string {
  if (!catalogEvidence) {
    return 'Ürün kodundan';
  }
  if (catalogEvidence.needsReview) {
    return CATALOG_CANDIDATE_META_TR;
  }
  return 'Katalog adayı';
}

export function hasCatalogCandidateReview(
  catalogEvidence?: CatalogFieldEvidence
): boolean {
  return Boolean(catalogEvidence?.needsReview);
}

export type { CatalogPortState };
