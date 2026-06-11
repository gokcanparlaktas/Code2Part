import {

  catalogEvidenceDetailLines,

  GENERIC_PORT_STATE_RESOLVED_TR,

  portStateBehaviorSummary,

  resolveCenterDisplayFromCatalogEvidence,

} from '@/domain/presentation/formatCatalogFieldDisplay';

import {

  centerTypePartsFromPortState,

  formatCenterTypeWithToken,

  formatUnifiedCenterDisplay,

} from '@/domain/presentation/formatCenterTypeDisplay';

import { getCenterConditionDisplay } from '@/domain/canonical/hydraulicValve/normalizeHydraulicValveAttribute';



const CLOSED_CENTER_UNIFIED = 'P,T,A,B Kapalı (Kapalı merkez)';



describe('centerTypePartsFromPortState', () => {

  const closedCenter = {

    P: 'blocked',

    T: 'blocked',

    A: 'blocked',

    B: 'blocked',

  } as const;



  it('describes all-blocked portState with unified P,T,A,B format', () => {

    expect(centerTypePartsFromPortState(closedCenter)).toEqual({

      primary: 'Kapalı merkez',

      detail: 'P,T,A,B Kapalı',

    });

    expect(portStateBehaviorSummary(closedCenter)).toBe(CLOSED_CENTER_UNIFIED);

    expect(formatUnifiedCenterDisplay({ portState: closedCenter })).toBe(

      CLOSED_CENTER_UNIFIED

    );

  });



  it('formatCenterTypeWithToken omits spool code from display', () => {

    expect(

      formatCenterTypeWithToken('E', centerTypePartsFromPortState(closedCenter)!, closedCenter)

    ).toBe(CLOSED_CENTER_UNIFIED);

  });



  it('describes float center (P blocked, A-B-T connected)', () => {

    expect(

      portStateBehaviorSummary({

        P: 'blocked',

        T: 'connected_to_A_B_T',

        A: 'connected_to_B_T',

        B: 'connected_to_A_T',

      })

    ).toBe('A-B-T Bağlı, P Kapalı (Yüzer merkez)');

  });



  it('describes tandem center (P-T connected, A and B blocked)', () => {

    expect(

      portStateBehaviorSummary({

        P: 'connected_to_T',

        T: 'connected_to_P',

        A: 'blocked',

        B: 'blocked',

      })

    ).toBe('P-T Bağlı, A,B Kapalı (Tandem merkez)');

  });



  it('describes open center when all ports are connected', () => {

    expect(

      portStateBehaviorSummary({

        P: 'connected_to_A_B_T',

        T: 'connected_to_A_B',

        A: 'connected_to_B_T',

        B: 'connected_to_A_T',

      })

    ).toBe('P,T,A,B Açık (Açık merkez)');

  });



  it('lists per-port states when center pattern is not a known family', () => {
    expect(
      portStateBehaviorSummary({
        P: 'blocked',
        T: 'blocked',
        A: 'connected_to_B_T',
        B: 'blocked',
      })
    ).toBe('P Kapalı, T Kapalı, A Bağlı, B Kapalı');
  });

  it('describes cross-pair offset center instead of per-port Bağlı labels', () => {
    expect(
      portStateBehaviorSummary({
        P: 'connected_to_B',
        T: 'connected_to_A',
        A: 'connected_to_T',
        B: 'connected_to_P',
      })
    ).toBe('P-B Bağlı, T-A Bağlı (Ofset merkez)');
  });



  it('resolveCenterDisplayFromCatalogEvidence uses unified port format without spool prefix', () => {

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

        spoolToken: 'E',

        getCenterConditionDisplay,

        fallback: 'Katalog sembolünden doğrulanmalı',

      })

    ).toBe(CLOSED_CENTER_UNIFIED);

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

