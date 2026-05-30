import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  MatchLevelTr,
} from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import type {
  CompareProductsResponseDto,
  FindEquivalentsResponseDto,
  IdentifyProductResponseDto,
} from './resolverApiTypes';

export interface ProductDetailRowView {
  label: string;
  value: string;
  evidence: string;
  requiresCheck: boolean;
}

export interface ResolvedIdentifyProduct {
  identification: ProductIdentification;
  productDetailRows: ProductDetailRowView[];
  warnings: string[];
  source: 'local' | 'backend';
}

export interface ResolvedProductSearch extends ResolvedIdentifyProduct {
  compatibilityResults: CompatibilityResult[];
  hasEquivalents: boolean;
}

function emptyAttribute<T = string>(value: T | null = null): ProductIdentification['brand'] {
  return {
    value,
    evidence: 'unknown',
    requiresCheck: value === null,
  };
}

function metadataToMatchLevel(metadata: CompatibilityResult['metadata']): MatchLevelTr {
  if (metadata?.compatibilityLevel === 'high') {
    return 'Yüksek uyumlu muadil adayı';
  }
  if (metadata?.compatibilityLevel === 'medium') {
    return 'Mekanik muadil adayı';
  }
  return 'Fonksiyonel alternatif';
}

function metadataToRiskLevel(metadata: CompatibilityResult['metadata']): CompatibilityResult['summary']['riskLevel'] {
  if (metadata?.compatibilityLevel === 'high') {
    return 'low';
  }
  if (metadata?.compatibilityLevel === 'medium') {
    return 'medium';
  }
  return 'high';
}

function parseHighlightLine(text: string, index: number): AttributeComparison {
  const separatorIndex = text.indexOf(':');
  if (separatorIndex === -1) {
    return {
      label: `Alan ${index + 1}`,
      sourceDisplay: text,
      targetDisplay: text,
      status: 'compatible',
    };
  }

  const label = text.slice(0, separatorIndex).trim();
  const value = text.slice(separatorIndex + 1).trim();
  return {
    label: label || `Alan ${index + 1}`,
    sourceDisplay: value || text,
    targetDisplay: value || text,
    status: 'compatible',
  };
}

function mapCheckNotesToItems(checkNotes: string[]): CheckItem[] {
  return checkNotes.map((reasonTr, index) => ({
    field: `Kontrol ${index + 1}`,
    sourceValue: '',
    targetValue: '',
    reasonTr,
    severity: 'medium',
  }));
}

export function mapIdentifyProductDtoToResolved(
  dto: IdentifyProductResponseDto,
  inputCode: string
): ResolvedIdentifyProduct {
  const identification: ProductIdentification = {
    inputCode,
    normalizedCode: dto.normalizedCode,
    seriesId: null,
    resolverCategoryKey: null,
    matched: dto.outcome === 'full',
    outcome: dto.outcome,
    brand: {
      value: dto.manufacturer,
      evidence: dto.manufacturer ? 'series_table' : 'unknown',
      requiresCheck: !dto.manufacturer,
    },
    series: {
      value: dto.series,
      evidence: dto.series ? 'series_table' : 'unknown',
      requiresCheck: !dto.series,
    },
    productType: emptyAttribute(null),
    productCategory: {
      value: dto.category,
      evidence: dto.category ? 'series_table' : 'unknown',
      requiresCheck: !dto.category,
    },
    standardFamily: emptyAttribute(null),
    bore: emptyAttribute<number>(null),
    stroke: emptyAttribute<number>(null),
    confidence: dto.confidence,
  };

  return {
    identification,
    productDetailRows: dto.productDetailRows,
    warnings: dto.warnings,
    source: 'backend',
  };
}

export function mapCompareProductsDtoToCompatibilityResult(
  dto: CompareProductsResponseDto
): CompatibilityResult {
  return {
    candidate: {
      seriesId: dto.candidateCode,
      brand: '',
      series: '',
      productType: '',
      productCategory: '',
      standardFamily: '',
      suggestedCode: dto.candidateCode,
      targetIdentification: null,
    },
    summary: {
      matchLevelTr: dto.summary.matchLevelTr as MatchLevelTr,
      summaryTr: dto.summary.summaryTr,
      riskLevel: dto.summary.riskLevel,
    },
    metadata: dto.metadata,
    compatible: dto.compatible.map((row) => ({
      label: row.label,
      sourceDisplay: row.sourceDisplay,
      targetDisplay: row.targetDisplay,
      status: row.status,
    })),
    different: dto.different.map((row) => ({
      label: row.label,
      sourceDisplay: row.sourceDisplay,
      targetDisplay: row.targetDisplay,
      status: row.status,
    })),
    checkItems: dto.unknownOrCheck.map((item) => ({
      field: item.field,
      sourceValue: item.sourceValue,
      targetValue: item.targetValue,
      reasonTr: item.reasonTr,
      severity: item.severity,
    })),
    warnings: [...dto.warnings],
    serverMatchPercentage: dto.summary.matchPercentage,
  };
}

export function mapFindEquivalentsCandidateToCompatibilityResult(
  candidate: FindEquivalentsResponseDto['candidates'][number]
): CompatibilityResult {
  return {
    candidate: {
      seriesId: candidate.series,
      brand: candidate.manufacturer,
      series: candidate.series,
      productType: '',
      productCategory: '',
      standardFamily: '',
      suggestedCode: candidate.code,
      targetIdentification: null,
    },
    summary: {
      matchLevelTr: metadataToMatchLevel(candidate.metadata),
      summaryTr: candidate.summary,
      riskLevel: metadataToRiskLevel(candidate.metadata),
    },
    metadata: candidate.metadata,
    compatible: candidate.compatibleHighlights.map(parseHighlightLine),
    different: [],
    checkItems: mapCheckNotesToItems(candidate.checkNotes),
    warnings: [],
    serverMatchPercentage: candidate.matchPercentage,
  };
}

export function mapFindEquivalentsDtoToCompatibilityResults(
  dto: FindEquivalentsResponseDto
): CompatibilityResult[] {
  return dto.candidates.map(mapFindEquivalentsCandidateToCompatibilityResult);
}

export function enrichCompareResultCandidate(
  result: CompatibilityResult,
  candidate: FindEquivalentsResponseDto['candidates'][number]
): CompatibilityResult {
  return {
    ...result,
    candidate: {
      ...result.candidate,
      brand: candidate.manufacturer,
      series: candidate.series,
      suggestedCode: candidate.code,
      seriesId: candidate.series,
    },
  };
}
