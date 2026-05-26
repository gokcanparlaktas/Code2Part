import {
  compareValveFunctionBehavior,
  type CompareValveFunctionBehaviorResult,
} from './compareValveFunctionBehavior';

export type CompareValveFunctionsResult = CompareValveFunctionBehaviorResult;

export interface CompareValveFunctionsOptions {
  label: string;
  source: { manufacturer: string; series: string; token: string | null };
  target: { manufacturer: string; series: string; token: string | null };
}

/** Compares spool/function tokens using semantic behavior tags (preferred). */
export function compareValveFunctions(
  options: CompareValveFunctionsOptions
): CompareValveFunctionsResult {
  return compareValveFunctionBehavior(options);
}
