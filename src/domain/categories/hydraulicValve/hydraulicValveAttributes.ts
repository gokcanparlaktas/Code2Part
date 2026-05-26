import { extractHydraulicAttributes } from '@/domain/attributes/extractors/extractHydraulicAttributes';
import { toPresentationAttribute } from '@/domain/attributes/extractors/attributeEvidence';
import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

/** @deprecated Use extractHydraulicAttributes from @/domain/attributes/extractors */
export function getHydraulicValveAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  return extractHydraulicAttributes({
    inputCode: options.inputCode,
    seriesId: options.seriesId?.id,
  }).map(toPresentationAttribute);
}
