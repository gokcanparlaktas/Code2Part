export type SuggestionConfidence = 'high' | 'medium' | 'low';

export type SuggestionMatchedBy =
  | 'exact_match'
  | 'series_prefix'
  | 'brand_alias'
  | 'partial_regex'
  | 'contains'
  | 'dimension_fragment'
  | 'example_code_contains'
  | 'token_match';

export type PneumaticSuggestionMissingField = 'bore' | 'stroke' | 'options';

export type HydraulicSuggestionMissingField =
  | 'spool_function'
  | 'coil_voltage'
  | 'connector'
  | 'flow_pressure'
  | 'manual_override'
  | 'seal_material';

export type SuggestionMissingField =
  | PneumaticSuggestionMissingField
  | HydraulicSuggestionMissingField;

export interface SuggestedProductDetectedAttributes {
  boreMm?: number;
  strokeMm?: number;
}

export interface SuggestedProduct {
  seriesId: string;
  brand: string;
  series: string;
  productTypeTr: string;
  standardFamily: string;
  equivalenceGroup: string;
  confidence: SuggestionConfidence;
  matchedBy: SuggestionMatchedBy;
  detectedAttributes: SuggestedProductDetectedAttributes;
  missingFields: SuggestionMissingField[];
  exampleCodeFormat: string;
  suggestionTextTr: string;
}

export function getSuggestionReactKey(suggestion: SuggestedProduct): string {
  return `${suggestion.seriesId}:${suggestion.exampleCodeFormat}:${suggestion.matchedBy}`;
}
