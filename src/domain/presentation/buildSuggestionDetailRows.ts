import type { SuggestedProduct, SuggestionMatchedBy } from '@/types/suggestion';
import { formatConfidence } from '@/utils/formatConfidence';

import {
  formatEquivalenceGroupLabel,
  formatSuggestionMissingFields,
  isSeriesNameOnlySuggestion,
} from './suggestionDisplay';

export interface SuggestionDetailRow {
  label: string;
  value: string;
}

const MATCHED_BY_LABELS: Record<SuggestionMatchedBy, string> = {
  exact_match: 'Tam kod eşleşmesi',
  series_prefix: 'Seri kodu',
  brand_alias: 'Marka eşleşmesi',
  partial_regex: 'Kısmi kod deseni',
  contains: 'Kod parçası',
  dimension_fragment: 'Boyut parçası',
  example_code_contains: 'Örnek kod benzerliği',
  token_match: 'Kod parçacığı',
};

export function formatSuggestionMatchedBy(matchedBy: SuggestionMatchedBy): string {
  return MATCHED_BY_LABELS[matchedBy] ?? matchedBy;
}

export function buildSuggestionDetailRows(suggestion: SuggestedProduct): SuggestionDetailRow[] {
  const seriesNameOnly = isSeriesNameOnlySuggestion(suggestion);

  const rows: SuggestionDetailRow[] = [
    { label: 'Marka', value: suggestion.brand },
    { label: 'Seri', value: suggestion.series },
    { label: 'Ürün tipi', value: suggestion.productTypeTr },
    { label: 'Standart ailesi', value: suggestion.standardFamily },
    {
      label: 'Muadil grup',
      value: formatEquivalenceGroupLabel(suggestion.equivalenceGroup),
    },
    { label: 'Eşleşme yöntemi', value: formatSuggestionMatchedBy(suggestion.matchedBy) },
  ];

  if (!seriesNameOnly) {
    rows.splice(5, 0, { label: 'Güven', value: formatConfidence(suggestion.confidence) });
  }

  if (suggestion.exampleCodeFormat.trim()) {
    rows.push({ label: 'Örnek kod', value: suggestion.exampleCodeFormat.trim() });
  }

  const { boreMm, strokeMm } = suggestion.detectedAttributes;
  if (boreMm !== undefined) {
    rows.push({ label: 'Algılanan çap', value: `${boreMm} mm` });
  }
  if (strokeMm !== undefined) {
    rows.push({ label: 'Algılanan strok', value: `${strokeMm} mm` });
  }

  if (!seriesNameOnly) {
    rows.push({
      label: 'Eksik alanlar',
      value: formatSuggestionMissingFields(suggestion.missingFields),
    });
  }

  if (suggestion.suggestionTextTr.trim()) {
    rows.push({ label: 'Açıklama', value: suggestion.suggestionTextTr.trim() });
  }

  return rows;
}
