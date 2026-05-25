import type { ProductIdentification } from './product';

export type CompatibilityStatus = 'compatible' | 'different' | 'unknownOrCheck';

export type CheckSeverity = 'low' | 'medium' | 'high';

export type RiskLevel = 'low' | 'medium' | 'high';

export type MatchLevelTr =
  | 'Yüksek uyumlu muadil adayı'
  | 'Mekanik muadil adayı'
  | 'Fonksiyonel alternatif';

export interface AttributeComparison {
  label: string;
  sourceDisplay: string;
  targetDisplay: string;
  status: CompatibilityStatus;
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
}

export interface CompatibilityResult {
  candidate: EquivalentCandidate;
  summary: EquivalenceSummary;
  compatible: AttributeComparison[];
  different: AttributeComparison[];
  checkItems: CheckItem[];
  warnings: string[];
}
