import { buildHydraulicValveEquivalentCandidates } from '@/domain/categories/hydraulicValve/buildHydraulicValveEquivalentCandidates';
import { buildRollingBearingEquivalentCandidates } from '@/domain/categories/rollingBearing/buildRollingBearingEquivalentCandidates';
import {
  getAllCatalogExampleCodes,
  getLegacyEquivalentGroups,
  getLegacyProductSeries,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  ROLLING_BEARING_CATEGORY,
  type ProductResolverCategory,
} from '@/types/category';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { GeneratedEquivalentCandidate } from '@/types/equivalentCodeGeneration';
import type {
  EquivalentGroupRecord,
  ProductIdentification,
  ProductSeriesRecord,
} from '@/types/product';

import { buildSuggestedEquivalentCode } from './buildSuggestedEquivalentCode';
import {
  hydraulicMountingRelation,
  hydraulicValveWaysCompatible,
  isHydraulicValveCategory,
  isIso15552StandardFamily,
  isPneumaticCylinderCategory,
  pneumaticDimensionsMatch,
  resolverCategoriesMatch,
} from './equivalentCandidateCoarseMatch';
import { getProductSeriesById } from './productSeriesCatalog';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';

export type EquivalentCandidateReason =
  | 'equivalence_group'
  | 'same_mounting_standard'
  | 'same_standard_family'
  | 'same_dimensions'
  | 'same_category_profile'
  | 'fallback';

export type CoarseMatchConfidence = 'high' | 'medium' | 'low';

export type DiscoveredEquivalentCandidate = {
  candidate: EquivalentCandidate;
  reason: EquivalentCandidateReason;
  coarseMatchConfidence: CoarseMatchConfidence;
  notes?: string[];
};

export type EquivalentCandidateCatalog = {
  series: ProductSeriesRecord[];
  equivalenceGroups: EquivalentGroupRecord[];
  exampleCodes?: string[];
};

export const DEFAULT_EQUIVALENT_CANDIDATE_CATALOG: EquivalentCandidateCatalog = {
  series: getLegacyProductSeries(),
  equivalenceGroups: getLegacyEquivalentGroups(),
  exampleCodes: getAllCatalogExampleCodes(),
};

const REASON_PRIORITY: Record<EquivalentCandidateReason, number> = {
  equivalence_group: 6,
  same_mounting_standard: 5,
  same_standard_family: 4,
  same_dimensions: 4,
  same_category_profile: 2,
  fallback: 1,
};

const CONFIDENCE_PRIORITY: Record<CoarseMatchConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function reasonRank(reason: EquivalentCandidateReason): number {
  return REASON_PRIORITY[reason];
}

function confidenceRank(confidence: CoarseMatchConfidence): number {
  return CONFIDENCE_PRIORITY[confidence];
}

function candidateDedupeKey(candidate: EquivalentCandidate): string | null {
  const code = candidate.suggestedCode?.trim();
  if (!code) {
    return candidate.seriesId ? `series:${candidate.seriesId}` : null;
  }
  return normalizeCode(code);
}

function generationToCandidateMetadata(
  generated: GeneratedEquivalentCandidate
): NonNullable<EquivalentCandidate['generation']> {
  return {
    generationStatus: generated.generationStatus,
    requiresCheck: generated.requiresCheck,
    generationCheckNotes: generated.checkNotes,
    generationInfoNotes: generated.infoNotes ?? [],
    isExactKnownExample: generated.isExactKnownExample,
    generationTraceSummaryTr: generated.generationTrace.summaryTr,
  };
}

function buildEquivalentCandidateFromGenerated(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  generated: GeneratedEquivalentCandidate
): EquivalentCandidate | null {
  const targetIdentification = identifyProduct(
    generated.generatedCode,
    normalizeCode(generated.generatedCode)
  );
  if (targetIdentification.outcome !== 'full') {
    return null;
  }

  if (targetIdentification.seriesId === source.seriesId) {
    return null;
  }

  return {
    seriesId: targetSeries.id,
    brand: targetSeries.brand,
    series: targetSeries.series,
    productType: targetSeries.productType,
    productCategory: targetSeries.productCategory,
    standardFamily: targetSeries.standardFamily,
    suggestedCode: generated.generatedCode,
    targetIdentification,
    generation: generationToCandidateMetadata(generated),
  };
}

