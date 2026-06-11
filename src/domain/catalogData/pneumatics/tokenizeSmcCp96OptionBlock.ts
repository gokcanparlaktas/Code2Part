import {
  matchCp96OrderKey,
  parseCp96OrderKeyFields,
} from './parseCp96OrderKey';
import type { PneumaticRawParsedField } from './types';

/**
 * @deprecated Legacy SDB block splitter — use parseCp96OrderKeyFields for official order key.
 * Kept for backward compatibility with non-standard compact fragments only.
 */
export function expandSmcCp96PrefixOptionBlock(
  block: string,
  series: string
): PneumaticRawParsedField[] {
  if (series !== 'CP96' && series !== 'CP96SD') {
    return [
      {
        attributeKey: 'prefix_option_block',
        rawToken: block,
        evidence: 'code',
        confidence: 'medium',
        requiresCatalogCheck: true,
      },
    ];
  }

  return [
    {
      attributeKey: 'prefix_option_block',
      rawToken: block,
      position: 'legacy_compact_block',
      evidence: 'code',
      confidence: 'low',
      requiresCatalogCheck: true,
    },
  ];
}

export function expandSmcCp96SuffixBlock(
  suffix: string,
  series: string
): PneumaticRawParsedField[] {
  if (!suffix) {
    return [];
  }

  return [
    {
      attributeKey: 'suffix_block',
      rawToken: suffix.trim().toUpperCase(),
      position: 'legacy_suffix',
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
    },
  ];
}

export function tryParseCp96OfficialOrderKey(code: string): PneumaticRawParsedField[] | null {
  const match = matchCp96OrderKey(code);
  if (!match) {
    return null;
  }
  return parseCp96OrderKeyFields(match);
}
