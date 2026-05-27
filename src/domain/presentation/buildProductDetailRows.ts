import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import {
  buildHydraulicValveBehaviorDescriptions,
  formatBehaviorDescriptionForUi,
} from '@/domain/canonical/hydraulicValve/hydraulicValveBehaviorDescriptions';
import {
  normalizeCushioningAttribute,
  normalizeStandardFamilyAttribute,
  formatNormalizedAttributeForDisplay,
} from '@/domain/normalization/normalizeTechnicalAttribute';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';
import type { ProductIdentification, TechnicalAttribute as IdAttribute } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';
import { formatAttributeValue, formatEvidence } from '@/utils/formatConfidence';

export interface ProductDetailRow {
  label: string;
  value: string;
  evidence: string;
  requiresCheck: boolean;
}

function rowFromIdentificationAttribute(
  label: string,
  attribute: IdAttribute<string | number>,
  unit?: string
): ProductDetailRow {
  return {
    label,
    value: formatAttributeValue(attribute.value, unit ?? attribute.unit),
    evidence: formatEvidence(attribute.evidence),
    requiresCheck: attribute.requiresCheck,
  };
}

function rowFromParsedTechnicalAttribute(attribute: TechnicalAttribute): ProductDetailRow {
  const requiresCheck =
    attribute.evidence === 'unknown' ||
    attribute.evidence === 'inferred' ||
    attribute.confidence === 'low' ||
    attribute.confidence === 'unknown';

  const evidenceLabel =
    attribute.evidence === 'code'
      ? 'Ürün kodundan'
      : attribute.evidence === 'series_table'
        ? 'Seri tablosundan'
        : attribute.evidence === 'standard'
          ? 'Standart bilgisi'
          : attribute.evidence === 'inferred'
            ? 'Tahmini'
            : 'Bilinmiyor';

  return {
    label: attribute.label,
    value: formatAttributeValue(attribute.value as string | number | null, attribute.unit),
    evidence: evidenceLabel,
    requiresCheck,
  };
}

function pickAttribute(
  attributes: TechnicalAttribute[],
  key: string
): TechnicalAttribute | undefined {
  return attributes.find((a) => a.key === key && a.value !== null);
}

function behaviorEvidenceLabel(description: {
  confidence: string;
  requiresCatalogCheck: boolean;
}): string {
  if (description.requiresCatalogCheck) {
    return 'Katalogdan doğrulanmalı';
  }
  if (description.confidence === 'high') {
    return 'Ürün kodundan';
  }
  if (description.confidence === 'medium' || description.confidence === 'low') {
    return 'Seri tablosundan';
  }
  return 'Bilinmiyor';
}

export function buildProductDetailRows(
  identification: ProductIdentification
): ProductDetailRow[] {
  const attributes = getTechnicalAttributes(identification);

  const baseRows: ProductDetailRow[] = [
    rowFromIdentificationAttribute('Marka', identification.brand),
    rowFromIdentificationAttribute('Seri', identification.series),
    rowFromIdentificationAttribute('Ürün tipi', identification.productType),
    rowFromIdentificationAttribute('Ürün kategorisi', identification.productCategory),
  ];

  if (identification.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY) {
    const rows: ProductDetailRow[] = [...baseRows];

    const behaviorDescriptions = buildHydraulicValveBehaviorDescriptions({
      identification,
      attributes,
    });

    for (const description of behaviorDescriptions) {
      rows.push({
        label: description.title,
        value: formatBehaviorDescriptionForUi(description),
        evidence: behaviorEvidenceLabel(description),
        requiresCheck:
          description.requiresCatalogCheck ||
          description.confidence === 'low' ||
          description.confidence === 'unknown',
      });
    }

    const revision = pickAttribute(attributes, 'revision');
    if (revision) {
      rows.push(rowFromParsedTechnicalAttribute(revision));
    }

    return rows;
  }

  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    const standardFamily = normalizeStandardFamilyAttribute({
      rawValue: identification.standardFamily.value,
      manufacturer: identification.brand.value ?? undefined,
      evidence: identification.standardFamily.evidence,
      confidence: identification.confidence,
    });

    const rows: ProductDetailRow[] = [
      ...baseRows,
      {
        label: 'Standart ailesi',
        value: formatNormalizedAttributeForDisplay(standardFamily),
        evidence: formatEvidence(identification.standardFamily.evidence),
        requiresCheck: standardFamily.requiresCatalogCheck ?? identification.standardFamily.requiresCheck,
      },
      rowFromIdentificationAttribute('Çap', identification.bore),
      rowFromIdentificationAttribute('Strok', identification.stroke),
    ];

    const cushioning = pickAttribute(attributes, 'cushioning_token');
    if (cushioning) {
      const normalized = normalizeCushioningAttribute({
        rawToken: String(cushioning.value),
        manufacturer: identification.brand.value ?? undefined,
        evidence: cushioning.evidence,
        confidence: cushioning.confidence,
      });
      rows.push({
        label: normalized.label,
        value: formatNormalizedAttributeForDisplay(normalized),
        evidence:
          cushioning.evidence === 'code'
            ? 'Ürün kodundan'
            : cushioning.evidence === 'series_table'
              ? 'Seri tablosundan'
              : 'Bilinmiyor',
        requiresCheck: normalized.requiresCatalogCheck ?? cushioning.confidence === 'low',
      });
    }

    const opts = pickAttribute(attributes, 'options');
    if (opts) {
      rows.push(rowFromParsedTechnicalAttribute(opts));
    }

    return rows;
  }

  return [...baseRows, rowFromIdentificationAttribute('Standart ailesi', identification.standardFamily)];
}
