export type SuggestionConfidence = 'high' | 'medium' | 'low';

export type SuggestionMatchedBy =
  | 'series_prefix'
  | 'brand_alias'
  | 'partial_regex'
  | 'contains'
  | 'dimension_fragment'
  | 'example_code_contains'
  | 'token_match';

export type SuggestionMissingField = 'bore' | 'stroke' | 'options';

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
