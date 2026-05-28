import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import {
  buildHydraulicValveBehaviorDescriptions,
  formatBehaviorDescriptionForUi,
} from '@/domain/canonical/hydraulicValve/hydraulicValveBehaviorDescriptions';
import {
  buildPneumaticCushioningAttribute,
  buildPneumaticStandardFamilyDisplayValue,
  type PneumaticVariantTokenInput,
} from '@/domain/canonical/pneumatic/pneumaticCanonicalAttributes';
import { formatCanonicalDetailValue } from '@/domain/presentation/formatCanonicalDetailValue';
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
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

function collectVariantInputs(attributes: TechnicalAttribute[]): PneumaticVariantTokenInput[] {
  return attributes
    .filter((a) => a.key === 'variant_code' && a.value !== null)
    .map((a) => ({
      token: String(a.value),
      evidence: a.evidence,
      confidence: a.confidence,
    }));
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

function profileAttributeToDetailRow(
  label: string,
  attr: ReturnType<typeof buildPneumaticCushioningAttribute>,
  evidenceFallback: string,
): ProductDetailRow {
  const display =
    attr.displayValue ??
    (attr.value === null || attr.value === undefined ? 'Bilinmiyor — kontrol gerekli' : String(attr.value));

  return {
    label,
    value: display,
    evidence: evidenceFallback,
    requiresCheck: Boolean(attr.requiresCatalogCheck),
  };
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

    const hasDesignSeriesDescription = behaviorDescriptions.some(
      (d) => d.title === 'Tasarım serisi',
    );

    for (const description of behaviorDescriptions) {
      rows.push({
        label: description.title,
        value: formatBehaviorDescriptionForUi(description),
        evidence: behaviorEvidenceLabel(description),
        requiresCheck: Boolean(description.requiresCatalogCheck),
      });
    }

    if (!hasDesignSeriesDescription) {
      const revision =
        pickAttribute(attributes, 'design_series') ?? pickAttribute(attributes, 'revision');
      if (revision) {
        const label = (revision.label ?? '').trim().toLowerCase();
        const isRawDesignSeriesCode =
          revision.key === 'design_series' && (label.includes('kodu') || label.includes('code'));
        const rawToken = String(revision.value ?? '').trim();
        const resolved = rawToken
          ? resolveCanonicalAttribute({
              category: HYDRAULIC_VALVE_CATEGORY,
              manufacturer: identification.brand.value ?? undefined,
              series: identification.series.value ?? undefined,
              attributeKey: 'design_series',
              rawToken,
              evidence: revision.evidence,
              confidence: revision.confidence,
            })
          : null;

        if (resolved && !isUnknownCanonical(resolved) && resolved.displayValue.trim()) {
          rows.push({
            label: 'Tasarım serisi',
            value: resolved.displayValue,
            evidence: formatEvidence(revision.evidence),
            requiresCheck: resolved.requiresCatalogCheck,
          });
        } else if (!isRawDesignSeriesCode) {
          // Do not show raw "... kodu" rows as-is.
          rows.push(rowFromParsedTechnicalAttribute(revision));
        }
      }
    }

    return rows;
  }

  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    const brand = identification.brand.value ?? undefined;
    const series = identification.series.value ?? undefined;
    const variantCodes = collectVariantInputs(attributes);

    const rows: ProductDetailRow[] = [
      ...baseRows,
      {
        label: 'Standart ailesi',
        value: buildPneumaticStandardFamilyDisplayValue({
          seriesStandardLabel: identification.standardFamily.value,
          variantCodes,
          manufacturer: brand,
          series,
        }),
        evidence: formatEvidence(identification.standardFamily.evidence),
        requiresCheck: identification.standardFamily.requiresCheck,
      },
      rowFromIdentificationAttribute('Çap', identification.bore),
      rowFromIdentificationAttribute('Strok', identification.stroke),
    ];

    const cushioning =
      pickAttribute(attributes, 'cushioning_type') ??
      pickAttribute(attributes, 'cushioning_token');
    if (cushioning) {
      const cushioningAttr = buildPneumaticCushioningAttribute({
        rawToken: String(cushioning.value),
        manufacturer: brand,
        series,
        evidence: cushioning.evidence,
        confidence: cushioning.confidence,
      });
      rows.push(
        profileAttributeToDetailRow(
          'Sönümleme tipi',
          cushioningAttr,
          cushioning.evidence === 'code' ? 'Ürün kodundan' : 'Seri tablosundan',
        ),
      );
    }

    for (const variant of variantCodes) {
      const resolved = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        manufacturer: brand,
        series,
        attributeKey: 'variant_code',
        rawToken: variant.token,
        evidence: variant.evidence,
        confidence: variant.confidence,
      });
      if (!isUnknownCanonical(resolved) && resolved.canonicalKey === 'ISO_15552') {
        continue;
      }
      rows.push({
        label: 'Varyant kodu',
        value: formatCanonicalDetailValue(resolved),
        evidence: variant.evidence === 'code' ? 'Ürün kodundan' : 'Bilinmiyor',
        requiresCheck: resolved.requiresCatalogCheck,
      });
    }

    return rows;
  }

  return [...baseRows, rowFromIdentificationAttribute('Standart ailesi', identification.standardFamily)];
}
