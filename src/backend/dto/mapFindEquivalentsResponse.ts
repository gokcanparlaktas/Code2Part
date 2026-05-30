import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import type { CompatibilityResult } from '@/types/compatibility';

import { assertNoForbiddenBackendResponseKeys } from './backendResponseSecurity';

export interface FindEquivalentsSourceDto {
  code: string;
  normalizedCode: string;
  manufacturer: string | null;
  series: string | null;
}

export interface FindEquivalentsCandidateDto {
  code: string;
  manufacturer: string;
  series: string;
  matchPercentage: number;
  generationStatus?: 'exact_known' | 'generated_full' | 'generated_partial' | 'cannot_generate';
  requiresCheck?: boolean;
  metadata: {
    compatibilityLevel: NonNullable<CompatibilityResult['metadata']>['compatibilityLevel'];
    confidenceLevel: NonNullable<CompatibilityResult['metadata']>['confidenceLevel'];
    dataCompleteness: NonNullable<CompatibilityResult['metadata']>['dataCompleteness'];
  };
  summary: string;
  compatibleHighlights: string[];
  checkNotes: string[];
}

export interface FindEquivalentsResponseDto {
  source: FindEquivalentsSourceDto;
  candidates: FindEquivalentsCandidateDto[];
}

function buildCompatibleHighlights(result: CompatibilityResult, limit = 4): string[] {
  return result.compatible.slice(0, limit).map((row) => {
    if (row.sourceDisplay === row.targetDisplay) {
      return `${row.label}: ${row.sourceDisplay}`;
    }
    return `${row.label}: ${row.sourceDisplay} / ${row.targetDisplay}`;
  });
}

function buildCheckNotes(result: CompatibilityResult): string[] {
  return result.checkItems.map((item) => item.reasonTr).filter(Boolean);
}

export function mapFindEquivalentsResponse(options: {
  sourceCode: string;
  normalizedCode: string;
  manufacturer: string | null;
  series: string | null;
  candidates: Array<{
    code: string;
    manufacturer: string;
    series: string;
    matchPercentage: number;
    generationStatus?: FindEquivalentsCandidateDto['generationStatus'];
    requiresCheck?: boolean;
    metadata: FindEquivalentsCandidateDto['metadata'];
    summary: string;
    compatibleHighlights: string[];
    checkNotes: string[];
  }>;
}): FindEquivalentsResponseDto {
  const dto: FindEquivalentsResponseDto = {
    source: {
      code: options.sourceCode,
      normalizedCode: options.normalizedCode,
      manufacturer: options.manufacturer,
      series: options.series,
    },
    candidates: options.candidates.map((candidate) => ({
      code: candidate.code,
      manufacturer: candidate.manufacturer,
      series: candidate.series,
      matchPercentage: candidate.matchPercentage,
      generationStatus: candidate.generationStatus,
      requiresCheck: candidate.requiresCheck,
      metadata: candidate.metadata,
      summary: candidate.summary,
      compatibleHighlights: candidate.compatibleHighlights,
      checkNotes: candidate.checkNotes,
    })),
  };

  assertNoForbiddenBackendResponseKeys(dto);
  return dto;
}

export function mapComparisonToEquivalentCandidateSummary(
  result: CompatibilityResult,
  candidateCode: string,
  candidateManufacturer: string,
  candidateSeries: string,
  matchPercentage: number
): FindEquivalentsCandidateDto {
  const mapped: FindEquivalentsCandidateDto = {
    code: candidateCode,
    manufacturer: candidateManufacturer,
    series: candidateSeries,
    matchPercentage,
    generationStatus: result.candidate.generation?.generationStatus,
    requiresCheck: result.candidate.generation?.requiresCheck,
    metadata: {
      compatibilityLevel: result.metadata?.compatibilityLevel ?? 'low',
      confidenceLevel: result.metadata?.confidenceLevel ?? 'low',
      dataCompleteness: result.metadata?.dataCompleteness ?? 'low',
    },
    summary: result.summary.summaryTr,
    compatibleHighlights: buildCompatibleHighlights(result),
    checkNotes: buildCheckNotes(result),
  };

  assertNoForbiddenBackendResponseKeys(mapped);
  return mapped;
}
