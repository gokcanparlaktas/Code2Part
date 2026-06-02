import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { getLegacyEquivalentGroups } from '@/domain/catalog/adapters/catalogV2Adapter';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  ROLLING_BEARING_CATEGORY,
} from '@/types/category';
import type { EquivalentGroupRecord } from '@/types/product';
import type {
  ConfidenceLevel,
  EvidenceLevel,
  ProductIdentification,
  TechnicalAttribute,
} from '@/types/product';
import { formatAttributeValue, formatConfidence } from '@/utils/formatConfidence';
import { formatConfidencePercent } from '@/utils/confidenceScore';

const equivalenceGroups = getLegacyEquivalentGroups();

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
  | 'cetopNg'
  | 'voltage'
  | 'function'
  | 'connector'
  | 'revision'
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

function formatEvidenceLabel(
  evidence: EvidenceLevel,
  fieldKey?: EvidenceFieldKey
): string {
  if (fieldKey && FIELD_EVIDENCE_LABELS[fieldKey]) {
    return FIELD_EVIDENCE_LABELS[fieldKey]!;
  }
  return EVIDENCE_LABELS[evidence];
}

function formatEvidenceExplanation(
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

function pickParsedAttribute(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string
): { value: string | number | null; evidence: EvidenceLevel } | null {
  const attr = attributes.find((a) => a.key === key && a.value !== null);
  if (!attr) {
    return null;
  }
  const evidence: EvidenceLevel =
    attr.evidence === 'code'
      ? 'code'
      : attr.evidence === 'series_table'
        ? 'series_table'
        : attr.evidence === 'standard'
          ? 'standard'
          : attr.evidence === 'inferred'
            ? 'inferred'
            : 'unknown';
  return { value: attr.value, evidence };
}

function pickFirstParsedAttribute(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  keys: string[],
): { value: string | number | null; evidence: EvidenceLevel } | null {
  for (const key of keys) {
    const hit = pickParsedAttribute(attributes, key);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function formatFunctionValue(identification: ProductIdentification): string {
  const parsed = pickFirstParsedAttribute(
    getTechnicalAttributes(identification),
    ['function_code', 'function_token', 'spool_function_code'],
  );
  if (parsed != null && parsed.value != null) {
    return String(parsed.value);
  }

  const raw = identification.valveSpoolFunction?.value;
  if (raw === null || raw === undefined) {
    return formatAttributeValue(null);
  }
  const text = String(raw);
  const stripped = text.replace(/^Spool\s+/i, '').trim();
  return stripped || text;
}

function buildHydraulicEvidenceDetailRows(
  identification: ProductIdentification
): EvidenceDetailRow[] {
  const rows: EvidenceDetailRow[] = [
    attributeRow('brand', 'Marka', identification.brand),
    attributeRow('series', 'Seri', identification.series),
    attributeRow('productType', 'Ürün tipi', identification.productType),
    attributeRow('standardFamily', 'Standart aile', identification.standardFamily),
  ];

  if (identification.cetopNgSize?.value) {
    rows.push(
      attributeRow('cetopNg', 'CETOP / NG ölçüsü', identification.cetopNgSize)
    );
  }

  const functionValue = formatFunctionValue(identification);
  if (functionValue !== 'Bilinmiyor — kontrol gerekli') {
    rows.push({
      label: 'Sürgü / fonksiyon kodu',
      value: functionValue,
      evidenceLabel: formatEvidenceLabel(
        identification.valveSpoolFunction?.evidence ?? 'code',
        'function'
      ),
      explanation: formatEvidenceExplanation(
        identification.valveSpoolFunction?.evidence ?? 'code',
        'function'
      ),
    });
  }

  if (identification.valveCoilVoltage?.value) {
    rows.push(
      attributeRow('voltage', 'Bobin voltajı', identification.valveCoilVoltage)
    );
  }

  const connector = pickFirstParsedAttribute(
    getTechnicalAttributes(identification),
    ['connector_type', 'connector_token', 'connector_option'],
  );
  if (connector) {
    rows.push({
      label: 'Konnektör kodu',
      value: String(connector.value),
      evidenceLabel: formatEvidenceLabel(connector.evidence, 'connector'),
      explanation: formatEvidenceExplanation(connector.evidence, 'connector'),
    });
  }

  const revision = pickFirstParsedAttribute(
    getTechnicalAttributes(identification),
    ['design_series', 'revision'],
  );
  if (revision) {
    rows.push({
      label: 'Revizyon / tasarım serisi',
      value: String(revision.value),
      evidenceLabel: formatEvidenceLabel(revision.evidence, 'revision'),
      explanation: formatEvidenceExplanation(revision.evidence, 'revision'),
    });
  }

  return rows;
}

function buildPneumaticEvidenceDetailRows(
  identification: ProductIdentification
): EvidenceDetailRow[] {
  return [
    attributeRow('brand', 'Marka', identification.brand),
    attributeRow('series', 'Seri', identification.series),
    attributeRow('productType', 'Ürün tipi', identification.productType),
    attributeRow('standardFamily', 'Standart aile', identification.standardFamily),
    attributeRow('bore', 'Çap', identification.bore),
    attributeRow('stroke', 'Strok', identification.stroke),
  ];
}

function buildBearingEvidenceDetailRows(
  identification: ProductIdentification
): EvidenceDetailRow[] {
  const rows: EvidenceDetailRow[] = [
    attributeRow('brand', 'Marka', identification.brand),
    attributeRow('series', 'Seri kodu', identification.series),
    attributeRow('productType', 'Ürün tipi', identification.productType),
    attributeRow('standardFamily', 'Standart aile', identification.standardFamily),
    attributeRow('bore', 'İç çap', identification.bore),
  ];

  if (identification.outsideDiameter) {
    rows.push({
      label: 'Dış çap',
      value: formatAttributeValue(
        identification.outsideDiameter.value,
        identification.outsideDiameter.unit
      ),
      evidenceLabel: formatEvidenceLabel(identification.outsideDiameter.evidence, 'bore'),
      explanation: formatEvidenceExplanation(identification.outsideDiameter.evidence, 'bore'),
    });
  }
  if (identification.bearingWidth) {
    rows.push({
      label: 'Kalınlık',
      value: formatAttributeValue(
        identification.bearingWidth.value,
        identification.bearingWidth.unit
      ),
      evidenceLabel: formatEvidenceLabel(identification.bearingWidth.evidence, 'stroke'),
      explanation: formatEvidenceExplanation(identification.bearingWidth.evidence, 'stroke'),
    });
  }

  return rows;
}

export function buildEvidenceDetailRows(
  identification: ProductIdentification
): EvidenceDetailRow[] {
  const categoryRows =
    identification.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY
      ? buildHydraulicEvidenceDetailRows(identification)
      : identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY
        ? buildPneumaticEvidenceDetailRows(identification)
        : identification.resolverCategoryKey === ROLLING_BEARING_CATEGORY
          ? buildBearingEvidenceDetailRows(identification)
          : [
              attributeRow('brand', 'Marka', identification.brand),
              attributeRow('series', 'Seri', identification.series),
              attributeRow('productType', 'Ürün tipi', identification.productType),
              attributeRow('standardFamily', 'Standart aile', identification.standardFamily),
            ];

  return [
    ...categoryRows,
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
