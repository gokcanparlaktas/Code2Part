export type EvidenceLevel =
  | 'code'
  | 'series_table'
  | 'standard'
  | 'inferred'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

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
  brand: TechnicalAttribute<string>;
  series: TechnicalAttribute<string>;
  productType: TechnicalAttribute<string>;
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
  standardFamily: string;
  codePrefix: string;
  confidenceWhenMatched: ConfidenceLevel;
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
