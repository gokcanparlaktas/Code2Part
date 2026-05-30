import {
  catalogEvidenceDetailLines,
  GENERIC_PORT_STATE_RESOLVED_TR,
  portStateBehaviorSummary,
  resolveCenterDisplayFromCatalogEvidence,
} from '@/domain/presentation/formatCatalogFieldDisplay';
import { getCenterConditionDisplay } from '@/domain/canonical/hydraulicValve/normalizeHydraulicValveAttribute';

describe('portStateBehaviorSummary', () => {
  const closedCenter = {
    P: 'blocked',
    T: 'blocked',
    A: 'blocked',
    B: 'blocked',
  } as const;

  it('describes all-blocked portState as Kapalı merkez', () => {
    expect(portStateBehaviorSummary(closedCenter)).toBe(
      'Kapalı merkez — P, T, A ve B kapalı'
    );
  });

  it('describes float center (P blocked, A-B-T connected)', () => {
    expect(
      portStateBehaviorSummary({
        P: 'blocked',
        T: 'connected_to_A_B_T',
        A: 'connected_to_B_T',
        B: 'connected_to_A_T',
      })
    ).toBe('Yüzer merkez — P kapalı, A-B-T bağlantılı');
  });

  it('describes open center when all ports are connected', () => {
    expect(
      portStateBehaviorSummary({
        P: 'connected_to_A_B_T',
        T: 'connected_to_A_B',
        A: 'connected_to_B_T',
        B: 'connected_to_A_T',
      })
    ).toBe('Açık merkez — P, T, A ve B bağlantılı');
  });

  it('falls back to generic catalog-resolved text for other patterns', () => {
    expect(
      portStateBehaviorSummary({
        P: 'blocked',
        T: 'blocked',
        A: 'connected_to_B_T',
        B: 'blocked',
      })
    ).toBe(GENERIC_PORT_STATE_RESOLVED_TR);
  });

  it('resolveCenterDisplayFromCatalogEvidence prefers portState over generic flow text', () => {
    expect(
      resolveCenterDisplayFromCatalogEvidence({
        catalogEvidence: {
          source: 'catalog_data',
          portState: {
            P: 'blocked',
            T: 'blocked',
            A: 'blocked',
            B: 'blocked',
          },
          centerFlowDescription: GENERIC_PORT_STATE_RESOLVED_TR,
          needsReview: true,
          confidence: 'medium',
        },
        centerConditionValue: 'closed_center',
        getCenterConditionDisplay,
        fallback: 'Katalog sembolünden doğrulanmalı',
      })
    ).toBe('Kapalı merkez — P, T, A ve B kapalı');
  });
});

describe('catalogEvidenceDetailLines', () => {
  it('uses Katalog adayı — doğrulanmalı for review-gated evidence', () => {
    expect(
      catalogEvidenceDetailLines({
        rawToken: 'E',
        catalogEvidence: {
          source: 'catalog_data',
          needsReview: true,
          confidence: 'medium',
        },
      })
    ).toEqual(['Kod kanıtı: E', 'Katalog adayı — doğrulanmalı']);
  });
});
