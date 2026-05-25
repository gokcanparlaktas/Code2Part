import type {
  CheckSeverity,
  MatchLevelTr,
  RiskLevel,
} from './compatibility';

export type EvidenceLevel =
  | 'code'
  | 'series_table'
  | 'standard'
  | 'inferred'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type IdentificationOutcome = 'full' | 'series_only' | 'not_found';

export interface TechnicalAttribute<T = string | number> {
  value: T | null;
  unit?: string;
  evidence: EvidenceLevel;
  requiresCheck: boolean;
}

export interface ProductIdentification {
  inputCode: string;
  normalizedCode: string;
  seriesId: string | null;
  matched: boolean;
  outcome: IdentificationOutcome;
  brand: TechnicalAttribute<string>;
  series: TechnicalAttribute<string>;
  productType: TechnicalAttribute<string>;
  productCategory: TechnicalAttribute<string>;
  standardFamily: TechnicalAttribute<string>;
  bore: TechnicalAttribute<number>;
  stroke: TechnicalAttribute<number>;
  confidence: ConfidenceLevel;
}

export interface ProductSeriesRecord {
  id: string;
  brand: string;
  series: string;
  productType: string;
  productCategory: string;
  standardFamily: string;
  codePrefix: string;
  matchPrefixes?: string[];
  suggestedCodeTemplate?: string;
  confidenceWhenMatched: ConfidenceLevel;
  equivalenceGroupId?: string;
}

export interface ParsingRuleRecord {
  seriesId: string;
  pattern: string;
  boreGroup: number;
  strokeGroup: number;
}

export interface EquivalentGroupRecord {
  id: string;
  name: string;
  seriesIds: string[];
}

export interface CylinderCheckItemRecord {
  field: string;
  sourceValue: string;
  targetValue: string;
  reasonTr: string;
  severity: CheckSeverity;
}

export interface EquivalenceProfileRecord {
  sourceSeriesId: string;
  targetSeriesId: string;
  matchLevelTr: MatchLevelTr;
  summaryTr: string;
  riskLevel: RiskLevel;
}

export interface CylinderCheckItemsRecord {
  equivalenceGroupId: string;
  items: CylinderCheckItemRecord[];
}
