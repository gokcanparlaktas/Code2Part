import {
  getDefaultCatalogDataProvider,
  type CatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import type {
  CatalogCandidateConfidence,
  ProductResolverContext,
} from '@/domain/catalogData/types';
import {
  flowToLpm,
  formatFlowCandidateDisplay,
  formatPressureCandidateDisplay,
  pressureToBar,
  type FlowQuantity,
  type PressureQuantity,
} from '@/domain/catalogData/technical/normalizeHydraulicTechnicalUnits';

export interface TechnicalDataResolved {
  found: boolean;
  needsReview: boolean;
  confidence: CatalogCandidateConfidence;
  maxOperatingPressureBar?: number;
  maxOperatingPressureDisplay?: string;
  maxFlowLpm?: number;
  maxFlowDisplay?: string;
  maxFlowNotes?: string;
  tankPortMaxPressureBar?: number;
  tankPortMaxPressureDisplay?: string;
  reviewNotes?: string[];
}

function readQuantity(value: unknown): PressureQuantity | FlowQuantity | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as { value?: number; unit?: string; notes?: string };
  if (typeof row.value !== 'number' || !row.unit) {
    return null;
  }
  return {
    value: row.value,
    unit: row.unit,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  };
}

function resolveRexrothTechnicalData(
  context: ProductResolverContext,
  catalogProvider: CatalogDataProvider
): TechnicalDataResolved {
  const catalog = catalogProvider.getRexrothTechnicalDataCatalog();
  const entry = catalog.entries?.find((row) => {
    if (row.technicalGroup !== 'hydraulic') {
      return false;
    }
    if (row.sourceFamily?.toUpperCase() !== context.sourceFamily.toUpperCase()) {
      return false;
    }
    if (context.nominalSize && row.nominalSize != null) {
      return String(row.nominalSize) === String(context.nominalSize);
    }
    return true;
  });

  if (!entry?.values) {
    return { found: false, needsReview: true, confidence: 'unknown' };
  }

  const values = entry.values as Record<string, unknown>;
  const maxOp = values.maximumOperatingPressure as Record<string, unknown> | undefined;
  const portsPab = maxOp?.portsPAB as Record<string, unknown> | undefined;
  const pressureQty = readQuantity(portsPab?.standardVersion);
  const portT = maxOp?.portT as Record<string, unknown> | undefined;
  const tankQty = readQuantity(portT?.directVoltageDC);

  const maxFlowRoot = values.maximumFlow as Record<string, unknown> | undefined;
  const dcFlow = maxFlowRoot?.directVoltageDC as Record<string, unknown> | undefined;
  const flowQty = readQuantity(dcFlow?.standardVersion);

  const result: TechnicalDataResolved = {
    found: Boolean(pressureQty || flowQty || tankQty),
    needsReview: entry.needsReview ?? true,
    confidence: entry.confidence ?? 'medium',
    reviewNotes: entry.notes,
  };

  if (pressureQty) {
    result.maxOperatingPressureBar = pressureToBar(pressureQty);
    result.maxOperatingPressureDisplay = formatPressureCandidateDisplay(pressureQty, {
      includeOriginalUnit: true,
    });
  }

  if (flowQty) {
    result.maxFlowLpm = flowToLpm(flowQty);
    result.maxFlowDisplay = formatFlowCandidateDisplay(flowQty);
    result.maxFlowNotes = flowQty.notes;
  }

  if (tankQty) {
    result.tankPortMaxPressureBar = pressureToBar(tankQty);
    result.tankPortMaxPressureDisplay = formatPressureCandidateDisplay(tankQty, {
      includeOriginalUnit: true,
    });
  }

  return result;
}

function resolveYukenDsgTechnicalData(
  context: ProductResolverContext,
  catalogProvider: CatalogDataProvider
): TechnicalDataResolved {
  const catalog = catalogProvider.getYukenDsgTechnicalDataCatalog();
  const seriesKey = context.sourceFamily.toUpperCase();
  const entry = catalog.entries?.find((row) => {
    if (row.technicalGroup !== 'general_specifications') {
      return false;
    }
    const modelSeries = String(row.modelSeries ?? '').toUpperCase();
    return modelSeries === seriesKey || modelSeries === context.series.toUpperCase();
  });

  if (!entry?.values) {
    return { found: false, needsReview: true, confidence: 'unknown' };
  }

  const values = entry.values as Record<string, unknown>;
  const pressureQty = readQuantity(values.maximumOperatingPressure);
  const flowQty = readQuantity(values.maximumFlow);
  const tankQty = readQuantity(values.maximumTLineBackPressure);

  const result: TechnicalDataResolved = {
    found: Boolean(pressureQty || flowQty || tankQty),
    needsReview: entry.needsReview ?? true,
    confidence: entry.confidence ?? 'medium',
    reviewNotes: Array.isArray(entry.notes) ? entry.notes : undefined,
  };

  if (pressureQty) {
    result.maxOperatingPressureBar = pressureToBar(pressureQty);
    result.maxOperatingPressureDisplay = formatPressureCandidateDisplay(pressureQty, {
      includeOriginalUnit: true,
    });
  }

  if (flowQty) {
    result.maxFlowLpm = flowToLpm(flowQty);
    result.maxFlowDisplay = formatFlowCandidateDisplay(flowQty);
    result.maxFlowNotes = flowQty.notes;
  }

  if (tankQty) {
    result.tankPortMaxPressureBar = pressureToBar(tankQty);
    result.tankPortMaxPressureDisplay = formatPressureCandidateDisplay(tankQty, {
      includeOriginalUnit: true,
    });
  }

  return result;
}

export function resolveTechnicalDataCandidate(
  context: ProductResolverContext,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): TechnicalDataResolved {
  const manufacturer = context.manufacturer.trim().toLowerCase();
  if (manufacturer === 'rexroth' && context.family.toUpperCase() === 'WE') {
    return resolveRexrothTechnicalData(context, catalogProvider);
  }
  if (manufacturer === 'yuken' && context.family.toUpperCase() === 'DSG') {
    return resolveYukenDsgTechnicalData(context, catalogProvider);
  }
  return { found: false, needsReview: true, confidence: 'unknown' };
}
