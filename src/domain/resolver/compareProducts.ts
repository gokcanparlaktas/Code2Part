import { compareHydraulicValves } from '@/domain/categories/hydraulicValve/hydraulicValveComparison';
import { comparePneumaticCylinders } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderComparison';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type {
  AttributeComparison,
  CompatibilityResult,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification, TechnicalAttribute } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

import { getProductSeriesById } from './productSeriesCatalog';

const UNSUPPORTED_CATEGORY_WARNING =
  'Bu ürün kategorisi için detaylı karşılaştırma kuralları henüz eklenmemiştir.';

export function resolveResolverCategory(
  source: ProductIdentification
): ProductIdentification['resolverCategoryKey'] {
  if (source.resolverCategoryKey) {
    return source.resolverCategoryKey;
  }

  if (!source.seriesId) {
    return null;
  }

  return getProductSeriesById(source.seriesId)?.resolverCategory ?? null;
}

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === 'string'
      ? { value: target, evidence: 'series_table', requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (
    source.requiresCheck ||
    targetAttr.requiresCheck ||
    source.evidence === 'unknown' ||
    targetAttr.evidence === 'unknown' ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (String(source.value) === String(targetAttr.value)) {
    return { label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  return { label, sourceDisplay, targetDisplay, status: 'different' };
}

function compareGenericProducts(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const comparisons: AttributeComparison[] = [
    compareAttribute(
      'Ürün kategorisi',
      source.productCategory,
      candidate.productCategory
    ),
    compareAttribute('Marka', source.brand, candidate.brand),
  ];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  return {
    candidate,
    summary: {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr:
        'Bu kategori için ayrıntılı karşılaştırma kuralları henüz tanımlanmadı. Temel alanlar gösterilmiştir.',
      riskLevel: 'high',
    },
    compatible,
    different,
    checkItems: [],
    warnings: [UNSUPPORTED_CATEGORY_WARNING],
  };
}

export function compareProducts(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const category = resolveResolverCategory(source);

  if (category === PNEUMATIC_CYLINDER_CATEGORY) {
    return comparePneumaticCylinders(source, candidate);
  }

  if (category === HYDRAULIC_VALVE_CATEGORY) {
    return compareHydraulicValves(source, candidate);
  }

  return compareGenericProducts(source, candidate);
}
