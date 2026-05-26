import equivalenceProfilesData from '@/data/equivalenceProfiles.json';
import type { EquivalenceProfileRecord, EquivalenceSummary } from '@/types/product';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { getCatalogSeriesById } from './adapters/catalogV2Adapter';

const equivalenceProfiles = equivalenceProfilesData as EquivalenceProfileRecord[];

/**
 * Resolves comparison summary from legacy equivalenceProfiles.json when both series
 * share the same v2 equivalence group. Prepares future Firebase migration without
 * changing scoring behavior.
 */
export function lookupEquivalenceProfile(
  sourceSeriesId: string | null | undefined,
  targetSeriesId: string | null | undefined
): EquivalenceProfileRecord | undefined {
  if (!sourceSeriesId || !targetSeriesId) {
    return undefined;
  }

  const source = getCatalogSeriesById(sourceSeriesId);
  const target = getCatalogSeriesById(targetSeriesId);
  if (!source || !target) {
    return undefined;
  }

  if (source.equivalenceGroupId !== target.equivalenceGroupId) {
    return undefined;
  }

  return equivalenceProfiles.find(
    (profile) =>
      profile.sourceSeriesId === sourceSeriesId && profile.targetSeriesId === targetSeriesId
  );
}

export function lookupEquivalenceSummaryFromCatalog(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): EquivalenceSummary | undefined {
  const profile = lookupEquivalenceProfile(source.seriesId, candidate.seriesId);
  if (!profile) {
    return undefined;
  }

  return {
    matchLevelTr: profile.matchLevelTr,
    summaryTr: profile.summaryTr,
    riskLevel: profile.riskLevel,
  };
}
