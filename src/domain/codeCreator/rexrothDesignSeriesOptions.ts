import type { CodeCreatorFieldOption } from '@/types/productCodeCreator';
import type { HydraulicValveMountingGroupKey } from '@/types/productCodeCreator';

function twoDigitRange(start: number, end: number): string[] {
  const values: string[] = [];
  for (let value = start; value <= end; value += 1) {
    values.push(String(value));
  }
  return values;
}

/** Rexroth WE10 ordering uses 3x/5x families as two-digit codes (not 7X shorthand). */
const WE10_DESIGN_SERIES = ['31', '35', '51', '52'];

export function buildRexrothDesignSeriesOptions(
  mounting: HydraulicValveMountingGroupKey
): CodeCreatorFieldOption[] {
  const digits =
    mounting === 'cetop_05_ng10'
      ? WE10_DESIGN_SERIES
      : [...twoDigitRange(60, 69), ...twoDigitRange(70, 79)];

  return digits.map((value) => ({
    value,
    labelTr: value,
  }));
}

export function defaultRexrothDesignSeries(
  mounting: HydraulicValveMountingGroupKey
): string {
  return mounting === 'cetop_05_ng10' ? '35' : '62';
}
