import type { ProductResolverCategory } from '@/types/category';

export const HYDRAULIC_VALVE_BEHAVIOR_CATEGORY: ProductResolverCategory = 'hydraulic_valve';

export type HydraulicValveBehaviorConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type HydraulicValveValveWays = 2 | 3 | 4 | 5 | 'unknown';

export type HydraulicValvePositions = 2 | 3 | 'unknown';

export type HydraulicValveCentering =
  | 'spring_centered'
  | 'spring_offset'
  | 'detented'
  | 'unknown';

export type HydraulicValveCenterCondition =
  | 'closed_center'
  | 'open_center'
  | 'tandem_center'
  | 'float_center'
  | 'partially_open'
  | 'not_applicable'
  | 'unknown';

export type HydraulicValveNormallyState =
  | 'normally_open'
  | 'normally_closed'
  | 'unknown';

export type HydraulicValveBehaviorProfile = {
  productCategory: typeof HYDRAULIC_VALVE_BEHAVIOR_CATEGORY;

  brand?: string;
  series?: string;

  cetopNg?: string;
  valveWays?: HydraulicValveValveWays;
  positions?: HydraulicValvePositions;

  centering?: HydraulicValveCentering;
  centerCondition?: HydraulicValveCenterCondition;
  normallyState?: HydraulicValveNormallyState;

  spoolSymbol?: string;
  spoolType?: string;
  manufacturerFunctionCode?: string;

  voltage?: string | null;
  voltageCode?: string | null;
  connector?: string | null;
  connectorCode?: string | null;

  manualOverride?: string | null;
  designSeries?: string | null;

  maxPressureBar?: number | null;
  maxFlowLpm?: number | null;

  confidence: HydraulicValveBehaviorConfidence;
  requiresCatalogCheck: boolean;
  notes: string[];
};

export const CENTER_CONDITION_LABEL_TR: Record<HydraulicValveCenterCondition, string> = {
  closed_center: 'Kapalı merkez',
  open_center: 'Açık merkez',
  tandem_center: 'Tandem merkez',
  float_center: 'Yüzer merkez',
  partially_open: 'Kısmi açık',
  not_applicable: 'Uygulanamaz',
  unknown: 'Bilinmiyor',
};

export const CENTERING_LABEL_TR: Record<HydraulicValveCentering, string> = {
  spring_centered: 'Yay merkezlemeli',
  spring_offset: 'Yay ofsetli',
  detented: 'Kilitlemeli',
  unknown: 'Bilinmiyor',
};

export const POSITIONS_LABEL_TR: Record<Exclude<HydraulicValvePositions, 'unknown'>, string> = {
  2: '2 konumlu',
  3: '3 konumlu',
};

/** Coil codes that must not be treated as confirmed voltage without registry/catalog mapping. */
export const UNRESOLVED_VOLTAGE_CODES = new Set<string>();

export function isSameManufacturerSeries(
  a: HydraulicValveBehaviorProfile,
  b: HydraulicValveBehaviorProfile
): boolean {
  if (!a.brand || !b.brand || !a.series || !b.series) {
    return false;
  }
  return (
    a.brand.trim().toLowerCase() === b.brand.trim().toLowerCase() &&
    a.series.trim().toUpperCase() === b.series.trim().toUpperCase()
  );
}

export function isExactManufacturerFunctionMatch(
  a: HydraulicValveBehaviorProfile,
  b: HydraulicValveBehaviorProfile
): boolean {
  if (!isSameManufacturerSeries(a, b)) {
    return false;
  }
  if (!a.manufacturerFunctionCode || !b.manufacturerFunctionCode) {
    return false;
  }
  return (
    a.manufacturerFunctionCode.trim().toUpperCase() ===
    b.manufacturerFunctionCode.trim().toUpperCase()
  );
}
