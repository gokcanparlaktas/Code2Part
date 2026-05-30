import { extractHydraulicAttributes } from '@/domain/attributes/extractors/extractHydraulicAttributes';
import { toPresentationAttribute } from '@/domain/attributes/extractors/attributeEvidence';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import {
  isRexrothWECode,
  parseRexrothWE,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import {
  isVickersDG4VCode,
  parseVickersDG4V,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import {
  isYukenDSGCode,
  parseYukenDSG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  isYukenDSHGCode,
  parseYukenDSHG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSHG';
import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

/** @deprecated Use extractHydraulicAttributes from @/domain/attributes/extractors */
export function getHydraulicValveAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  const normalized = normalizeProductCode(options.inputCode);
  const isRexrothWE =
    options.series?.id === 'rexroth_4we6' ||
    options.series?.id === 'rexroth_4we10' ||
    options.series?.codePrefix.startsWith('3WE6') ||
    options.series?.codePrefix.startsWith('4WE6') ||
    options.series?.codePrefix.startsWith('4WE10') ||
    isRexrothWECode(normalized);

  if (isRexrothWE) {
    const rexroth = parseRexrothWE(options.inputCode);
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

  const isYukenDSHG =
    options.series?.id === 'yuken_dshg03' ||
    options.series?.codePrefix.startsWith('DSHG-') ||
    isYukenDSHGCode(normalized);

  if (isYukenDSHG) {
    const dshg = parseYukenDSHG(options.inputCode);
    if (dshg) {
      return dshg.map(toPresentationAttribute);
    }
  }

  const isVickersDG4V =
    options.series?.id === 'vickers_dg4v3' ||
    options.series?.id === 'vickers_dg4v5' ||
    options.series?.codePrefix.startsWith('DG4V-') ||
    isVickersDG4VCode(normalized);

  if (isVickersDG4V) {
    const vickers = parseVickersDG4V(options.inputCode);
    if (vickers) {
      return vickers.map(toPresentationAttribute);
    }
  }

  return extractHydraulicAttributes({
    inputCode: options.inputCode,
    seriesId: options.series?.id,
  }).map(toPresentationAttribute);
}
