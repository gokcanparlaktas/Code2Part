import type { DataReliabilityMetadata } from './catalogMetadata';
import type { ProductResolverCategory } from './category';
import type { ConfidenceLevel } from './product';
import type { CheckSeverity } from './compatibility';

export type CatalogConfidence = 'high' | 'medium' | 'low';

export interface CatalogReliabilityMetadata extends DataReliabilityMetadata {}

export interface CatalogAttributeDefinition {
  key: string;
  labelTr: string;
  valueType: 'string' | 'number';
  source: 'code' | 'series_table' | 'standard' | 'inferred';
  defaultValue?: string;
}

export interface CatalogKnownToken {
  token: string;
  meaningTr?: string;
  confidence: CatalogConfidence;
  requiresCatalogCheck: boolean;
  role?: 'cushioning' | 'connector' | 'revision' | 'options' | 'mounting' | 'sensor';
}

export interface CatalogVoltageCode {
  code: string;
  labelTr?: string;
  confidence: CatalogConfidence;
  requiresCatalogCheck: boolean;
  /** Optional regex; when omitted, built-in defaults apply for known codes. */
  matchPattern?: string;
}

export interface CatalogFunctionMappingRef {
  mappingId: string;
}

export interface CatalogCheckRuleRef {
  ruleId: string;
}

export type CatalogCodePatternKind =
  | 'bore_stroke'
  | 'connector'
  | 'revision'
  | 'function_token'
  | 'inferred_voltage';

export interface CatalogCodePattern {
  id: string;
  kind: CatalogCodePatternKind;
  pattern: string;
  captureGroup?: number;
  boreGroup?: number;
  strokeGroup?: number;
  confidence?: CatalogConfidence;
  requiresCatalogCheck?: boolean;
  noteTr?: string;
}

export interface CatalogSeriesCodePatterns {
  boreStroke?: CatalogCodePattern[];
  /** Used when series-specific parsingRules do not match. */
  boreStrokeFallback?: CatalogCodePattern[];
  connector?: CatalogCodePattern[];
  revision?: CatalogCodePattern[];
  functionToken?: CatalogCodePattern[];
  inferredVoltage?: CatalogCodePattern[];
}

export interface CatalogParsingRule {
  id: string;
  pattern: string;
  boreGroup: number;
  strokeGroup: number;
}

export interface CatalogSeries extends CatalogReliabilityMetadata {
  id: string;
  brand: string;
  series: string;
  category: string;
  resolverCategory: ProductResolverCategory;
  productTypeLabel: string;
  productCategoryLabel: string;
  standardFamily: string;
  technology: string;
  equivalenceGroupId: string;
  codePrefix: string;
  matchPrefixes: string[];
  suggestedCodeTemplate?: string;
  confidenceWhenMatched: ConfidenceLevel;
  cetopNgLabel?: string;
  defaultCoilVoltageTr?: string;
  searchAliases: string[];
  exampleCodes: string[];
  attributes: CatalogAttributeDefinition[];
  knownTokens: CatalogKnownToken[];
  voltageCodes?: CatalogVoltageCode[];
  functionMappingRefs?: CatalogFunctionMappingRef[];
  checkRuleRefs: CatalogCheckRuleRef[];
  parsingRules?: CatalogParsingRule[];
  codePatterns?: CatalogSeriesCodePatterns;
  /** Documents equivalence profile source (e.g. legacy equivalenceProfiles.json). */
  comparisonProfileRef?: string;
}

export interface CatalogEquivalenceGroup extends CatalogReliabilityMetadata {
  id: string;
  name: string;
  seriesIds: string[];
}

export interface CatalogFunctionMapping extends CatalogReliabilityMetadata {
  id: string;
  manufacturer: string;
  seriesFamily: string;
  token: string;
  canonicalFunctionId: string;
  confidence: CatalogConfidence;
  requiresCatalogCheck: boolean;
  noteTr?: string;
}

export interface CatalogCheckRule extends CatalogReliabilityMetadata {
  id: string;
  fieldTr: string;
  reasonTr: string;
  severity: CheckSeverity;
  resolverCategories: ProductResolverCategory[];
}

export interface CatalogV2Bundle {
  productSeries: CatalogSeries[];
  equivalenceGroups: CatalogEquivalenceGroup[];
  functionMappings: CatalogFunctionMapping[];
  checkRules: CatalogCheckRule[];
}
