export type HydraulicFunctionCentering =
  | 'spring_centered'
  | 'spring_offset'
  | 'detented'
  | 'unknown';

export type HydraulicFunctionCenterCondition =
  | 'closed_center'
  | 'open_center'
  | 'tandem_center'
  | 'float_center'
  | 'partially_open'
  | 'unknown';

export type HydraulicFunctionNormallyState = 'normally_open' | 'normally_closed' | 'unknown';

import {
  getRexrothWE6SpoolSemantics,
  isRexrothWE6BaseSpoolSymbol,
  rexrothWE6BehaviorLookupToken,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import { getVickersDG4VSpoolSemantics } from '@/domain/categories/hydraulicValve/manufacturers/vickers/vickersDG4VSemantics';

export type HydraulicFunctionBehaviorConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type HydraulicFunctionBehavior = {
  rawToken: string;
  manufacturer: string;
  series: string;
  positions?: 2 | 3;
  centering?: HydraulicFunctionCentering;
  centerCondition?: HydraulicFunctionCenterCondition;
  normallyState?: HydraulicFunctionNormallyState;
  confidence: HydraulicFunctionBehaviorConfidence;
  requiresCatalogCheck: boolean;
  note?: string;
};

type BehaviorLookupKey = string;

function behaviorKey(manufacturer: string, series: string, token: string): BehaviorLookupKey {
  return `${normalizeManufacturer(manufacturer)}|${normalizeSeriesFamily(series)}|${token.trim().toUpperCase()}`;
}

export function normalizeManufacturer(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeSeriesFamily(series: string): string {
  const upper = series.trim().toUpperCase();
  if (upper.startsWith('4WE6') || upper.startsWith('4WE10') || upper === '4WE6' || upper === '4WE10') {
    return '4WE';
  }
  if (upper.startsWith('DSG')) {
    return 'DSG';
  }
  if (upper.startsWith('DG4V')) {
    return 'DG4V';
  }
  if (upper === 'DHI' || upper === 'DHU') {
    return upper;
  }
  if (upper.startsWith('D1VW') || upper.startsWith('D3VW')) {
    return upper.replace(/-/g, '').slice(0, 4);
  }
  return upper;
}

function entry(
  manufacturer: string,
  series: string,
  token: string,
  behavior: Omit<HydraulicFunctionBehavior, 'rawToken' | 'manufacturer' | 'series'>
): HydraulicFunctionBehavior {
  return {
    rawToken: token.trim().toUpperCase(),
    manufacturer,
    series,
    ...behavior,
  };
}

function vickersDG4VBehaviorEntries(series: 'DG4V-3' | 'DG4V-5'): HydraulicFunctionBehavior[] {
  const codes = ['2A', '4C', '6C', '6B'] as const;
  return codes.map((code) => {
    const sem = getVickersDG4VSpoolSemantics(code);
    if (!sem) {
      return entry('Vickers', series, code, {
        positions: 3,
        centering: 'unknown',
        centerCondition: 'unknown',
        normallyState: 'unknown',
        confidence: 'low',
        requiresCatalogCheck: true,
      });
    }
    return entry('Vickers', series, code, {
      positions: sem.numberOfPositions,
      centering: sem.centering,
      centerCondition: sem.centerCondition,
      normallyState: 'unknown',
      confidence: 'low',
      requiresCatalogCheck: true,
      note: sem.behaviorNoteTr,
    });
  });
}

function rexrothWE6BehaviorEntries(series: '4WE6' | '4WE10'): HydraulicFunctionBehavior[] {
  const symbols = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'J', 'Y'] as const;
  return symbols.map((symbol) => {
    const sem = getRexrothWE6SpoolSemantics(symbol);
    return entry('Rexroth', series, symbol, {
      positions: sem.numberOfPositions,
      centering: sem.centering,
      centerCondition: sem.centerCondition,
      normallyState: sem.normallyState,
      confidence: 'medium',
      requiresCatalogCheck: true,
      note: sem.behaviorNoteTr,
    });
  });
}

/** Static behavior tags for demo catalog tokens (cautious; not full symbol simulation). */
const HYDRAULIC_FUNCTION_BEHAVIORS: HydraulicFunctionBehavior[] = [
  ...rexrothWE6BehaviorEntries('4WE6'),
  ...rexrothWE6BehaviorEntries('4WE10'),

  // Yuken DSG
  entry('Yuken', 'DSG-01', '3C2', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
    note: 'Yuken DSG spool type; katalogdan doğrulanmalıdır.',
  }),
  entry('Yuken', 'DSG-03', '3C2', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'closed_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C3', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C4', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C40', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'float_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C60', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'open_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C9', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
    note: 'Yuken DSG spool type; katalogdan doğrulanmalıdır.',
  }),
  entry('Yuken', 'DSG-03', '3C9', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-01', '3C12', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),
  entry('Yuken', 'DSG-03', '3C12', {
    positions: 3,
    centering: 'spring_centered',
    centerCondition: 'tandem_center',
    normallyState: 'unknown',
    confidence: 'medium',
    requiresCatalogCheck: true,
  }),

  // Atos — manufacturer-specific; do not assume Rexroth/Yuken equivalence
  entry('Atos', 'DHI', '0611', {
    positions: 3,
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'low',
    requiresCatalogCheck: true,
    note: 'Atos konfigürasyon kodu; üretici sembol haritası gerekir.',
  }),
  entry('Atos', 'DHI', '0631', {
    positions: 3,
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'low',
    requiresCatalogCheck: true,
  }),
  entry('Atos', 'DHI', '0711', {
    positions: 3,
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'low',
    requiresCatalogCheck: true,
    note: 'Atos DHI spool/config kodu; diğer markalarla birebir eşlenmez.',
  }),
  entry('Atos', 'DHU', '0711', {
    positions: 3,
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'low',
    requiresCatalogCheck: true,
  }),
  entry('Atos', 'DHU', '0714', {
    positions: 3,
    centering: 'unknown',
    centerCondition: 'unknown',
    normallyState: 'unknown',
    confidence: 'low',
    requiresCatalogCheck: true,
  }),

  ...vickersDG4VBehaviorEntries('DG4V-3'),
  ...vickersDG4VBehaviorEntries('DG4V-5'),
];