function buildEquivalentCandidate(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  suggestedCodeOverride?: string | null,
  generationOverride?: EquivalentCandidate['generation']
): EquivalentCandidate | null {
  const suggestedCode =
    suggestedCodeOverride ?? buildSuggestedEquivalentCode(source, targetSeries);
  if (!suggestedCode) {
    return null;
  }

  const targetIdentification = identifyProduct(suggestedCode, normalizeCode(suggestedCode));
  if (targetIdentification.outcome !== 'full') {
    return null;
  }

  if (targetIdentification.seriesId === source.seriesId) {
    return null;
  }

  return {
    seriesId: targetSeries.id,
    brand: targetSeries.brand,
    series: targetSeries.series,
    productType: targetSeries.productType,
    productCategory: targetSeries.productCategory,
    standardFamily: targetSeries.standardFamily,
    suggestedCode,
    targetIdentification,
    generation: generationOverride,
  };
}

function isBlockedHydraulicEquivalentTarget(
  targetSeries: ProductSeriesRecord,
  suggestedCode?: string | null
): boolean {
  if (targetSeries.id === 'rexroth_3we4' || targetSeries.codePrefix.startsWith('3WE4')) {
    return true;
  }
  const code = suggestedCode?.trim().toUpperCase() ?? '';
  return code.startsWith('3WE4');
}

function buildEquivalentCandidatesForTargetSeries(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  suggestedCodeOverride?: string | null
): EquivalentCandidate[] {
  if (isBlockedHydraulicEquivalentTarget(targetSeries, suggestedCodeOverride)) {
    return [];
  }

  if (
    isHydraulicValveCategory(source.resolverCategoryKey) &&
    !hydraulicValveWaysCompatible(source, targetSeries)
  ) {
    return [];
  }

  if (suggestedCodeOverride) {
    const candidate = buildEquivalentCandidate(source, targetSeries, suggestedCodeOverride, {
      generationStatus: 'exact_known',
      requiresCheck: false,
      generationCheckNotes: [],
      isExactKnownExample: true,
    });
    return candidate ? [candidate] : [];
  }

  if (isHydraulicValveCategory(source.resolverCategoryKey)) {
    const generated = buildHydraulicValveEquivalentCandidates(source, targetSeries);
    if (generated.length > 0) {
      return generated
        .map((entry) => buildEquivalentCandidateFromGenerated(source, targetSeries, entry))
        .filter((candidate): candidate is EquivalentCandidate => candidate !== null);
    }
  }

  if (source.resolverCategoryKey === ROLLING_BEARING_CATEGORY) {
    const generated = buildRollingBearingEquivalentCandidates(source);
    if (generated.length > 0) {
      return generated
        .map((entry) => buildEquivalentCandidateFromGenerated(source, targetSeries, entry))
        .filter((candidate): candidate is EquivalentCandidate => candidate !== null);
    }
  }

  const candidate = buildEquivalentCandidate(source, targetSeries);
  return candidate ? [candidate] : [];
}

function mergeCandidateGeneration(
  existing: EquivalentCandidate,
  next: EquivalentCandidate
): EquivalentCandidate['generation'] {
  const left = existing.generation;
  const right = next.generation;
  if (!left && !right) {
    return undefined;
  }

  const isExactKnownExample = Boolean(left?.isExactKnownExample || right?.isExactKnownExample);
  const hasGeneratedFull =
    left?.generationStatus === 'generated_full' || right?.generationStatus === 'generated_full';

  let generationStatus = right?.generationStatus ?? left?.generationStatus ?? 'generated_partial';
  if (isExactKnownExample && hasGeneratedFull) {
    generationStatus = 'generated_full';
  } else if (isExactKnownExample && !hasGeneratedFull) {
    generationStatus = 'exact_known';
  }

  return {
    generationStatus,
    requiresCheck: Boolean(left?.requiresCheck || right?.requiresCheck),
    generationCheckNotes: [
      ...new Set([...(left?.generationCheckNotes ?? []), ...(right?.generationCheckNotes ?? [])]),
    ],
    generationInfoNotes: [
      ...new Set([...(left?.generationInfoNotes ?? []), ...(right?.generationInfoNotes ?? [])]),
    ],
    isExactKnownExample,
    generationTraceSummaryTr:
      right?.generationTraceSummaryTr ?? left?.generationTraceSummaryTr,
  };
}

