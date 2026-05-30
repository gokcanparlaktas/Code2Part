import type { CompatibilityResult } from '@/types/compatibility';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

import { assertNoForbiddenBackendResponseKeys } from './backendResponseSecurity';

export interface CompareProductsAttributeDto {
  label: string;
  sourceDisplay: string;
  targetDisplay: string;
  status: 'compatible' | 'different' | 'unknownOrCheck';
}

export interface CompareProductsCheckItemDto {
  field: string;
  sourceValue: string;
  targetValue: string;
  reasonTr: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CompareProductsResponseDto {
  sourceCode: string;
  candidateCode: string;
  metadata: {
    compatibilityLevel: NonNullable<CompatibilityResult['metadata']>['compatibilityLevel'];
    confidenceLevel: NonNullable<CompatibilityResult['metadata']>['confidenceLevel'];
    dataCompleteness: NonNullable<CompatibilityResult['metadata']>['dataCompleteness'];
  };
  summary: {
    matchLevelTr: string;
    summaryTr: string;
    riskLevel: CompatibilityResult['summary']['riskLevel'];
    matchPercentage: number;
  };
  compatible: CompareProductsAttributeDto[];
  different: CompareProductsAttributeDto[];
  unknownOrCheck: CompareProductsCheckItemDto[];
  warnings: string[];
}

function mapAttributeRows(
  rows: CompatibilityResult['compatible']
): CompareProductsAttributeDto[] {
  return rows.map((row) => ({
    label: row.label,
    sourceDisplay: row.sourceDisplay,
    targetDisplay: row.targetDisplay,
    status: row.status,
  }));
}

function mapCheckItems(rows: CompatibilityResult['checkItems']): CompareProductsCheckItemDto[] {
  return rows.map((row) => ({
    field: row.field,
    sourceValue: row.sourceValue,
    targetValue: row.targetValue,
    reasonTr: row.reasonTr,
    severity: row.severity,
  }));
}

export function mapCompareProductsResponse(options: {
  sourceCode: string;
  candidateCode: string;
  result: CompatibilityResult;
}): CompareProductsResponseDto {
  const match = calculateMatchPercentage(options.result);

  const dto: CompareProductsResponseDto = {
    sourceCode: options.sourceCode,
    candidateCode: options.candidateCode,
    metadata: {
      compatibilityLevel: options.result.metadata?.compatibilityLevel ?? 'low',
      confidenceLevel: options.result.metadata?.confidenceLevel ?? 'low',
      dataCompleteness: options.result.metadata?.dataCompleteness ?? 'low',
    },
    summary: {
      matchLevelTr: options.result.summary.matchLevelTr,
      summaryTr: options.result.summary.summaryTr,
      riskLevel: options.result.summary.riskLevel,
      matchPercentage: match.percentage,
    },
    compatible: mapAttributeRows(options.result.compatible),
    different: mapAttributeRows(options.result.different),
    unknownOrCheck: mapCheckItems(options.result.checkItems),
    warnings: [...options.result.warnings],
  };

  assertNoForbiddenBackendResponseKeys(dto);
  return dto;
}
