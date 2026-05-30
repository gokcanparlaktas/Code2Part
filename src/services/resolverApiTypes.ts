import type { CompatibilityResult } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

export interface IdentifyProductResponseDto {
  normalizedCode: string;
  manufacturer: string | null;
  series: string | null;
  category: string | null;
  outcome: ProductIdentification['outcome'];
  confidence: ProductIdentification['confidence'];
  technicalAttributes: Array<{
    key: string;
    label: string;
    value: string;
    evidence: string;
    requiresCheck: boolean;
  }>;
  productDetailRows: Array<{
    label: string;
    value: string;
    evidence: string;
    requiresCheck: boolean;
  }>;
  warnings: string[];
  parseCompleteness?: 'fully_parsed' | 'partial' | 'unknown';
  unknownTokens?: string[];
  unresolvedSegments?: string[];
  parserNotes?: string[];
}

export interface CompareProductsResponseDto {
  sourceCode: string;
  candidateCode: string;
  metadata: NonNullable<CompatibilityResult['metadata']>;
  summary: {
    matchLevelTr: string;
    summaryTr: string;
    riskLevel: CompatibilityResult['summary']['riskLevel'];
    matchPercentage: number;
  };
  compatible: Array<{
    label: string;
    sourceDisplay: string;
    targetDisplay: string;
    status: 'compatible' | 'different' | 'unknownOrCheck';
  }>;
  different: CompareProductsResponseDto['compatible'];
  unknownOrCheck: Array<{
    field: string;
    sourceValue: string;
    targetValue: string;
    reasonTr: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  warnings: string[];
}

export interface FindEquivalentsResponseDto {
  source: {
    code: string;
    normalizedCode: string;
    manufacturer: string | null;
    series: string | null;
  };
  candidates: Array<{
    code: string;
    manufacturer: string;
    series: string;
    matchPercentage: number;
    generationStatus?: 'exact_known' | 'generated_full' | 'generated_partial' | 'cannot_generate';
    requiresCheck?: boolean;
    metadata: NonNullable<CompatibilityResult['metadata']>;
    summary: string;
    compatibleHighlights: string[];
    checkNotes: string[];
  }>;
}

export interface ResolverApiErrorBody {
  error?: string;
  code?: string;
}