function upsertCandidate(
  pool: Map<string, DiscoveredEquivalentCandidate>,
  entry: DiscoveredEquivalentCandidate,
): void {
  const key = candidateDedupeKey(entry.candidate);
  if (!key) {
    return;
  }

  const existing = pool.get(key);
  if (!existing) {
    pool.set(key, entry);
    return;
  }

  const mergedCandidate: EquivalentCandidate = {
    ...entry.candidate,
    generation: mergeCandidateGeneration(existing.candidate, entry.candidate),
  };
  const mergedEntry: DiscoveredEquivalentCandidate = {
    ...entry,
    candidate: mergedCandidate,
  };

  const existingRank = reasonRank(existing.reason);
  const nextRank = reasonRank(entry.reason);
  if (
    nextRank > existingRank ||
    (nextRank === existingRank &&
      confidenceRank(entry.coarseMatchConfidence) > confidenceRank(existing.coarseMatchConfidence))
  ) {
    pool.set(key, {
      ...mergedEntry,
      notes: [...(existing.notes ?? []), ...(entry.notes ?? [])],
    });
    return;
  }

  pool.set(key, {
    ...existing,
    candidate: mergeCandidateGeneration(existing.candidate, entry.candidate)
      ? {
          ...existing.candidate,
          generation: mergeCandidateGeneration(existing.candidate, entry.candidate),
        }
      : existing.candidate,
    notes: [...(existing.notes ?? []), ...(entry.notes ?? [])],
  });
}

function collectEquivalenceGroupCandidates(
  source: ProductIdentification,
  catalog: EquivalentCandidateCatalog,
  pool: Map<string, DiscoveredEquivalentCandidate>,
): void {
  if (!source.seriesId) {
    return;
  }

  const group = catalog.equivalenceGroups.find((g) => g.seriesIds.includes(source.seriesId!));
  if (!group) {
    return;
  }

  for (const seriesId of group.seriesIds) {
    if (seriesId === source.seriesId) {
      continue;
    }

    const series = catalog.series.find((s) => s.id === seriesId);
    if (!series) {
      continue;
    }

    const candidates = buildEquivalentCandidatesForTargetSeries(source, series);
    for (const candidate of candidates) {
      upsertCandidate(pool, {
        candidate,
        reason: 'equivalence_group',
        coarseMatchConfidence: 'high',
        notes: [`Muadil grubu: ${group.name}`],
      });
    }
  }
}

function inferProfileDiscoveryForSeries(
  source: ProductIdentification,
  sourceSeries: ProductSeriesRecord,
  targetSeries: ProductSeriesRecord,
): Omit<DiscoveredEquivalentCandidate, 'candidate'> | null {
  const category = source.resolverCategoryKey;

  if (!resolverCategoriesMatch(category, targetSeries.resolverCategory)) {
    return null;
  }

  if (isHydraulicValveCategory(category)) {
    const relation = hydraulicMountingRelation(source, sourceSeries, targetSeries);
    if (relation === 'different') {
      return null;
    }
    if (relation === 'same') {
      return {
        reason: 'same_mounting_standard',
        coarseMatchConfidence: 'high',
        notes: ['Aynı CETOP/NG montaj standardı'],
      };
    }
    return {
      reason: 'same_category_profile',
      coarseMatchConfidence: 'low',
      notes: ['Montaj standardı belirsiz; yalnızca kategori eşleşmesi'],
    };
  }

  if (isPneumaticCylinderCategory(category)) {
    const sourceStd = source.standardFamily.value;
    const targetStd = targetSeries.standardFamily;
    const sameStandard =
      Boolean(sourceStd && targetStd && sourceStd === targetStd) ||
      (isIso15552StandardFamily(sourceStd) && isIso15552StandardFamily(targetStd));

    if (sameStandard) {
      return {
        reason: 'same_standard_family',
        coarseMatchConfidence: 'high',
        notes: ['Aynı standart ailesi (ör. ISO 15552)'],
      };
    }

    const sourceGroup = sourceSeries.equivalenceGroupId ?? sourceSeries.equivalenceGroup;
    const targetGroup = targetSeries.equivalenceGroupId ?? targetSeries.equivalenceGroup;
    if (sourceGroup && targetGroup && sourceGroup === targetGroup) {
      return {
        reason: 'same_standard_family',
        coarseMatchConfidence: 'medium',
      };
    }

    return null;
  }

  return {
    reason: 'same_category_profile',
    coarseMatchConfidence: 'low',
  };
}

