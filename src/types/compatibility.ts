import type { ProductIdentification } from './product';
import type { EquivalentGenerationMetadata } from './equivalentCodeGeneration';

export type CompatibilityStatus = 'compatible' | 'different' | 'unknownOrCheck';

export type CheckSeverity = 'low' | 'medium' | 'high';

export type RiskLevel = 'low' | 'medium' | 'high';

/** Known-behavior alignment (independent of how complete the data is). */
export type CompatibilityLevel = 'high' | 'medium' | 'low' | 'not_compatible';

/** Trust in evidence backing the comparison. */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** How much comparable data was available on both sides. */
export type DataCompletenessLevel = 'high' | 'medium' | 'low';

export interface CompatibilityMetadata {
  compatibilityLevel: CompatibilityLevel;
  confidenceLevel: ConfidenceLevel;
  dataCompleteness: DataCompletenessLevel;
}

export type MatchLevelTr =
  | 'Yüksek uyumlu muadil adayı'
  | 'Mekanik muadil adayı'
  | 'Fonksiyonel alternatif';

export type AttributeImportance = 'critical' | 'important' | 'optional';

export interface AttributeComparison {
  label: string;
  sourceDisplay: string;
  targetDisplay: string;
  status: CompatibilityStatus;
  /** Evidence-based check text; avoids generic “yeterli kesin bilgi yok” when set. */
  checkReasonTr?: string;
  /** Review-gated catalog note shown under compatible rows (not a mismatch). */
  reviewNoteTr?: string;
}

export interface ScoredAttributeComparison extends AttributeComparison {
  importance: AttributeImportance;
}

export interface ProfileScoringData {
  scoredComparisons: ScoredAttributeComparison[];
}

export interface CheckItem {
  field: string;
  sourceValue: string;
  targetValue: string;
  reasonTr: string;
  severity: CheckSeverity;
}

export interface EquivalenceSummary {
  matchLevelTr: MatchLevelTr;
  summaryTr: string;
  riskLevel: RiskLevel;
}

export interface EquivalentCandidate {
  seriesId: string;
  brand: string;
  series: string;
  productType: string;
  productCategory: string;
  standardFamily: string;
  suggestedCode: string | null;
  targetIdentification: ProductIdentification | null;
  generation?: EquivalentGenerationMetadata;
}

export interface CompatibilityResult {
  candidate: EquivalentCandidate;
  summary: EquivalenceSummary;
  compatible: AttributeComparison[];
  different: AttributeComparison[];
  checkItems: CheckItem[];
  warnings: string[];
  /** Universal profile comparisons used for match percentage scoring. */
  profileScoring?: ProfileScoringData;
  /** Optional hydraulic (and future) comparison quality metadata. */
  metadata?: CompatibilityMetadata;
  /** Backend-provided score; when set, UI uses this instead of recalculating. */
  serverMatchPercentage?: number;
}
