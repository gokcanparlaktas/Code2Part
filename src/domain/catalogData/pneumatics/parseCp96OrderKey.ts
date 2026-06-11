import type { PneumaticRawParsedField } from './types';

/** SMC CP96 catalog order-key mounting codes (position: after series variant suffix). */
export const CP96_MOUNTING_CODES = new Set(['B', 'L', 'F', 'G', 'C', 'D', 'V']);

/** Bore sizes for CP96S/CP96SD line (mm). */
export const CP96S_BORE_SIZES = new Set([32, 40, 50, 63, 80, 100, 125]);

/** Bore sizes for CP96K/CP96KD non-rotating rod line (mm). */
export const CP96K_BORE_SIZES = new Set([32, 40, 50, 63, 80, 100]);

const ROD_BOOT_TOKENS = ['JJ', 'KK', 'J', 'K'] as const;

export type Cp96FamilyLine = 'CP96S' | 'CP96K';

export type Cp96SeriesModelVariant = 'CP96S' | 'CP96SD' | 'CP96K' | 'CP96KD';

export interface Cp96OrderKeyMatch {
  familyLine: Cp96FamilyLine;
  seriesModelVariant: Cp96SeriesModelVariant;
  mountingToken: string;
  boreMm: number;
  strokeMm: number;
  strokeSuffix: string;
}

function parseCp96FamilyMatch(
  code: string,
  familyPrefix: 'CP96S' | 'CP96K',
  autoSwitchSuffix: 'D',
  boreSizes: Set<number>
): Cp96OrderKeyMatch | null {
  const letter = familyPrefix === 'CP96S' ? 'S' : 'K';
  const match = code.match(
    new RegExp(`^CP96${letter}(${autoSwitchSuffix})?([BLFGCDV])(\\d{2,3})-(\\d+)(.*)$`)
  );
  if (!match) {
    return null;
  }

  const boreMm = Number(match[3]);
  const strokeMm = Number(match[4]);
  if (Number.isNaN(boreMm) || Number.isNaN(strokeMm) || !boreSizes.has(boreMm)) {
    return null;
  }

  const hasAutoSwitch = match[1] === autoSwitchSuffix;
  const seriesModelVariant: Cp96SeriesModelVariant =
    familyPrefix === 'CP96S'
      ? hasAutoSwitch
        ? 'CP96SD'
        : 'CP96S'
      : hasAutoSwitch
        ? 'CP96KD'
        : 'CP96K';

  return {
    familyLine: familyPrefix,
    seriesModelVariant,
    mountingToken: match[2],
    boreMm,
    strokeMm,
    strokeSuffix: match[5] ?? '',
  };
}

/**
 * Official SMC CP96 order keys:
 * - CP96S / CP96SD — standard ISO 15552 line
 * - CP96K / CP96KD — non-rotating rod line
 */
export function matchCp96OrderKey(code: string): Cp96OrderKeyMatch | null {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, '');

  if (normalized.startsWith('CP96K')) {
    return parseCp96FamilyMatch(normalized, 'CP96K', 'D', CP96K_BORE_SIZES);
  }

  if (normalized.startsWith('CP96S')) {
    return parseCp96FamilyMatch(normalized, 'CP96S', 'D', CP96S_BORE_SIZES);
  }

  return null;
}

function seriesVariantRawToken(variant: Cp96SeriesModelVariant): string {
  switch (variant) {
    case 'CP96SD':
      return 'SD';
    case 'CP96KD':
      return 'KD';
    case 'CP96K':
      return 'K';
    default:
      return 'S';
  }
}

function hasAutoSwitchVariant(variant: Cp96SeriesModelVariant): boolean {
  return variant === 'CP96SD' || variant === 'CP96KD';
}

export function parseCp96OrderKeyFields(match: Cp96OrderKeyMatch): PneumaticRawParsedField[] {
  const fields: PneumaticRawParsedField[] = [
    {
      attributeKey: 'series',
      rawToken: 'CP96',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    },
    {
      attributeKey: 'series_family_line',
      rawToken: match.familyLine,
      position: 'series_family_line',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    },
    {
      attributeKey: 'series_model_variant',
      rawToken: seriesVariantRawToken(match.seriesModelVariant),
      position: 'series_variant_suffix',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    },
    {
      attributeKey: 'mounting_style',
      rawToken: match.mountingToken,
      position: 'order_key_mounting',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    },
    {
      attributeKey: 'bore_mm',
      rawValue: match.boreMm,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    },
    {
      attributeKey: 'stroke_mm',
      rawValue: match.strokeMm,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    },
  ];

  if (match.familyLine === 'CP96K') {
    fields.push({
      attributeKey: 'rod_non_rotating',
      rawToken: 'CP96K',
      position: 'series_family_line',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    });
  }

  if (hasAutoSwitchVariant(match.seriesModelVariant)) {
    fields.push({
      attributeKey: 'magnet_sensor_capability',
      rawToken: match.seriesModelVariant,
      position: 'series_variant_suffix',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    });
  }

  fields.push(
    ...parseCp96StrokeSuffix(match.strokeSuffix, hasAutoSwitchVariant(match.seriesModelVariant))
  );

  return fields;
}

export function parseCp96StrokeSuffix(
  suffix: string,
  hasAutoSwitchTail: boolean
): PneumaticRawParsedField[] {
  const fields: PneumaticRawParsedField[] = [];
  let rest = suffix.toUpperCase();

  if (rest.startsWith('C')) {
    fields.push({
      attributeKey: 'cushioning',
      rawToken: 'C',
      position: 'stroke_suffix_cushion',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    });
    rest = rest.slice(1);
  } else if (!rest) {
    fields.push({
      attributeKey: 'cushioning',
      rawToken: 'blank',
      position: 'stroke_suffix_cushion',
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
    });
  }

  for (const boot of ROD_BOOT_TOKENS) {
    if (rest.startsWith(boot)) {
      fields.push({
        attributeKey: 'rod_boot',
        rawToken: boot,
        position: 'stroke_suffix_rod_boot',
        evidence: 'code',
        confidence: 'high',
        requiresCatalogCheck: true,
      });
      rest = rest.slice(boot.length);
      break;
    }
  }

  if (rest.startsWith('W')) {
    fields.push({
      attributeKey: 'rod_configuration',
      rawToken: 'W',
      position: 'stroke_suffix_rod',
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: true,
    });
    rest = rest.slice(1);
  }

  if (rest && hasAutoSwitchTail) {
    fields.push({
      attributeKey: 'auto_switch_block',
      rawToken: rest,
      position: 'stroke_suffix_auto_switch',
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
    });
  } else if (rest) {
    fields.push({
      attributeKey: 'suffix_block',
      rawToken: rest,
      position: 'stroke_suffix_tail',
      evidence: 'code',
      confidence: 'medium',
      requiresCatalogCheck: true,
    });
  }

  return fields;
}
