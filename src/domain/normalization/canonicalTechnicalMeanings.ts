export type CanonicalStandardFamily = 'ISO_15552';

export type CanonicalCushioningType =
  | 'pneumatic_adjustable'
  | 'pneumatic_self_adjusting'
  | 'elastic_cushioning';

export const CANONICAL_STANDARD_FAMILY_DISPLAY: Record<CanonicalStandardFamily, string> = {
  ISO_15552: 'ISO 15552',
};

export const CANONICAL_CUSHIONING_DISPLAY: Record<CanonicalCushioningType, string> = {
  pneumatic_adjustable: 'Ayarlanabilir pnömatik sönümleme',
  pneumatic_self_adjusting: 'Kendinden ayarlı pnömatik sönümleme',
  elastic_cushioning: 'Elastik tampon',
};

const STANDARD_FAMILY_ALIASES: Record<string, CanonicalStandardFamily> = {
  ISO_15552: 'ISO_15552',
  ISO15552: 'ISO_15552',
  '15552': 'ISO_15552',
  N3: 'ISO_15552',
};

const CUSHIONING_TOKEN_MAP: Record<string, CanonicalCushioningType> = {
  PPVA: 'pneumatic_adjustable',
  PPV: 'pneumatic_adjustable',
  PPS: 'pneumatic_self_adjusting',
  PPSA: 'pneumatic_self_adjusting',
  P: 'elastic_cushioning',
};

const CUSHIONING_TOKEN_PRIORITY = ['PPVA', 'PPV', 'PPSA', 'PPS', 'P'] as const;

export function normalizeStandardFamilyToken(raw: string | null | undefined): CanonicalStandardFamily | null {
  if (!raw) {
    return null;
  }

  const compact = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (STANDARD_FAMILY_ALIASES[compact]) {
    return STANDARD_FAMILY_ALIASES[compact];
  }

  if (compact.includes('15552')) {
    return 'ISO_15552';
  }

  return null;
}

export function normalizeCushioningToken(
  raw: string | null | undefined
): CanonicalCushioningType | null {
  if (!raw) {
    return null;
  }

  const token = raw.trim().toUpperCase();

  for (const known of CUSHIONING_TOKEN_PRIORITY) {
    if (token === known) {
      return CUSHIONING_TOKEN_MAP[known];
    }
  }

  return CUSHIONING_TOKEN_MAP[token] ?? null;
}

export function getCanonicalStandardFamilyDisplay(canonical: CanonicalStandardFamily): string {
  return CANONICAL_STANDARD_FAMILY_DISPLAY[canonical];
}

export function getCanonicalCushioningDisplay(canonical: CanonicalCushioningType): string {
  return CANONICAL_CUSHIONING_DISPLAY[canonical];
}

export function formatRawTokenSuffix(options: {
  rawToken?: string;
  manufacturer?: string;
}): string | undefined {
  if (!options.rawToken) {
    return undefined;
  }

  if (options.manufacturer) {
    return `(${options.manufacturer} kodu: ${options.rawToken})`;
  }

  return `(kod: ${options.rawToken})`;
}

export function formatCanonicalDisplayValue(options: {
  displayValue: string;
  rawToken?: string;
  manufacturer?: string;
}): string {
  const suffix = formatRawTokenSuffix(options);
  if (!suffix || options.displayValue === options.rawToken) {
    return options.displayValue;
  }

  return `${options.displayValue}\n${suffix}`;
}
