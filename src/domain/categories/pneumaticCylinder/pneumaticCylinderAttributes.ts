import { extractPneumaticAttributes } from '@/domain/attributes/extractors/extractPneumaticAttributes';
import { toPresentationAttribute } from '@/domain/attributes/extractors/attributeEvidence';
import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

/** @deprecated Use extractPneumaticAttributes from @/domain/attributes/extractors */
export function getPneumaticCylinderAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  return extractPneumaticAttributes({
    inputCode: options.inputCode,
    seriesId: options.series?.id,
  }).map(toPresentationAttribute);
}
