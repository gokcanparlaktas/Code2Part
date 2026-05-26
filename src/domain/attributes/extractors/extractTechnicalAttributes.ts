import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  type ProductResolverCategory,
} from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import { buildAttributeResult, toPresentationAttribute } from './attributeEvidence';
import { extractHydraulicAttributes } from './extractHydraulicAttributes';
import { extractPneumaticAttributes } from './extractPneumaticAttributes';

export interface ExtractTechnicalAttributesOptions {
  inputCode: string;
  seriesId?: string | null;
  resolverCategoryKey?: ProductResolverCategory | null;
}

export function extractTechnicalAttributeResults(
  options: ExtractTechnicalAttributesOptions
): TechnicalAttributeResult[] {
  if (options.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    return extractPneumaticAttributes({
      inputCode: options.inputCode,
      seriesId: options.seriesId,
    });
  }

  if (options.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY) {
    return extractHydraulicAttributes({
      inputCode: options.inputCode,
      seriesId: options.seriesId,
    });
  }

  return [
    buildAttributeResult({
      key: 'unsupported_category',
      label: 'Teknik öznitelikler',
      value: null,
      evidence: 'unknown',
      confidence: 'unknown',
      category: options.resolverCategoryKey ?? PNEUMATIC_CYLINDER_CATEGORY,
      note: 'Bu kategori için özel ayrıştırıcı (parser) henüz yok.',
    }),
  ];
}

export function extractTechnicalAttributes(options: ExtractTechnicalAttributesOptions) {
  return extractTechnicalAttributeResults(options).map(toPresentationAttribute);
}