function collectSeriesProfileCandidates(
  source: ProductIdentification,
  catalog: EquivalentCandidateCatalog,
  pool: Map<string, DiscoveredEquivalentCandidate>,
): void {
  if (!source.seriesId) {
    return;
  }

  const sourceSeries = catalog.series.find((s) => s.id === source.seriesId);
  if (!sourceSeries) {
    return;
  }

  const category = source.resolverCategoryKey;
  if (category !== HYDRAULIC_VALVE_CATEGORY && category !== PNEUMATIC_CYLINDER_CATEGORY) {
    return;
  }

  for (const targetSeries of catalog.series) {
    if (targetSeries.id === source.seriesId) {
      continue;
    }

    const profile = inferProfileDiscoveryForSeries(source, sourceSeries, targetSeries);
    if (!profile) {
      continue;
    }

    const candidates = buildEquivalentCandidatesForTargetSeries(source, targetSeries);
    for (const candidate of candidates) {
      if (
        isPneumaticCylinderCategory(category) &&
        candidate.targetIdentification &&
        !pneumaticDimensionsMatch(source, candidate.targetIdentification)
      ) {
        continue;
      }

      upsertCandidate(pool, {
        candidate,
        ...profile,
      });
    }
  }
}

function collectCatalogExampleCandidates(
  source: ProductIdentification,
  sourceCode: string,
  catalog: EquivalentCandidateCatalog,
  pool: Map<string, DiscoveredEquivalentCandidate>,
): void {
  if (!source.seriesId) {
    return;
  }

  const sourceSeries = getProductSeriesById(source.seriesId);
  if (!sourceSeries) {
    return;
  }

  const normalizedSource = normalizeCode(sourceCode);
  const codes = catalog.exampleCodes ?? getAllCatalogExampleCodes();

  for (const exampleCode of codes) {
    if (normalizeCode(exampleCode) === normalizedSource) {
      continue;
    }

    const targetIdentification = identifyProduct(exampleCode, normalizeCode(exampleCode));
    if (targetIdentification.outcome !== 'full' || !targetIdentification.seriesId) {
      continue;
    }

    if (targetIdentification.seriesId === source.seriesId) {
      continue;
    }

    if (
      !resolverCategoriesMatch(
        source.resolverCategoryKey,
        targetIdentification.resolverCategoryKey,
      )
    ) {
      continue;
    }

    const targetSeries = catalog.series.find((s) => s.id === targetIdentification.seriesId);
    if (!targetSeries) {
      continue;
    }

    if (isHydraulicValveCategory(source.resolverCategoryKey)) {
      const relation = hydraulicMountingRelation(source, sourceSeries, targetSeries);
      if (relation === 'different') {
        continue;
      }
    }

    if (isPneumaticCylinderCategory(source.resolverCategoryKey)) {
      if (!pneumaticDimensionsMatch(source, targetIdentification)) {
        continue;
      }
    }

    const candidates = buildEquivalentCandidatesForTargetSeries(
      source,
      targetSeries,
      exampleCode
    );
    for (const candidate of candidates) {
      const profile = inferProfileDiscoveryForSeries(source, sourceSeries, targetSeries);
      upsertCandidate(pool, {
        candidate,
        reason: profile?.reason ?? 'same_category_profile',
        coarseMatchConfidence: profile?.coarseMatchConfidence ?? 'medium',
        notes: profile?.notes,
      });
    }
  }
}

