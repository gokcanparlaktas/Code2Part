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
import type {
  ConfidenceLevel,
  ProductSeriesRecord,
  TechnicalAttribute,
} from '@/types/product';

function attributeFromSeries<T extends string | number>(
  value: T,
  evidence: TechnicalAttribute<T>['evidence'] = 'series_table'
): TechnicalAttribute<T> {
  return { value, evidence, requiresCheck: false };
}

function unknownAttribute<T extends string | number>(): TechnicalAttribute<T> {
  return { value: null, evidence: 'unknown', requiresCheck: true };
}

function attributeFromCode<T extends string | number>(value: T): TechnicalAttribute<T> {
  return { value, evidence: 'code', requiresCheck: false };
}

function attributeInferred<T extends string | number>(value: T): TechnicalAttribute<T> {
  return { value, evidence: 'inferred', requiresCheck: true };
}

export function parseHydraulicCoilVoltage(
  normalizedCode: string,
  series: ProductSeriesRecord
): TechnicalAttribute<string> {
  if (/\bEG24\b/.test(normalizedCode) || /EG24N/.test(normalizedCode)) {
    return attributeFromCode('24 V DC (EG24)');
  }
  if (/\bCG24\b/.test(normalizedCode) || /CG24N/.test(normalizedCode)) {
    return attributeFromCode('24 V DC (CG24)');
  }
  if (/\bD24\b/.test(normalizedCode) || /-D24-/.test(normalizedCode)) {
    return attributeFromCode('24 V DC (D24)');
  }
  if (/24DC/.test(normalizedCode)) {
    return attributeFromCode('24 V DC');
  }

  // Vickers DG4V catalog rating segment can encode coil rating + tank pressure class (e.g. H7).
  // We treat H as 24V DC, but still require catalog check.
  if (series.series.startsWith('DG4V')) {
    const match = normalizedCode.match(/-(H)([4-7])(?:-|$)/i);
    if (match) {
      return {
        value: '24 V DC',
        evidence: 'code',
        requiresCheck: true,
      };
    }
  }

  if (series.defaultCoilVoltageTr) {
    return {
      value: series.defaultCoilVoltageTr,
      evidence: 'series_table',
      requiresCheck: true,
    };
  }

  return unknownAttribute();
}

export function parseHydraulicSpoolFunction(
  normalizedCode: string,
  series: ProductSeriesRecord
): TechnicalAttribute<string> {
  const prefix = series.codePrefix.replace(/-/g, '');

  const rexrothMatch = normalizedCode.match(/^4WE6([A-Z])/);
  if (rexrothMatch && series.codePrefix.startsWith('4WE6')) {
    return attributeFromCode(`Spool ${rexrothMatch[1]}`);
  }

  const rexroth3Match = normalizedCode.match(/^3WE6([A-Z])/);
  if (rexroth3Match && series.codePrefix.startsWith('3WE6')) {
    return attributeFromCode(`Spool ${rexroth3Match[1]}`);
  }

  const rexroth10Match = normalizedCode.match(/^4WE10([A-Z])/);
  if (rexroth10Match && series.codePrefix.startsWith('4WE10')) {
    return attributeFromCode(`Spool ${rexroth10Match[1]}`);
  }

  const yukenMatch = normalizedCode.match(/3C\d{1,2}/);
  if (yukenMatch && series.series.startsWith('DSG')) {
    return attributeInferred(yukenMatch[0]);
  }

  const vickersMatch = normalizedCode.match(/-(\d[A-Z])-/);
  if (vickersMatch && series.series.startsWith('DG4V')) {
    return attributeFromCode(vickersMatch[1]);
  }

  return unknownAttribute();
}

/** True when a manufacturer parser can read a complete product code (not prefix-only). */
export function canFullyParseHydraulicProductCode(
  inputCode: string,
  series: ProductSeriesRecord
): boolean {
  const normalized = normalizeProductCode(inputCode);

  if (
    series.codePrefix.startsWith('3WE6') ||
    series.codePrefix.startsWith('4WE6') ||
    series.codePrefix.startsWith('4WE10') ||
    isRexrothWECode(normalized)
  ) {
    return parseRexrothWE(inputCode) !== null;
  }

  if (
    series.series.startsWith('DSG') ||
    series.codePrefix.startsWith('DSG-') ||
    isYukenDSGCode(normalized)
  ) {
    return parseYukenDSG(inputCode) !== null;
  }

  if (
    series.series.startsWith('DSHG') ||
    series.codePrefix.startsWith('DSHG-') ||
    isYukenDSHGCode(normalized)
  ) {
    return parseYukenDSHG(inputCode) !== null;
  }

  if (
    series.series.startsWith('DG4V') ||
    series.codePrefix.startsWith('DG4V-') ||
    isVickersDG4VCode(normalized)
  ) {
    return parseVickersDG4V(inputCode) !== null;
  }

  const { valveCoilVoltage } = parseHydraulicValveAttributes(normalized, series);
  return valveCoilVoltage.evidence === 'code';
}

export function parseHydraulicValveAttributes(
  normalizedCode: string,
  series: ProductSeriesRecord
): {
  cetopNgSize: TechnicalAttribute<string>;
  valveCoilVoltage: TechnicalAttribute<string>;
  valveSpoolFunction: TechnicalAttribute<string>;
  parsedFromCode: boolean;
} {
  const cetopLabel = series.cetopNgLabel ?? series.standardFamily;
  const valveCoilVoltage = parseHydraulicCoilVoltage(normalizedCode, series);
  const valveSpoolFunction = parseHydraulicSpoolFunction(normalizedCode, series);

  const parsedFromCode = valveCoilVoltage.evidence === 'code';

  return {
    cetopNgSize: attributeFromSeries(cetopLabel, 'standard'),
    valveCoilVoltage,
    valveSpoolFunction,
    parsedFromCode,
  };
}

export function resolveHydraulicValveConfidence(
  series: ProductSeriesRecord,
  parsedFromCode: boolean
): ConfidenceLevel {
  // Kept for backwards compatibility; real confidence is now category-specific and
  // computed in the identify flow. This function returns a safe default.
  if (!parsedFromCode) {
    return 'medium';
  }
  return 'medium';
}
