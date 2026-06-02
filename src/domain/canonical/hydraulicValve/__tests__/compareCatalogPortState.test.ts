import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import {
  compareSpoolBehaviorByCatalogPortState,
  hasCatalogPortStateEvidence,
} from '@/domain/canonical/hydraulicValve/compareCatalogPortState';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import type { CanonicalField, HydraulicCenterCondition } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalTypes';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function fieldWithPortState(
  portState: { P: string; T: string; A: string; B: string },
  needsReview = false
): CanonicalField<HydraulicCenterCondition> {
  return {
    label: 'Merkez tipi',
    value: 'closed_center',
    displayValue: 'Kapalı merkez',
    evidence: 'code',
    confidence: 'medium',
    requiresCatalogCheck: true,
    catalogEvidence: {
      source: 'catalog_data',
      portState,
      needsReview,
    },
  };
}

function buildProfile(input: string) {
  const identification = identifyProduct(input, normalizeCode(input));
  const attributes = getTechnicalAttributes(identification);
  return buildHydraulicValveCanonicalProfile({ identification, attributes });
}

describe('compareCatalogPortState', () => {
  const closedCenter = {
    P: 'blocked',
    T: 'blocked',
    A: 'blocked',
    B: 'blocked',
  } as const;

  const openCenter = {
    P: 'connected_to_A_B_T',
    T: 'connected_to_A_B',
    A: 'connected_to_B_T',
    B: 'connected_to_A_T',
  } as const;

  it('identical portState → compatible', () => {
    const result = compareSpoolBehaviorByCatalogPortState({
      label: FIELD_LABELS.spoolFunctionCode,
      sourceField: fieldWithPortState(closedCenter),
      targetField: fieldWithPortState(closedCenter),
      sourceDisplay: 'A',
      targetDisplay: 'B',
    });
    expect(result.usedPortState).toBe(true);
    expect(result.comparison.status).toBe('compatible');
  });

  it('different portState → different', () => {
    const result = compareSpoolBehaviorByCatalogPortState({
      label: FIELD_LABELS.spoolFunctionCode,
      sourceField: fieldWithPortState(closedCenter),
      targetField: fieldWithPortState(openCenter),
      sourceDisplay: 'A',
      targetDisplay: 'B',
    });
    expect(result.usedPortState).toBe(true);
    expect(result.comparison.status).toBe('different');
  });

  it('one missing portState → not used, unknownOrCheck placeholder', () => {
    const result = compareSpoolBehaviorByCatalogPortState({
      label: FIELD_LABELS.spoolFunctionCode,
      sourceField: fieldWithPortState(closedCenter),
      targetField: {
        label: 'Merkez tipi',
        value: 'unknown',
        displayValue: 'Doğrulanamadı',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      sourceDisplay: 'A',
      targetDisplay: 'B',
    });
    expect(result.usedPortState).toBe(false);
    expect(result.comparison.status).toBe('unknownOrCheck');
  });

  it('both missing portState → not used, unknownOrCheck', () => {
    const empty = {
      label: 'Merkez tipi',
      value: 'unknown' as const,
      displayValue: 'Doğrulanamadı',
      evidence: 'unknown' as const,
      confidence: 'unknown' as const,
      requiresCatalogCheck: true,
    };
    const result = compareSpoolBehaviorByCatalogPortState({
      label: FIELD_LABELS.spoolFunctionCode,
      sourceField: empty,
      targetField: empty,
      sourceDisplay: 'A',
      targetDisplay: 'B',
    });
    expect(result.usedPortState).toBe(false);
    expect(result.comparison.status).toBe('unknownOrCheck');
  });

  it('needsReview on catalog evidence is flagged but does not block compatible', () => {
    const result = compareSpoolBehaviorByCatalogPortState({
      label: FIELD_LABELS.spoolFunctionCode,
      sourceField: fieldWithPortState(closedCenter, true),
      targetField: fieldWithPortState(closedCenter, true),
      sourceDisplay: 'A',
      targetDisplay: 'B',
    });
    expect(result.comparison.status).toBe('compatible');
    expect(result.catalogReviewRequired).toBe(true);
  });
});

describe('compareHydraulicValveCanonicalProfiles portState integration', () => {
  it('Rexroth 4WE6E vs Yuken DSG-01-3C2: spool compatible by portState, connector unknownOrCheck', () => {
    const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
    const yuken = buildProfile('DSG-01-3C2-D24-N1-70');

    expect(hasCatalogPortStateEvidence(rexroth.centerCondition)).toBe(true);
    expect(hasCatalogPortStateEvidence(yuken.centerCondition)).toBe(true);

    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);

    expect(
      result.comparisons.find((c) => c.label === 'Montaj standardı')?.status
    ).toBe('compatible');
    expect(result.comparisons.find((c) => c.label === 'Bobin voltajı')?.status).toBe(
      'compatible'
    );

    const spool = result.comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);
    expect(spool?.status).toBe('compatible');
    expect(spool?.sourceDisplay).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(spool?.targetDisplay).toBe('P,T,A,B Kapalı (Kapalı merkez)');

    expect(result.portStateCenterResolved).toBe(true);
    expect(
      result.comparisons.filter((c) => c.label === FIELD_LABELS.spoolFunctionCode).length
    ).toBe(1);

    expect(result.comparisons.find((c) => c.label === 'Konnektör tipi')?.status).toBe(
      'unknownOrCheck'
    );

    expect(result.different).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('port durumları'))).toBe(true);
  });

  it('NG6 vs NG10: same Rexroth E merkez tipi stays compatible when portStates match', () => {
    const ng6 = buildProfile('4WE6E-6X/EG24N9K4');
    const ng10 = buildProfile('4WE10E-3X/CG24N9K4');
    const result = compareHydraulicValveCanonicalProfiles(ng6, ng10);

    expect(result.comparisons.find((c) => c.label === 'Montaj standardı')?.status).toBe(
      'different'
    );
    expect(result.comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode)?.status).toBe(
      'compatible'
    );
  });
});
