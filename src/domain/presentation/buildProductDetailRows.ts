import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import {
  normalizeConnectorDisplay,
  normalizeManualOverrideDisplay,
  normalizeVoltageDisplay,
} from '@/domain/normalization/canonicalAttributeDisplay';
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

  // Map new evidence labels onto existing “formatEvidence” wording without touching UI.
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
    const cetopRow = identification.cetopNgSize
      ? rowFromIdentificationAttribute('CETOP / NG ölçüsü', identification.cetopNgSize)
      : rowFromIdentificationAttribute('Standart ailesi', identification.standardFamily);

    const rows: ProductDetailRow[] = [
      ...baseRows,
      cetopRow,
    ];

    const functionAttr = pickAttribute(attributes, 'function_token');
    if (functionAttr) {
      rows.push(
        rowFromParsedTechnicalAttribute({ ...functionAttr, label: 'Sürgü / fonksiyon kodu' })
      );
    } else if (identification.valveSpoolFunction) {
      rows.push(
        rowFromIdentificationAttribute('Sürgü / fonksiyon kodu', identification.valveSpoolFunction)
      );
    }
    const voltageAttr = pickAttribute(attributes, 'voltage');
    if (voltageAttr || identification.valveCoilVoltage) {
      const normalized = normalizeVoltageDisplay({
        rawValue: voltageAttr?.value ? String(voltageAttr.value) : identification.valveCoilVoltage?.value,
        rawToken: (voltageAttr as { sourceToken?: string })?.sourceToken,
        sourceManufacturer: identification.brand.value ?? undefined,
      });
      if (normalized) {
        rows.push({
          label: 'Bobin voltajı',
          value: formatNormalizedAttributeForDisplay({
            value: normalized.displayValue,
            canonicalValue: normalized.canonicalValue,
            rawToken: normalized.rawToken,
            rawTokenLabel: normalized.rawTokenLabel,
          }),
          evidence: voltageAttr?.evidence === 'code' ? 'Ürün kodundan' : 'Seri tablosundan',
          requiresCheck: normalized.requiresCatalogCheck ?? false,
        });
      } else if (identification.valveCoilVoltage) {
        rows.push(rowFromIdentificationAttribute('Bobin voltajı', identification.valveCoilVoltage));
      }
    }

    const connector = pickAttribute(attributes, 'connector_token');
    const connectorType = pickAttribute(attributes, 'connector');
    if (connector || connectorType) {
      const normalized = normalizeConnectorDisplay({
        rawValue: connectorType?.value ? String(connectorType.value) : null,
        rawToken: connector?.value ? String(connector.value) : undefined,
        sourceManufacturer: identification.brand.value ?? undefined,
      });
      if (normalized) {
        rows.push({
          label: 'Konnektör',
          value: formatNormalizedAttributeForDisplay({
            value: normalized.displayValue,
            canonicalValue: normalized.canonicalValue,
            rawToken: normalized.rawToken,
            rawTokenLabel: normalized.rawTokenLabel,
          }),
          evidence: 'Ürün kodundan',
          requiresCheck: normalized.requiresCatalogCheck ?? false,
        });
      } else if (connector) {
        rows.push(rowFromParsedTechnicalAttribute({ ...connector, label: 'Konnektör kodu' }));
      }
    }

    const manualOverride = pickAttribute(attributes, 'manual_override');
    if (manualOverride) {
      const normalized = normalizeManualOverrideDisplay({
        rawValue: manualOverride.value ? String(manualOverride.value) : null,
        rawToken: (manualOverride as { sourceToken?: string })?.sourceToken,
        sourceManufacturer: identification.brand.value ?? undefined,
      });
      if (normalized) {
        rows.push({
          label: 'Manuel kumanda',
          value: formatNormalizedAttributeForDisplay({
            value: normalized.displayValue,
            canonicalValue: normalized.canonicalValue,
            rawToken: normalized.rawToken,
            rawTokenLabel: normalized.rawTokenLabel,
          }),
          evidence: 'Ürün kodundan',
          requiresCheck: normalized.requiresCatalogCheck ?? false,
        });
      }
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

  // Generic fallback: keep it safe and minimal.
  return [...baseRows, rowFromIdentificationAttribute('Standart ailesi', identification.standardFamily)];
}

