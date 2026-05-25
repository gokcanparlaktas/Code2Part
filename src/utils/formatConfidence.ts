import type { ConfidenceLevel, EvidenceLevel } from '@/types/product';

export function formatConfidence(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Yüksek güven';
    case 'medium':
      return 'Orta güven';
    case 'low':
      return 'Düşük güven';
    case 'unknown':
      return 'Belirsiz';
  }
}

export function formatEvidence(evidence: EvidenceLevel): string {
  switch (evidence) {
    case 'code':
      return 'Ürün kodundan';
    case 'series_table':
      return 'Seri tablosundan';
    case 'standard':
      return 'Standart bilgisi';
    case 'inferred':
      return 'Tahmini';
    case 'unknown':
      return 'Bilinmiyor';
  }
}

export function formatAttributeValue(
  value: string | number | null,
  unit?: string
): string {
  if (value === null || value === undefined) {
    return 'Bilinmiyor — kontrol gerekli';
  }
  return unit ? `${value} ${unit}` : String(value);
}
