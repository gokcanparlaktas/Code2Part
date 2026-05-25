import equivalentSeriesData from '@/data/equivalentSeries.json';
import { getProductSeriesById } from '@/domain/resolver/identifyProduct';
import type { EquivalentGroupRecord } from '@/types/product';
import type {
  ConfidenceLevel,
  EvidenceLevel,
  ProductIdentification,
  TechnicalAttribute,
} from '@/types/product';
import { formatAttributeValue, formatConfidence } from '@/utils/formatConfidence';
import { formatConfidencePercent } from '@/utils/confidenceScore';

const equivalenceGroups = equivalentSeriesData as EquivalentGroupRecord[];

export interface EvidenceDetailRow {
  label: string;
  value: string;
  evidenceLabel: string;
  explanation: string;
}

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

function attributeRow(
  fieldKey: EvidenceFieldKey,
  label: string,
  attribute: TechnicalAttribute<string | number>
): EvidenceDetailRow {
  return {
    label,
    value: formatAttributeValue(attribute.value, attribute.unit),
    evidenceLabel: formatEvidenceLabel(attribute.evidence, fieldKey),
    explanation: formatEvidenceExplanation(attribute.evidence, fieldKey),
  };
}

function getEquivalenceGroupLabel(seriesId: string | null): string {
  if (!seriesId) {
    return 'Bilinmiyor';
  }
  const series = getProductSeriesById(seriesId);
  const groupId = series?.equivalenceGroupId;
  if (!groupId) {
    return 'Bilinmiyor';
  }
  const group = equivalenceGroups.find((g) => g.id === groupId);
  return group?.name ?? groupId;
}

function confidenceExplanation(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Ürün kodu ve seri bilgisi güvenle eşleşti.';
    case 'medium':
      return 'Sonuç kısmen güvenilir; bazı alanlar doğrulanmalıdır.';
    case 'low':
      return 'Sonuç düşük güvenle üretildi; mutlaka doğrulanmalıdır.';
    case 'unknown':
      return 'Güven skoru hesaplanamadı.';
  }
}

export function buildEvidenceDetailRows(
  identification: ProductIdentification
): EvidenceDetailRow[] {
  return [
    attributeRow('brand', 'Marka', identification.brand),
    attributeRow('series', 'Seri', identification.series),
    attributeRow('productType', 'Ürün tipi', identification.productType),
    attributeRow('standardFamily', 'Standart aile', identification.standardFamily),
    attributeRow('bore', 'Çap', identification.bore),
    attributeRow('stroke', 'Strok', identification.stroke),
    {
      label: 'Muadil grup',
      value: getEquivalenceGroupLabel(identification.seriesId),
      evidenceLabel: identification.seriesId
        ? formatEvidenceLabel('series_table', 'equivalenceGroup')
        : formatEvidenceLabel('unknown'),
      explanation: identification.seriesId
        ? formatEvidenceExplanation('series_table', 'equivalenceGroup')
        : EVIDENCE_EXPLANATIONS.unknown,
    },
    {
      label: 'Güven skoru',
      value: formatConfidencePercent(identification.confidence),
      evidenceLabel: formatConfidence(identification.confidence),
      explanation: confidenceExplanation(identification.confidence),
    },
  ];
}