const behaviorByKey = new Map<string, HydraulicFunctionBehavior>(
  HYDRAULIC_FUNCTION_BEHAVIORS.map((b) => [behaviorKey(b.manufacturer, b.series, b.rawToken), b])
);

function rexrothBehaviorFromOrderingToken(
  manufacturer: string,
  series: string,
  orderingToken: string
): HydraulicFunctionBehavior | null {
  const baseToken = rexrothWE6BehaviorLookupToken(orderingToken);
  if (!baseToken || !isRexrothWE6BaseSpoolSymbol(baseToken)) {
    return null;
  }

  const baseKey = behaviorKey(manufacturer, series, baseToken);
  const base = behaviorByKey.get(baseKey);
  if (!base) {
    return null;
  }

  if (orderingToken === baseToken) {
    return base;
  }

  return {
    ...base,
    rawToken: orderingToken,
    note: `${orderingToken} → ${baseToken} temel sembolü; ${base.note ?? ''}`.trim(),
  };
}

export function resolveHydraulicFunctionBehavior(options: {
  manufacturer: string;
  series: string;
  token: string | null;
}): HydraulicFunctionBehavior | null {
  const token = options.token?.trim().toUpperCase();
  if (!token) {
    return null;
  }

  const key = behaviorKey(options.manufacturer, options.series, token);
  const direct = behaviorByKey.get(key);
  if (direct) {
    return direct;
  }

  if (normalizeManufacturer(options.manufacturer) === 'rexroth') {
    const family = normalizeSeriesFamily(options.series);
    if (family === '4WE') {
      return rexrothBehaviorFromOrderingToken(options.manufacturer, options.series, token);
    }
  }

  // Parker D1VW numeric tokens — no behavior table yet
  return null;
}

export function getAllHydraulicFunctionBehaviors(): HydraulicFunctionBehavior[] {
  return [...HYDRAULIC_FUNCTION_BEHAVIORS];
}

/** Center conditions that may be treated as cautiously similar for cross-brand check only. */
const CAUTIOUS_CENTER_ALIASES: Partial<
  Record<HydraulicFunctionCenterCondition, HydraulicFunctionCenterCondition[]>
> = {
  closed_center: ['closed_center', 'partially_open'],
  partially_open: ['closed_center', 'partially_open', 'open_center', 'tandem_center'],
  open_center: ['open_center', 'partially_open'],
  tandem_center: ['tandem_center', 'partially_open'],
};

export function centerConditionsAreCompatibleForSimilarity(
  a: HydraulicFunctionCenterCondition,
  b: HydraulicFunctionCenterCondition
): boolean {
  if (a === b) {
    return true;
  }
  if (a === 'unknown' || b === 'unknown') {
    return false;
  }
  const aliasesA = CAUTIOUS_CENTER_ALIASES[a] ?? [a];
  const aliasesB = CAUTIOUS_CENTER_ALIASES[b] ?? [b];
  return aliasesA.some((x) => aliasesB.includes(x));
}

export function behaviorsHaveSimilarTags(
  source: HydraulicFunctionBehavior,
  target: HydraulicFunctionBehavior
): boolean {
  if (source.positions !== undefined && target.positions !== undefined && source.positions !== target.positions) {
    return false;
  }

  if (
    source.centering !== undefined &&
    target.centering !== undefined &&
    source.centering !== 'unknown' &&
    target.centering !== 'unknown' &&
    source.centering !== target.centering
  ) {
    return false;
  }

  const sourceCenter = source.centerCondition ?? 'unknown';
  const targetCenter = target.centerCondition ?? 'unknown';

  if (sourceCenter === 'unknown' || targetCenter === 'unknown') {
    return false;
  }

  return centerConditionsAreCompatibleForSimilarity(sourceCenter, targetCenter);
}

export function behaviorsHaveDifferentCenter(
  source: HydraulicFunctionBehavior,
  target: HydraulicFunctionBehavior
): boolean {
  const sourceCenter = source.centerCondition ?? 'unknown';
  const targetCenter = target.centerCondition ?? 'unknown';

  if (sourceCenter === 'unknown' || targetCenter === 'unknown') {
    return false;
  }

  return sourceCenter !== targetCenter;
}

export function normalizeSeriesForExactMatch(series: string): string {
  return series.trim().toUpperCase();
}

export function isSameManufacturerSeriesToken(
  source: HydraulicFunctionBehavior,
  target: HydraulicFunctionBehavior
): boolean {
  return (
    normalizeManufacturer(source.manufacturer) === normalizeManufacturer(target.manufacturer) &&
    normalizeSeriesForExactMatch(source.series) === normalizeSeriesForExactMatch(target.series) &&
    source.rawToken === target.rawToken
  );
}
