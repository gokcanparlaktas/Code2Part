import { stripLeadingBrandToken } from '@/domain/categories/rollingBearing/isRollingBearingCode';
import { splitBearingDesignation } from '@/domain/categories/rollingBearing/splitBearingDesignation';

/**
 * Extracts a metric base designation (e.g. 6205, 22205) from a normalized bearing code.
 * Suffix blocks after the base are ignored for dimension lookup.
 */
export function extractBearingBaseCode(normalizedCode: string): string | null {
  const compact = normalizedCode.replace(/\s+/g, '').toUpperCase();
  const remainder = stripLeadingBrandToken(compact);
  return splitBearingDesignation(remainder).baseCode;
}
