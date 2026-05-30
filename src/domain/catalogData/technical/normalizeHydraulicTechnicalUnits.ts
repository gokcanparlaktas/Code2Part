/** 1 MPa ≈ 10 bar (hydraulic catalog convention in this project). */
export const MPA_TO_BAR = 10;

export type PressureQuantity = {
  value: number;
  unit: string;
  notes?: string;
};

export type FlowQuantity = {
  value: number;
  unit: string;
  notes?: string;
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\s+/g, '');
}

export function pressureToBar(quantity: PressureQuantity): number {
  const unit = normalizeUnit(quantity.unit);
  if (unit === 'bar') {
    return quantity.value;
  }
  if (unit === 'mpa') {
    return quantity.value * MPA_TO_BAR;
  }
  throw new Error(`Unsupported pressure unit: ${quantity.unit}`);
}

export function flowToLpm(quantity: FlowQuantity): number {
  const unit = normalizeUnit(quantity.unit);
  if (unit === 'l/min' || unit === 'lpm') {
    return quantity.value;
  }
  throw new Error(`Unsupported flow unit: ${quantity.unit}`);
}

export function formatPressureCandidateDisplay(
  quantity: PressureQuantity,
  options?: { includeOriginalUnit?: boolean }
): string {
  const bar = pressureToBar(quantity);
  const unit = normalizeUnit(quantity.unit);
  if (unit === 'bar' || !options?.includeOriginalUnit) {
    return `${bar} bar`;
  }
  return `${quantity.value} ${quantity.unit} (${bar} bar)`;
}

export function formatFlowCandidateDisplay(quantity: FlowQuantity): string {
  const lpm = flowToLpm(quantity);
  const unit = normalizeUnit(quantity.unit);
  if (unit === 'l/min' || unit === 'lpm') {
    return `${lpm} L/dk`;
  }
  return `${quantity.value} ${quantity.unit}`;
}

export function pressuresEquivalentBar(
  leftBar: number,
  rightBar: number,
  toleranceBar = 1
): boolean {
  return Math.abs(leftBar - rightBar) <= toleranceBar;
}
