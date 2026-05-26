import {
  getLegacyEquivalentGroups,
  getLegacyParsingRules,
  getLegacyProductSeries,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import type {
  DataReliabilityMetadata,
  ReliabilitySummary,
  VerificationStatus,
} from '@/types/catalogMetadata';
import type { EquivalentGroupRecord, ProductSeriesRecord } from '@/types/product';

const productSeries = getLegacyProductSeries();
const parsingRules = getLegacyParsingRules();
const equivalenceGroups = getLegacyEquivalentGroups();

export function isUnverifiedStatus(status: VerificationStatus): boolean {
  return status === 'manual_unverified' || status === 'mock';
}

export function isSeriesDataUnverified(seriesId: string | null): boolean {
  if (!seriesId) {
    return false;
  }
  const series = getProductSeriesById(seriesId);
  return series ? isUnverifiedStatus(series.verificationStatus) : false;
}

export function getEquivalenceGroupBySeriesId(
  seriesId: string | null
): EquivalentGroupRecord | undefined {
  if (!seriesId) {
    return undefined;
  }
  const series = getProductSeriesById(seriesId);
  const groupId = series?.equivalenceGroupId ?? series?.equivalenceGroup;
  if (!groupId) {
    return undefined;
  }
  return equivalenceGroups.find((g) => g.id === groupId);
}

export function isEquivalenceMappingUnverified(seriesId: string | null): boolean {
  const group = getEquivalenceGroupBySeriesId(seriesId);
  return group ? isUnverifiedStatus(group.verificationStatus) : false;
}

function countByStatus(
  records: DataReliabilityMetadata[],
  summary: ReliabilitySummary
): void {
  records.forEach((record) => {
    summary.totalRecords += 1;
    switch (record.verificationStatus) {
      case 'source_verified':
        summary.sourceVerifiedCount += 1;
        break;
      case 'manual_verified':
        summary.manualVerifiedCount += 1;
        break;
      case 'manual_unverified':
        summary.manualUnverifiedCount += 1;
        break;
      case 'mock':
        summary.mockCount += 1;
        break;
    }
  });
}

export function computeReliabilitySummary(
  series: DataReliabilityMetadata[],
  parsers: DataReliabilityMetadata[],
  groups: DataReliabilityMetadata[]
): ReliabilitySummary {
  const summary: ReliabilitySummary = {
    totalRecords: 0,
    sourceVerifiedCount: 0,
    manualVerifiedCount: 0,
    manualUnverifiedCount: 0,
    mockCount: 0,
  };

  countByStatus(series, summary);
  countByStatus(parsers, summary);
  countByStatus(groups, summary);

  return summary;
}

export function getReliabilitySummaryFromCatalog(): ReliabilitySummary {
  return computeReliabilitySummary(productSeries, parsingRules, equivalenceGroups);
}