function buildRollingBearingEquivalentCandidate(
  source: ProductIdentification,
  generated: GeneratedEquivalentCandidate
): EquivalentCandidate | null {
  const series = getProductSeriesById(source.seriesId ?? '');
  if (!series) {
    return null;
  }

  if (normalizeCode(generated.generatedCode) === normalizeCode(source.inputCode)) {
    return null;
  }

  const targetIdentification = identifyProduct(
    generated.generatedCode,
    normalizeCode(generated.generatedCode)
  );
  if (
    !targetIdentification.matched ||
    targetIdentification.bearingDecode?.dimensions.status !== 'complete'
  ) {
    return null;
  }

  return {
    seriesId: series.id,
    brand: generated.manufacturer,
    series: generated.series,
    productType: targetIdentification.productType.value ?? series.productType,
    productCategory: series.productCategory,
    standardFamily: series.standardFamily,
    suggestedCode: generated.generatedCode,
    targetIdentification,
    generation: generationToCandidateMetadata(generated),
  };
}

function collectRollingBearingCrossBrandCandidates(
  source: ProductIdentification,
  pool: Map<string, DiscoveredEquivalentCandidate>
): void {
  if (source.resolverCategoryKey !== ROLLING_BEARING_CATEGORY || !source.seriesId) {
    return;
  }

  const generated = buildRollingBearingEquivalentCandidates(source);
  for (const entry of generated) {
    const candidate = buildRollingBearingEquivalentCandidate(source, entry);
    if (!candidate) {
      continue;
    }
    upsertCandidate(pool, {
      candidate,
      reason: 'same_category_profile',
      coarseMatchConfidence: 'medium',
      notes: entry.checkNotes,
    });
  }
}

export function findEquivalentCandidates(
  sourceIdentification: ProductIdentification,
  sourceCode: string,
  catalog: EquivalentCandidateCatalog = DEFAULT_EQUIVALENT_CANDIDATE_CATALOG,
): DiscoveredEquivalentCandidate[] {
  if (!sourceIdentification.seriesId || sourceIdentification.outcome === 'not_found') {
    return [];
  }

  const pool = new Map<string, DiscoveredEquivalentCandidate>();

  if (sourceIdentification.resolverCategoryKey === ROLLING_BEARING_CATEGORY) {
    collectRollingBearingCrossBrandCandidates(sourceIdentification, pool);
    return Array.from(pool.values()).sort((a, b) => {
      const rankDiff = reasonRank(b.reason) - reasonRank(a.reason);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return confidenceRank(b.coarseMatchConfidence) - confidenceRank(a.coarseMatchConfidence);
    });
  }

  collectEquivalenceGroupCandidates(sourceIdentification, catalog, pool);
  collectSeriesProfileCandidates(sourceIdentification, catalog, pool);
  collectCatalogExampleCandidates(sourceIdentification, sourceCode, catalog, pool);

  return Array.from(pool.values()).sort((a, b) => {
    const rankDiff = reasonRank(b.reason) - reasonRank(a.reason);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return confidenceRank(b.coarseMatchConfidence) - confidenceRank(a.coarseMatchConfidence);
  });
}

/** @internal Dev/test helper: candidate counts by discovery reason. */
export function summarizeEquivalentCandidateDiscovery(
  sourceCode: string,
  catalog: EquivalentCandidateCatalog = DEFAULT_EQUIVALENT_CANDIDATE_CATALOG,
): {
  sourceCode: string;
  totalCandidates: number;
  byReason: Record<EquivalentCandidateReason, number>;
} {
  const normalized = normalizeCode(sourceCode);
  const source = identifyProduct(sourceCode, normalized);
  const discoveries = findEquivalentCandidates(source, sourceCode, catalog);
  const byReason = {} as Record<EquivalentCandidateReason, number>;
  for (const discovery of discoveries) {
    byReason[discovery.reason] = (byReason[discovery.reason] ?? 0) + 1;
  }
  return {
    sourceCode,
    totalCandidates: discoveries.length,
    byReason,
  };
}

export function logEquivalentCandidateDiscoveryDiagnostics(
  sourceCode: string,
  catalog: EquivalentCandidateCatalog = DEFAULT_EQUIVALENT_CANDIDATE_CATALOG,
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  const summary = summarizeEquivalentCandidateDiscovery(sourceCode, catalog);
  console.log('[findEquivalentCandidates]', JSON.stringify(summary));
}
