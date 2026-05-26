import { getHydraulicValveAttributes } from '@/domain/categories/hydraulicValve/hydraulicValveAttributes';
import { getPneumaticCylinderAttributes } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderAttributes';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

function safeUnknownAttribute(key: string, label: string, note?: string): TechnicalAttribute {
  return {
    key,
    label,
    value: null,
    evidence: 'unknown',
    confidence: 'unknown',
    ...(note ? { note } : {}),
  };
}

export function getTechnicalAttributes(
  identification: ProductIdentification
): TechnicalAttribute[] {
  const series = identification.seriesId ? getProductSeriesById(identification.seriesId) : null;

  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    return getPneumaticCylinderAttributes({
      inputCode: identification.inputCode,
      series,
    });
  }

  if (identification.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY) {
    return getHydraulicValveAttributes({
      inputCode: identification.inputCode,
      series,
    });
  }

  return [
    safeUnknownAttribute(
      'unsupported_category',
      'Teknik öznitelikler',
      'Bu kategori için özel ayrıştırıcı (parser) henüz yok.'
    ),
  ];
}

