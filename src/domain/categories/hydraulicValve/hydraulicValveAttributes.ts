import { extractHydraulicAttributes } from '@/domain/attributes/extractors/extractHydraulicAttributes';
import { toPresentationAttribute } from '@/domain/attributes/extractors/attributeEvidence';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import {
  isRexrothWE6Code,
  parseRexrothWE6,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import {
  isYukenDSGCode,
  parseYukenDSG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

/** @deprecated Use extractHydraulicAttributes from @/domain/attributes/extractors */
export function getHydraulicValveAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  const normalized = normalizeProductCode(options.inputCode);
  const isRexrothWE6 =
    options.series?.id === 'rexroth_4we6' ||
    options.series?.codePrefix.startsWith('4WE6') ||
    isRexrothWE6Code(normalized);

  if (isRexrothWE6) {
    const rexroth = parseRexrothWE6(options.inputCode);
    if (rexroth) {
      return rexroth.map(toPresentationAttribute);
    }
  }

  const isYukenDSG =
    options.series?.id === 'yuken_dsg01' ||
    options.series?.id === 'yuken_dsg03' ||
    options.series?.codePrefix.startsWith('DSG-') ||
    isYukenDSGCode(normalized);

  if (isYukenDSG) {
    const yuken = parseYukenDSG(options.inputCode);
    if (yuken) {
      return yuken.map(toPresentationAttribute);
    }
  }

  return extractHydraulicAttributes({
    inputCode: options.inputCode,
    seriesId: options.series?.id,
  }).map(toPresentationAttribute);
}
