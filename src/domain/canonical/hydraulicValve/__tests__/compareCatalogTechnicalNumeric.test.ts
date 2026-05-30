import {
  compareCatalogFlowFields,
  compareCatalogPressureFields,
  FLOW_CANDIDATE_SHORTFALL_TOLERANCE,
} from '@/domain/canonical/hydraulicValve/compareCatalogTechnicalNumeric';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import type { CanonicalField } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalTypes';

function pressureField(
  bar: number,
  display: string,
  needsReview = true
): CanonicalField<number | null> {
  return {
    key: 'maxPressureBar',
    label: FIELD_LABELS.maxPressureBar,
    value: bar,
    displayValue: display,
    evidence: 'series_table',
    confidence: 'medium',
    requiresCatalogCheck: needsReview,
    importance: 'important',
    catalogEvidence: {
      source: 'catalog_data',
      displayCandidate: display,
      numericValueBar: bar,
      needsReview,
      confidence: 'medium',
    },
  };
}

function flowField(
  lpm: number,
  display: string,
  needsReview = true
): CanonicalField<number | null> {
  return {
    key: 'maxFlowLpm',
    label: FIELD_LABELS.maxFlowLpm,
    value: lpm,
    displayValue: display,
    evidence: 'series_table',
    confidence: 'medium',
    requiresCatalogCheck: needsReview,
    importance: 'important',
    catalogEvidence: {
      source: 'catalog_data',
      displayCandidate: display,
      numericValueLpm: lpm,
      needsReview,
      confidence: 'medium',
      technicalNotes: 'Maximum flow differs according to spool type and operating conditions.',
    },
  };
}

describe('compareCatalogPressureFields', () => {
  it('treats 350 bar and 35 MPa as compatible with review note', () => {
    const result = compareCatalogPressureFields({
      label: FIELD_LABELS.maxPressureBar,
      sourceField: pressureField(350, '350 bar'),
      targetField: pressureField(350, '35 MPa (350 bar)'),
    });

    expect(result.comparison.status).toBe('compatible');
    expect(result.comparison.reviewNoteTr).toBeUndefined();
    expect(result.checkReasonTr).toBeUndefined();
  });
});

describe('compareCatalogFlowFields (directional)', () => {
  it('80 L/min source vs 100 L/min candidate is compatible, not different', () => {
    const result = compareCatalogFlowFields({
      label: FIELD_LABELS.maxFlowLpm,
      sourceField: flowField(80, '80 L/dk'),
      targetField: flowField(100, '100 L/dk'),
    });

    expect(result.comparison.status).toBe('compatible');
    expect(result.comparison.status).not.toBe('different');
  });

  it('100 L/min source vs 80 L/min candidate is unknownOrCheck (insufficient risk)', () => {
    const result = compareCatalogFlowFields({
      label: FIELD_LABELS.maxFlowLpm,
      sourceField: flowField(100, '100 L/dk'),
      targetField: flowField(80, '80 L/dk'),
      shortfallTolerance: FLOW_CANDIDATE_SHORTFALL_TOLERANCE,
    });

    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.checkReasonTr).toMatch(/altında|daha düşük|yetersiz/i);
  });

  it('slightly lower candidate within tolerance stays unknownOrCheck, not different', () => {
    const result = compareCatalogFlowFields({
      label: FIELD_LABELS.maxFlowLpm,
      sourceField: flowField(100, '100 L/dk'),
      targetField: flowField(92, '92 L/dk'),
      shortfallTolerance: 0.1,
    });

    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('different');
  });
});
