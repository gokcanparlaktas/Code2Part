import type {
  CheckSeverity,
  MatchLevelTr,
  RiskLevel,
} from './compatibility';
import type { DataReliabilityMetadata } from './catalogMetadata';
import type { ProductResolverCategory } from './category';

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
  resolverCategoryKey: ProductResolverCategory | null;
  matched: boolean;
  outcome: IdentificationOutcome;
  brand: TechnicalAttribute<string>;
  series: TechnicalAttribute<string>;
  productType: TechnicalAttribute<string>;
  productCategory: TechnicalAttribute<string>;
  standardFamily: TechnicalAttribute<string>;
  bore: TechnicalAttribute<number>;
  stroke: TechnicalAttribute<number>;
  cetopNgSize?: TechnicalAttribute<string>;
  valveCoilVoltage?: TechnicalAttribute<string>;
  valveSpoolFunction?: TechnicalAttribute<string>;
  confidence: ConfidenceLevel;
}

export interface ProductSeriesRecord extends DataReliabilityMetadata {
  id: string;
  brand: string;
  series: string;
  technology: string;
  resolverCategory: ProductResolverCategory;
  category: string;
  equivalenceGroup: string;
  productType: string;
  productCategory: string;
  standardFamily: string;
  codePrefix: string;
  matchPrefixes?: string[];
  suggestedCodeTemplate?: string;
  confidenceWhenMatched: ConfidenceLevel;
  equivalenceGroupId?: string;
  cetopNgLabel?: string;
  defaultCoilVoltageTr?: string;
  exampleProductCodes?: string[];
}

export interface ParsingRuleRecord extends DataReliabilityMetadata {
  id?: string;
  seriesId: string;
  pattern: string;
  boreGroup: number;
  strokeGroup: number;
}

export interface EquivalentGroupRecord extends DataReliabilityMetadata {
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
