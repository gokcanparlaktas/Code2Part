import {
  buildProductResolverContext,
  getRawTokensForProductCode,
  getEatonSpoolCatalog,
  getRexrothSpoolCatalog,
  getYukenDshgParserSpecCatalog,
  getYukenSpoolCatalog,
  portStatesMatch,
  resolveConnectorCandidate,
  resolveMountingCandidate,
  resolveSpoolCandidate,
  resolveTechnicalDataCandidate,
  resolveVoltageCandidate,
  toCatalogResolverContext,
} from '@/domain/catalogData';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

const VICKERS_DG4V3 = 'DG4V-3-2A-M-U-H7-60';

const PHASE_A_CODES = [
  '4WE6E-6X/EG24N9K4',
  '4WE10E-5X/EG24N9K4',
  'DSG-01-3C2-D24-N1-70',
  VICKERS_DG4V3,
] as const;

describe('catalogData Phase A', () => {
  describe('read-only loader', () => {
    it('loads Rexroth spool catalog-data with entries', () => {
      const catalog = getRexrothSpoolCatalog();
      expect(catalog.manufacturer).toBe('Rexroth');
      expect(catalog.spoolSymbolMeanings?.length).toBeGreaterThan(0);
    });

    it('loads Yuken spool catalog-data with entries', () => {
      const catalog = getYukenSpoolCatalog();
      expect(catalog.manufacturer).toBe('Yuken');
      expect(catalog.spoolSymbolMeanings?.length).toBeGreaterThan(0);
    });

    it('loads DSHG parser-spec catalog-data (prep only, no runtime parser)', () => {
      const spec = getYukenDshgParserSpecCatalog();
      expect(spec.seriesFamily).toBe('DSHG');
      expect(spec.knownSeries).toContain('DSHG-03');
      expect(spec.knownSeries).not.toContain('DSG-01');
    });

    it('loads Eaton/Vickers spool catalog-data with entries', () => {
      const catalog = getEatonSpoolCatalog();
      expect(catalog.manufacturer).toBe('Eaton');
      expect(catalog.spoolSymbolMeanings?.length).toBeGreaterThan(0);
    });
  });

  describe('buildProductResolverContext', () => {
    it.each(PHASE_A_CODES)('builds context for %s', (code) => {
      const ctx = buildProductResolverContext(code);
      expect(ctx).not.toBeNull();
      expect(ctx?.category).toBe(HYDRAULIC_VALVE_CATEGORY);
    });

    it('4WE6 → WE6 / nominalSize 6', () => {
      const ctx = buildProductResolverContext('4WE6E-6X/EG24N9K4');
      expect(ctx).toMatchObject({
        manufacturer: 'Rexroth',
        family: 'WE',
        sourceFamily: 'WE6',
        nominalSize: '6',
      });
    });

    it('4WE10 → WE10 / nominalSize 10', () => {
      const ctx = buildProductResolverContext('4WE10E-5X/EG24N9K4');
      expect(ctx).toMatchObject({
        manufacturer: 'Rexroth',
        family: 'WE',
        sourceFamily: 'WE10',
        nominalSize: '10',
      });
    });

    it('DSG-01 → sourceFamily DSG-01', () => {
      const ctx = buildProductResolverContext('DSG-01-3C2-D24-N1-70');
      expect(ctx).toMatchObject({
        manufacturer: 'Yuken',
        family: 'DSG',
        series: 'DSG-01',
        sourceFamily: 'DSG-01',
      });
    });

    it('DSHG-03 → sourceFamily DSHG-03 / nominalSize 03', () => {
      const ctx = buildProductResolverContext('DSHG-03-3C4-T-D24-14');
      expect(ctx).toMatchObject({
        manufacturer: 'Yuken',
        family: 'DSHG',
        series: 'DSHG-03',
        sourceFamily: 'DSHG-03',
        nominalSize: '03',
      });
    });

    it('DG4V-3 → Vickers / DG4V-3 / spring A', () => {
      const ctx = buildProductResolverContext(VICKERS_DG4V3);
      expect(ctx).toMatchObject({
        manufacturer: 'Vickers',
        family: 'DG4V',
        series: 'DG4V-3',
        sourceFamily: 'DG4V-3',
        nominalSize: '3',
        springArrangement: 'A',
      });
    });
  });

  describe('resolveVoltageCandidate', () => {
    it('Rexroth G24 → 24 V DC candidate', () => {
      const product = buildProductResolverContext('4WE6E-6X/EG24N9K4')!;
      const tokens = getRawTokensForProductCode('4WE6E-6X/EG24N9K4');
      const ctx = toCatalogResolverContext(
        product,
        'coil_rating',
        tokens.coil_rating ?? 'G24'
      );
      const result = resolveVoltageCandidate(ctx);
      expect(result.found).toBe(true);
      expect(result.displayCandidate).toContain('24');
      expect(result.displayCandidate).toMatch(/DC/i);
      expect(result.needsReview).toBe(true);
    });

    it('Yuken D24 → 24 V DC candidate', () => {
      const product = buildProductResolverContext('DSG-01-3C2-D24-N1-70')!;
      const ctx = toCatalogResolverContext(product, 'coil_rating', 'D24');
      const result = resolveVoltageCandidate(ctx);
      expect(result.found).toBe(true);
      expect(result.displayCandidate).toMatch(/24.*V.*DC/i);
      expect(result.voltageValue).toBe(24);
    });

    it('G24 and D24 resolve to equivalent DC 24V class', () => {
      const rexroth = resolveVoltageCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('4WE6E-6X/EG24N9K4')!,
          'coil_rating',
          'G24'
        )
      );
      const yuken = resolveVoltageCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('DSG-01-3C2-D24-N1-70')!,
          'coil_rating',
          'D24'
        )
      );
      expect(rexroth.voltageValue).toBe(24);
      expect(yuken.voltageValue).toBe(24);
      expect(rexroth.voltageKind).toBe('DC');
      expect(yuken.voltageKind).toBe('DC');
    });

    it('Vickers H → 24 V DC candidate from Eaton catalog-data', () => {
      const product = buildProductResolverContext(VICKERS_DG4V3)!;
      const tokens = getRawTokensForProductCode(VICKERS_DG4V3);
      const ctx = toCatalogResolverContext(product, 'coil_rating', tokens.coil_rating ?? 'H');
      const result = resolveVoltageCandidate(ctx);
      expect(result.found).toBe(true);
      expect(result.voltageValue).toBe(24);
      expect(result.voltageKind).toBe('DC');
      expect(result.needsReview).toBe(true);
    });

    it('Vickers D24 → 24 V DC candidate from Eaton catalog-data', () => {
      const code = 'DG4V-3-2A-M-U-D24-60';
      const product = buildProductResolverContext(code)!;
      const tokens = getRawTokensForProductCode(code);
      const ctx = toCatalogResolverContext(product, 'coil_rating', tokens.coil_rating ?? 'D24');
      const result = resolveVoltageCandidate(ctx);
      expect(result.found).toBe(true);
      expect(result.voltageValue).toBe(24);
      expect(result.voltageKind).toBe('DC');
      expect(result.needsReview).toBe(false);
    });
  });

  describe('resolveConnectorCandidate', () => {
    it('Vickers U → ISO4400 DIN connector candidate', () => {
      const product = buildProductResolverContext(VICKERS_DG4V3)!;
      const tokens = getRawTokensForProductCode(VICKERS_DG4V3);
      const result = resolveConnectorCandidate(
        toCatalogResolverContext(product, 'connector_type', tokens.connector_type ?? 'U')
      );
      expect(result.found).toBe(true);
      expect(result.displayCandidate).toMatch(/ISO4400|DIN 43650/i);
      expect(result.needsReview).toBe(true);
    });
  });

  describe('resolveMountingCandidate', () => {
    it('Rexroth WE6 → ISO 4401-03 class', () => {
      const product = buildProductResolverContext('4WE6E-6X/EG24N9K4')!;
      const result = resolveMountingCandidate(product);
      expect(result.found).toBe(true);
      expect(result.isoCode).toContain('ISO 4401-03');
    });

    it('Yuken DSG-01 → ISO 4401-03 class', () => {
      const product = buildProductResolverContext('DSG-01-3C2-D24-N1-70')!;
      const result = resolveMountingCandidate(product);
      expect(result.found).toBe(true);
      expect(result.isoCode).toContain('ISO 4401-03');
    });

    it('Rexroth WE10 → ISO 4401-05 class', () => {
      const product = buildProductResolverContext('4WE10E-5X/EG24N9K4')!;
      const result = resolveMountingCandidate(product);
      expect(result.found).toBe(true);
      expect(result.isoCode).toContain('ISO 4401-05');
    });

    it('Vickers DG4V-3 → ISO 4401-03 class', () => {
      const product = buildProductResolverContext(VICKERS_DG4V3)!;
      const result = resolveMountingCandidate(product);
      expect(result.found).toBe(true);
      expect(result.isoCode).toContain('ISO 4401-03');
    });
  });

  describe('resolveSpoolCandidate (portState)', () => {
    it('Rexroth spool E @ WE6 has closed-center portState', () => {
      const product = buildProductResolverContext('4WE6E-6X/EG24N9K4')!;
      const result = resolveSpoolCandidate(
        toCatalogResolverContext(product, 'spool_symbol', 'E')
      );
      expect(result.found).toBe(true);
      expect(result.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
    });

    it('Rexroth spool D/G/J @ WE6 match catalog portState patterns', () => {
      const product = buildProductResolverContext('4WE6E-6X/EG24N9K4')!;
      const d = resolveSpoolCandidate(toCatalogResolverContext(product, 'spool_symbol', 'D'));
      expect(d.portState).toEqual({
        P: 'connected_to_A',
        A: 'connected_to_P',
        B: 'connected_to_T',
        T: 'connected_to_B',
      });

      const g = resolveSpoolCandidate(toCatalogResolverContext(product, 'spool_symbol', 'G'));
      expect(g.portState).toEqual({
        P: 'connected_to_T',
        T: 'connected_to_P',
        A: 'blocked',
        B: 'blocked',
      });

      const j = resolveSpoolCandidate(toCatalogResolverContext(product, 'spool_symbol', 'J'));
      expect(j.portState).toEqual({
        P: 'blocked',
        A: 'connected_to_B_T',
        B: 'connected_to_A_T',
        T: 'connected_to_A_B',
      });
    });

    it('Yuken spool 2 @ DSG-01 has matching closed-center portState', () => {
      const product = buildProductResolverContext('DSG-01-3C2-D24-N1-70')!;
      const result = resolveSpoolCandidate(
        toCatalogResolverContext(product, 'spool_symbol', '2')
      );
      expect(result.found).toBe(true);
      expect(result.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
    });

    it('Rexroth E and Yuken 2 portStates match for cross-brand comparison', () => {
      const rexroth = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('4WE6E-6X/EG24N9K4')!,
          'spool_symbol',
          'E'
        )
      );
      const yuken = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('DSG-01-3C2-D24-N1-70')!,
          'spool_symbol',
          '2'
        )
      );
      expect(portStatesMatch(rexroth.portState, yuken.portState)).toBe(true);
    });

    it('Vickers spool 2 @ DG4V-3 / spring A has closed-center portState', () => {
      const product = buildProductResolverContext(VICKERS_DG4V3)!;
      const tokens = getRawTokensForProductCode(VICKERS_DG4V3);
      const result = resolveSpoolCandidate(
        toCatalogResolverContext(product, 'spool_symbol', tokens.spool_symbol ?? '2')
      );
      expect(result.found).toBe(true);
      expect(result.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
    });

    it('Vickers spool 2 portState matches Rexroth E for cross-brand comparison', () => {
      const rexroth = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('4WE6E-6X/EG24N9K4')!,
          'spool_symbol',
          'E'
        )
      );
      const vickers = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext(VICKERS_DG4V3)!,
          'spool_symbol',
          '2'
        )
      );
      expect(portStatesMatch(rexroth.portState, vickers.portState)).toBe(true);
    });

    it('Vickers spool types 22 and 35 share closed-center portState with Rexroth E', () => {
      const rexroth = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('4WE6E-6X/EG24N9K4')!,
          'spool_symbol',
          'E'
        )
      );
      const closedCenter = {
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      };

      for (const code of ['DG4V-3-22A-M-U-H7-60', 'DG4V-3-35A-M-U-H7-60']) {
        const product = buildProductResolverContext(code)!;
        const tokens = getRawTokensForProductCode(code);
        const vickers = resolveSpoolCandidate(
          toCatalogResolverContext(product, 'spool_symbol', tokens.spool_symbol ?? '')
        );
        expect(vickers.found).toBe(true);
        expect(vickers.portState).toEqual(closedCenter);
        expect(portStatesMatch(rexroth.portState, vickers.portState)).toBe(true);
      }
    });

    it('DSHG spool 4 lookup via manual context (catalog only, not runtime)', () => {
      const manualContext = {
        manufacturer: 'Yuken',
        category: HYDRAULIC_VALVE_CATEGORY,
        family: 'DSHG',
        series: 'DSHG-03',
        sourceFamily: 'DSHG-03',
      };
      const result = resolveSpoolCandidate(
        toCatalogResolverContext(manualContext, 'spool_symbol', '4')
      );
      expect(result.found).toBe(true);
      expect(result.portState?.P).toBe('blocked');
      expect(result.portState?.A).toBe('connected_to_B_T');
    });
  });

  describe('resolveTechnicalDataCandidate (Eaton/Vickers)', () => {
    it('DG4V-3 reads 350 bar and 80 l/min from catalog-data', () => {
      const ctx = buildProductResolverContext(VICKERS_DG4V3)!;
      const technical = resolveTechnicalDataCandidate(ctx);
      expect(technical.found).toBe(true);
      expect(technical.maxOperatingPressureBar).toBe(350);
      expect(technical.maxFlowLpm).toBe(80);
      expect(technical.needsReview).toBe(true);
    });
  });
});
