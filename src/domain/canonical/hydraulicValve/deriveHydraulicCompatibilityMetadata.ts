import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import type {
  AttributeComparison,
  CompatibilityMetadata,
  ScoredAttributeComparison,
} from '@/types/compatibility';

/** Fields that define known hydraulic interchangeability. */
const CRITICAL_COMPATIBILITY_LABELS = new Set<string>([
  'Ürün kategorisi',
  FIELD_LABELS.mountingStandard,
  FIELD_LABELS.coilVoltage,
  FIELD_LABELS.spoolFunctionCode,
]);

/** Review/secondary fields — affect data coverage, not source confidence. */
const SECONDARY_LABELS = new Set<string>([
  FIELD_LABELS.connectorType,
  FIELD_LABELS.maxPressureBar,
  FIELD_LABELS.maxFlowLpm,
  FIELD_LABELS.manualOverride,
  FIELD_LABELS.sealMaterial,
  FIELD_LABELS.centerCondition,
  FIELD_LABELS.centering,
  FIELD_LABELS.waysPositions,
]);

type LabelBucket = {
  compatible: number;
  different: number;
  unknown: number;
  total: number;
};

function bucketComparisons(
  comparisons: ScoredAttributeComparison[],
  labels: Set<string>
): LabelBucket {
  const filtered = comparisons.filter((c) => labels.has(c.label));
  return {
    compatible: filtered.filter((c) => c.status === 'compatible').length,
    different: filtered.filter((c) => c.status === 'different').length,
    unknown: filtered.filter((c) => c.status === 'unknownOrCheck').length,
    total: filtered.length,
  };
}

function mergeScoredComparisons(
  comparisons: AttributeComparison[],
  scoredComparisons: ScoredAttributeComparison[]
): ScoredAttributeComparison[] {
  const byLabel = new Map(scoredComparisons.map((s) => [s.label, s]));
  for (const comparison of comparisons) {
    if (!byLabel.has(comparison.label)) {
      byLabel.set(comparison.label, {
        ...comparison,
        importance: 'optional',
      });
    }
  }
  return [...byLabel.values()];
}

function deriveCompatibilityLevel(critical: LabelBucket): CompatibilityMetadata['compatibilityLevel'] {
  if (critical.different > 0) {
    return 'not_compatible';
  }

  const knownMatches = critical.compatible;
  if (knownMatches >= 3) {
    return 'high';
  }

  if (knownMatches >= 2 && critical.unknown === 0) {
    return 'high';
  }

  if (knownMatches >= 1 && critical.unknown > 0) {
    return 'medium';
  }

  if (critical.unknown > 0 && knownMatches === 0) {
    return 'low';
  }

  return knownMatches > 0 ? 'medium' : 'low';
}

/**
 * Source confidence: quality of manufacturer catalog / ordering-code evidence.
 * Internal review flags and practical check items do not lower this.
 */
function deriveConfidenceLevel(critical: LabelBucket): CompatibilityMetadata['confidenceLevel'] {
  const criticalKnown = critical.compatible + critical.different;

  if (critical.total === 0 || criticalKnown === 0) {
    return critical.unknown > 0 ? 'low' : 'medium';
  }

  if (critical.unknown > 0 && criticalKnown === 0) {
    return 'low';
  }

  if (critical.unknown >= 2) {
    return 'medium';
  }

  if (criticalKnown >= 2 && critical.unknown === 0) {
    return 'high';
  }

  if (criticalKnown >= 1) {
    return critical.unknown > 0 ? 'medium' : 'high';
  }

  return 'medium';
}

/**
 * Data coverage: how many comparison fields are resolved (not practical order checks).
 */
function deriveDataCompleteness(
  critical: LabelBucket,
  secondary: LabelBucket
): CompatibilityMetadata['dataCompleteness'] {
  if (critical.total === 0) {
    return 'low';
  }

  const criticalKnown = critical.compatible + critical.different;

  if (criticalKnown === 0 || critical.unknown / critical.total >= 0.5) {
    return 'low';
  }

  if (critical.unknown > 0) {
    return 'medium';
  }

  // All critical fields resolved — coverage reflects secondary field resolution.
  const secondaryKnown = secondary.compatible + secondary.different;
  if (secondary.total === 0) {
    return 'high';
  }

  if (secondary.unknown <= 1) {
    return 'high';
  }

  if (secondaryKnown / secondary.total >= 0.6) {
    return 'high';
  }

  if (secondary.unknown >= 3) {
    return 'medium';
  }

  return 'medium';
}

/**
 * Derives compatibility metadata from grouped comparison results.
 * Does not change compatible/different/unknownOrCheck statuses.
 */
export function deriveHydraulicCompatibilityMetadata(options: {
  comparisons: AttributeComparison[];
  scoredComparisons: ScoredAttributeComparison[];
  warnings?: string[];
  requiresCatalogCheck?: boolean;
}): CompatibilityMetadata {
  const merged = mergeScoredComparisons(options.comparisons, options.scoredComparisons);
  const critical = bucketComparisons(merged, CRITICAL_COMPATIBILITY_LABELS);
  const secondary = bucketComparisons(merged, SECONDARY_LABELS);

  return {
    compatibilityLevel: deriveCompatibilityLevel(critical),
    confidenceLevel: deriveConfidenceLevel(critical),
    dataCompleteness: deriveDataCompleteness(critical, secondary),
  };
}
