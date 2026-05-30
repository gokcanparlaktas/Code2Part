import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import {
  isRexrothWECode,
  parseRexrothWE,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import {
  isYukenDSGCode,
  parseYukenDSG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  isYukenDSHGCode,
  parseYukenDSHG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSHG';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

import type { ProductResolverContext } from '@/domain/catalogData/types';

export type SupportedPhaseAProductCode =
  | '4WE6E-6X/EG24N9K4'
  | '4WE10E-5X/EG24N9K4'
  | 'DSG-01-3C2-D24-N1-70'
  | 'DSHG-03-3C4-T-D24-14';

function readAttrValue(
  attrs: { key: string; value: string | number | boolean | null }[],
  key: string
): string | null {
  const match = attrs.find((a) => a.key === key);
  if (!match || match.value === null) {
    return null;
  }
  return String(match.value);
}

function buildRexrothWEContext(inputCode: string, normalized: string): ProductResolverContext | null {
  if (!isRexrothWECode(normalized)) {
    return null;
  }
  const attrs = parseRexrothWE(inputCode);
  if (!attrs) {
    return null;
  }
  return {
    manufacturer: 'Rexroth',
    category: HYDRAULIC_VALVE_CATEGORY,
    family: readAttrValue(attrs, 'family') ?? 'WE',
    series: readAttrValue(attrs, 'series') ?? '4WE6',
    sourceFamily: readAttrValue(attrs, 'source_family') ?? 'WE6',
    nominalSize: readAttrValue(attrs, 'nominal_size') ?? undefined,
  };
}

function buildYukenDsgContext(inputCode: string, normalized: string): ProductResolverContext | null {
  if (!isYukenDSGCode(normalized)) {
    return null;
  }
  const attrs = parseYukenDSG(inputCode);
  if (!attrs) {
    return null;
  }
  const series = readAttrValue(attrs, 'series') ?? 'DSG-01';
  return {
    manufacturer: 'Yuken',
    category: HYDRAULIC_VALVE_CATEGORY,
    family: readAttrValue(attrs, 'family') ?? 'DSG',
    series,
    sourceFamily: readAttrValue(attrs, 'source_family') ?? series,
    nominalSize:
      readAttrValue(attrs, 'model_size') ??
      readAttrValue(attrs, 'mounting_standard') ??
      undefined,
  };
}

function buildYukenDshgContext(inputCode: string, normalized: string): ProductResolverContext | null {
  if (!isYukenDSHGCode(normalized)) {
    return null;
  }
  const attrs = parseYukenDSHG(inputCode);
  if (!attrs) {
    return null;
  }
  const series = readAttrValue(attrs, 'series') ?? 'DSHG-03';
  return {
    manufacturer: 'Yuken',
    category: HYDRAULIC_VALVE_CATEGORY,
    family: readAttrValue(attrs, 'family') ?? 'DSHG',
    series,
    sourceFamily: readAttrValue(attrs, 'source_family') ?? series,
    nominalSize: readAttrValue(attrs, 'model_size') ?? undefined,
  };
}

/**
 * Builds product-level resolver context from runtime parser output when available.
 */
export function buildProductResolverContext(inputCode: string): ProductResolverContext | null {
  const normalized = normalizeProductCode(inputCode);

  const rexroth = buildRexrothWEContext(inputCode, normalized);
  if (rexroth) {
    return rexroth;
  }

  const dsg = buildYukenDsgContext(inputCode, normalized);
  if (dsg) {
    return dsg;
  }

  return buildYukenDshgContext(inputCode, normalized);
}

export function getRawTokensForProductCode(inputCode: string): {
  spool_symbol?: string;
  coil_rating?: string;
  connector_type?: string;
} {
  const normalized = normalizeProductCode(inputCode);
  if (isRexrothWECode(normalized)) {
    const attrs = parseRexrothWE(inputCode);
    if (!attrs) {
      return {};
    }
    return {
      spool_symbol: readAttrValue(attrs, 'spool_symbol') ?? undefined,
      coil_rating: readAttrValue(attrs, 'coil_rating') ?? undefined,
      connector_type: readAttrValue(attrs, 'connector_type') ?? undefined,
    };
  }
  if (isYukenDSGCode(normalized)) {
    const attrs = parseYukenDSG(inputCode);
    if (!attrs) {
      return {};
    }
    return {
      spool_symbol: readAttrValue(attrs, 'spool_symbol') ?? undefined,
      coil_rating: readAttrValue(attrs, 'coil_rating') ?? undefined,
      connector_type: readAttrValue(attrs, 'connector_type') ?? undefined,
    };
  }
  if (isYukenDSHGCode(normalized)) {
    const attrs = parseYukenDSHG(inputCode);
    if (!attrs) {
      return {};
    }
    return {
      spool_symbol: readAttrValue(attrs, 'spool_symbol') ?? undefined,
      coil_rating: readAttrValue(attrs, 'coil_rating') ?? undefined,
      connector_type: readAttrValue(attrs, 'connector_type') ?? undefined,
    };
  }
  return {};
}
