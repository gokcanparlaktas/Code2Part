import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
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
    if (identification.valveCoilVoltage) {
      rows.push(rowFromIdentificationAttribute('Bobin voltajı', identification.valveCoilVoltage));
    }

    const connector = pickAttribute(attributes, 'connector_token');
    if (connector) {
      rows.push(rowFromParsedTechnicalAttribute({ ...connector, label: 'Konnektör kodu' }));
    }

    const revision = pickAttribute(attributes, 'revision');
    if (revision) {
      rows.push(rowFromParsedTechnicalAttribute(revision));
    }

    return rows;
  }

  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    const rows: ProductDetailRow[] = [
      ...baseRows,
      rowFromIdentificationAttribute('Standart ailesi', identification.standardFamily),
      rowFromIdentificationAttribute('Çap', identification.bore),
      rowFromIdentificationAttribute('Strok', identification.stroke),
    ];

    const cushioning = pickAttribute(attributes, 'cushioning_token');
    if (cushioning) {
      rows.push(rowFromParsedTechnicalAttribute(cushioning));
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

