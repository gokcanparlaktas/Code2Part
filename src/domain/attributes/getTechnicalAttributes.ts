import { extractTechnicalAttributes } from '@/domain/attributes/extractors';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

export function getTechnicalAttributes(
  identification: ProductIdentification
): TechnicalAttribute[] {
  const series = identification.seriesId ? getProductSeriesById(identification.seriesId) : null;

  return extractTechnicalAttributes({
    inputCode: identification.inputCode,
    seriesId: series?.id ?? identification.seriesId,
    resolverCategoryKey: identification.resolverCategoryKey,
  });
}
