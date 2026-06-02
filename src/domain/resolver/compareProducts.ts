import { compareHydraulicValves } from '@/domain/categories/hydraulicValve/hydraulicValveComparison';
import { comparePneumaticCylinders } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderComparison';
import { compareRollingBearings } from '@/domain/categories/rollingBearing/compareRollingBearings';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  ROLLING_BEARING_CATEGORY,
} from '@/types/category';
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

const CROSS_CATEGORY_WARNING =
  'Ürün kategorisi farklı: Bu iki ürün doğrudan uyumlu kabul edilmez.';

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

export function resolveTargetResolverCategory(
  candidate: EquivalentCandidate
): ProductIdentification['resolverCategoryKey'] {
  if (candidate.targetIdentification?.resolverCategoryKey) {
    return candidate.targetIdentification.resolverCategoryKey;
  }

  if (candidate.seriesId) {
    return getProductSeriesById(candidate.seriesId)?.resolverCategory ?? null;
  }

  return null;
}

function formatResolverCategoryDisplay(
  identification: ProductIdentification | null | undefined,
  categoryKey: ProductIdentification['resolverCategoryKey']
): string {
  const fromAttribute = identification?.productCategory?.value;
  if (fromAttribute != null && String(fromAttribute).trim()) {
    return String(fromAttribute);
  }

  if (categoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    return 'Pnömatik silindir';
  }
  if (categoryKey === HYDRAULIC_VALVE_CATEGORY) {
    return 'Hidrolik valf';
  }
  if (categoryKey === ROLLING_BEARING_CATEGORY) {
    return 'Rulman';
  }

  return categoryKey ?? 'Bilinmiyor';
}

export function isCrossCategoryComparison(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): boolean {
  const category = resolveResolverCategory(source);
  const targetCategory = resolveTargetResolverCategory(candidate);
  const isSupportedCategory =
    category === PNEUMATIC_CYLINDER_CATEGORY ||
    category === HYDRAULIC_VALVE_CATEGORY ||
    category === ROLLING_BEARING_CATEGORY;

  return Boolean(isSupportedCategory && targetCategory && category !== targetCategory);
}

function buildCrossCategoryComparisonResult(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const category = resolveResolverCategory(source);
  const targetCategory = resolveTargetResolverCategory(candidate);

  return {
    candidate,
    summary: {
      matchLevelTr: 'Karşılaştırılamaz',
      summaryTr:
        'Ürün kategorileri farklı. Hidrolik valf ile pnömatik silindir gibi farklı ürün türleri karşılaştırılamaz.',
      riskLevel: 'high',
    },
    compatible: [],
    different: [
      {
        label: 'Ürün kategorisi',
        sourceDisplay: formatResolverCategoryDisplay(source, category),
        targetDisplay: formatResolverCategoryDisplay(
          candidate.targetIdentification,
          targetCategory
        ),
        status: 'different',
      },
    ],
    checkItems: [],
    warnings: [CROSS_CATEGORY_WARNING],
  };
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

import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

export function compareProducts(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  options?: { catalogProvider?: CatalogDataProvider }
): CompatibilityResult {
  if (isCrossCategoryComparison(source, candidate)) {
    return enrichWithGenerationMetadata(buildCrossCategoryComparisonResult(source, candidate));
  }

  const category = resolveResolverCategory(source);

  if (category === PNEUMATIC_CYLINDER_CATEGORY) {
    return enrichWithGenerationMetadata(comparePneumaticCylinders(source, candidate));
  }

  if (category === HYDRAULIC_VALVE_CATEGORY) {
    return enrichWithGenerationMetadata(
      compareHydraulicValves(source, candidate, {
        catalogProvider: options?.catalogProvider,
      })
    );
  }

  if (category === ROLLING_BEARING_CATEGORY) {
    return enrichWithGenerationMetadata(
      compareRollingBearings(source, candidate, {
        catalogProvider: options?.catalogProvider,
      })
    );
  }

  return enrichWithGenerationMetadata(compareGenericProducts(source, candidate));
}

function enrichWithGenerationMetadata(result: CompatibilityResult): CompatibilityResult {
  const generation = result.candidate.generation;
  if (!generation?.generationCheckNotes?.length) {
    return result;
  }

  const existingReasons = new Set(result.checkItems.map((item) => item.reasonTr));
  const extraItems = generation.generationCheckNotes
    .filter((note) => !existingReasons.has(note))
    .map((reasonTr, index) => ({
      field: `Üretim kontrolü ${index + 1}`,
      sourceValue: '',
      targetValue: '',
      reasonTr,
      severity: 'medium' as const,
    }));

  return {
    ...result,
    checkItems: [...result.checkItems, ...extraItems],
  };
}
