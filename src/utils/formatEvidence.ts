import type { EvidenceLevel } from '@/types/product';

export type { EvidenceDetailRow } from '@/domain/presentation/buildEvidenceDetailRows';
export { buildEvidenceDetailRows } from '@/domain/presentation/buildEvidenceDetailRows';

type EvidenceFieldKey =
  | 'brand'
  | 'series'
  | 'productType'
  | 'standardFamily'
  | 'bore'
  | 'stroke'
  | 'equivalenceGroup'
  | 'confidence';

const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  code: 'Koddan okundu',
  series_table: 'Seri bilgisinden geldi',
  standard: 'Standarttan türetildi',
  inferred: 'Tahmin edildi',
  unknown: 'Bilinmiyor',
};

const EVIDENCE_EXPLANATIONS: Record<EvidenceLevel, string> = {
  code: 'Bu bilgi ürün kodundan doğrudan çıkarıldı.',
  series_table: 'Bu bilgi ürün serisinin katalog bilgisinden geldi.',
  standard: 'Bu bilgi ürünün bağlı olduğu standart ailesinden türetildi.',
  inferred: 'Bu bilgi mevcut verilerden tahmin edildi, doğrulanmalıdır.',
  unknown: 'Bu bilgi mevcut veri setinde bulunamadı.',
};

const FIELD_EVIDENCE_LABELS: Partial<Record<EvidenceFieldKey, string>> = {
  series: 'Koddan tespit edildi',
  brand: 'Seri bilgisinden geldi',
  productType: 'Seri bilgisinden geldi',
  standardFamily: 'Seri bilgisinden geldi',
  equivalenceGroup: 'Seri bilgisinden geldi',
};

const FIELD_EVIDENCE_EXPLANATIONS: Partial<Record<EvidenceFieldKey, string>> = {
  series: 'Ürün kodundaki seri/prefix bilgisiyle eşleşti.',
  brand: 'Koddan tespit edilen seri, yerel katalogda bu markaya bağlıdır.',
  productType: 'Bu bilgi ürün serisinin yerel katalog bilgisinden geldi.',
  standardFamily: 'Bu bilgi ürün serisinin yerel katalog bilgisinden geldi.',
  equivalenceGroup: 'Bu bilgi ürün serisinin yerel katalog bilgisinden geldi.',
};

export function formatEvidenceLabel(
  evidence: EvidenceLevel,
  fieldKey?: EvidenceFieldKey
): string {
  if (fieldKey && FIELD_EVIDENCE_LABELS[fieldKey]) {
    return FIELD_EVIDENCE_LABELS[fieldKey]!;
  }
  return EVIDENCE_LABELS[evidence];
}

export function formatEvidenceExplanation(
  evidence: EvidenceLevel,
  fieldKey?: EvidenceFieldKey
): string {
  if (fieldKey && FIELD_EVIDENCE_EXPLANATIONS[fieldKey]) {
    return FIELD_EVIDENCE_EXPLANATIONS[fieldKey]!;
  }
  return EVIDENCE_EXPLANATIONS[evidence];
}

