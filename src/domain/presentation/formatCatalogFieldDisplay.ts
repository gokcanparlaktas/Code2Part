import type { CatalogFieldEvidence, CatalogPortState } from '@/domain/catalogData/types';

export const CATALOG_CANDIDATE_META_TR = 'Katalog adayı — doğrulanmalı';

export const GENERIC_PORT_STATE_RESOLVED_TR =
  'Port durumu katalog adayından çözümlendi';

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

function isPortConnected(state: string | undefined): boolean {
  return state != null && state !== 'blocked' && /connected/i.test(state);
}

export function portStateBehaviorSummary(
  portState?: CatalogPortState | null
): string | null {
  if (!portState?.P || !portState.T || !portState.A || !portState.B) {
    return null;
  }

  const allBlocked =
    portState.P === 'blocked' &&
    portState.T === 'blocked' &&
    portState.A === 'blocked' &&
    portState.B === 'blocked';

  if (allBlocked) {
    return 'Kapalı merkez — P, T, A ve B kapalı';
  }

  const pBlockedAbTConnected =
    portState.P === 'blocked' &&
    portState.A === 'connected_to_B_T' &&
    portState.B === 'connected_to_A_T';

  if (pBlockedAbTConnected) {
    return 'Yüzer merkez — P kapalı, A-B-T bağlantılı';
  }

  const allConnected =
    isPortConnected(portState.P) &&
    isPortConnected(portState.T) &&
    isPortConnected(portState.A) &&
    isPortConnected(portState.B);

  if (allConnected) {
    return 'Açık merkez — P, T, A ve B bağlantılı';
  }

  return GENERIC_PORT_STATE_RESOLVED_TR;
}

export function isGenericPortStateFallback(summary: string | null | undefined): boolean {
  return summary === GENERIC_PORT_STATE_RESOLVED_TR;
}

/** Prefer portState summary; avoid generic port placeholder when center enum is known. */
export function resolveCenterDisplayFromCatalogEvidence(options: {
  catalogEvidence?: CatalogFieldEvidence;
  centerConditionValue?: string | null;
  getCenterConditionDisplay: (value: string) => string;
  fallback: string;
}): string {
  const catalog = options.catalogEvidence;
  const portSummary = portStateBehaviorSummary(catalog?.portState);

  if (portSummary && !isGenericPortStateFallback(portSummary)) {
    return portSummary;
  }

  if (
    options.centerConditionValue &&
    options.centerConditionValue !== 'unknown'
  ) {
    return options.getCenterConditionDisplay(options.centerConditionValue);
  }

  const flow = catalog?.centerFlowDescription?.trim();
  if (flow && flow !== GENERIC_PORT_STATE_RESOLVED_TR) {
    return flow;
  }

  if (portSummary) {
    return portSummary;
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
