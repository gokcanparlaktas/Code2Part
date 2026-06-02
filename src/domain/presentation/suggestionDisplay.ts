import { getLegacyEquivalentGroups } from '@/domain/catalog/adapters/catalogV2Adapter';
import type { SuggestedProduct, SuggestionMissingField } from '@/types/suggestion';

export const SUGGESTION_MISSING_FIELD_LABELS: Record<SuggestionMissingField, string> = {
  bore: 'çap',
  stroke: 'strok',
  options: 'seçenekler',
  spool_function: 'sürgü/fonksiyon',
  coil_voltage: 'bobin voltajı',
  connector: 'konnektör',
  flow_pressure: 'basınç/debi',
  manual_override: 'manuel kumanda',
  seal_material: 'conta',
};

export const SUGGESTION_MISSING_FIELD_DETAIL_LABELS: Record<SuggestionMissingField, string> = {
  bore: 'Çap',
  stroke: 'Strok',
  options: 'Seçenekler',
  spool_function: 'Sürgü / fonksiyon',
  coil_voltage: 'Bobin voltajı',
  connector: 'Konnektör',
  flow_pressure: 'Basınç / debi',
  manual_override: 'Manuel kumanda',
  seal_material: 'Conta',
};

export function formatEquivalenceGroupLabel(groupId: string): string {
  if (!groupId.trim()) {
    return 'Bilinmiyor';
  }

  const group = getLegacyEquivalentGroups().find((entry) => entry.id === groupId);
  return group?.name ?? groupId;
}

export function isSeriesNameOnlySuggestion(suggestion: SuggestedProduct): boolean {
  if (suggestion.matchedBy !== 'series_prefix') {
    return false;
  }

  const hasDetectedDimension =
    suggestion.detectedAttributes.boreMm !== undefined ||
    suggestion.detectedAttributes.strokeMm !== undefined ||
    suggestion.detectedAttributes.outsideDiameterMm !== undefined ||
    suggestion.detectedAttributes.widthMm !== undefined;

  return suggestion.missingFields.length === 0 && !hasDetectedDimension;
}

export function formatSuggestionMissingFields(fields: SuggestionMissingField[]): string {
  if (fields.length === 0) {
    return 'Belirtilmedi';
  }

  return fields
    .map((field) => SUGGESTION_MISSING_FIELD_DETAIL_LABELS[field] ?? field)
    .join(', ');
}

export function formatSuggestionCardHint(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const marker = 'eşleşiyor olabilir';
  const index = trimmed.toLocaleLowerCase('tr-TR').indexOf(marker);
  if (index === -1) {
    return trimmed;
  }

  const end = index + marker.length;
  const withPeriod = trimmed[end] === '.' ? end + 1 : end;
  return trimmed.slice(0, withPeriod).trim();
}

export function formatSuggestionMissingStatus(suggestion: SuggestedProduct): string {
  if (isSeriesNameOnlySuggestion(suggestion)) {
    return 'Seri adı bulundu';
  }

  if (suggestion.missingFields.length === 0) {
    return 'Eksik alan yok';
  }

  return `Eksik: ${suggestion.missingFields
    .map((field) => SUGGESTION_MISSING_FIELD_LABELS[field] ?? field)
    .join(', ')}`;
}
