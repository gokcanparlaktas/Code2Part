import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { catalogSpoolPortStatesMatch } from '@/domain/canonical/hydraulicValve/catalogDataProfileBridge';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function buildProfile(input: string) {
  const identification = identifyProduct(input, normalizeCode(input));
  const attributes = getTechnicalAttributes(identification);
  return buildHydraulicValveCanonicalProfile({ identification, attributes });
}

describe('catalogDataProfileBridge (Phase B)', () => {
  describe('Rexroth 4WE6E-6X/EG24N9K4', () => {
    const profile = buildProfile('4WE6E-6X/EG24N9K4');

    it('attaches catalog voltage evidence (G24 → 24 V DC candidate)', () => {
      expect(profile.coilVoltage.catalogEvidence?.source).toBe('catalog_data');
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*DC/i);
      expect(profile.coilVoltage.value).toBe('DC_24V');
      expect(profile.coilVoltage.requiresCatalogCheck).toBe(true);
    });

    it('attaches catalog mounting evidence (ISO 4401-03 class)', () => {
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-03');
      expect(profile.mountingStandard.value).toBe('ISO_4401_03_CETOP_03_NG6_NFPA_D03');
    });

    it('attaches catalog spool portState (E → all ports blocked)', () => {
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
      expect(profile.centerCondition.requiresCatalogCheck).toBe(true);
    });

    it('attaches catalog connector evidence (K4)', () => {
      expect(profile.connectorType.catalogEvidence?.displayCandidate).toMatch(/DIN/i);
      expect(profile.connectorType.catalogEvidence?.needsReview).toBe(true);
    });

    it('records catalog candidate notes without removing legacy voltage display', () => {
      expect(profile.coilVoltage.displayValue).toBe('24V DC');
      expect(profile.notes.some((n) => n.includes('Katalog adayı'))).toBe(true);
    });
  });

  describe('Yuken DSG-01-3C2-D24-N1-70', () => {
    const profile = buildProfile('DSG-01-3C2-D24-N1-70');

    it('attaches catalog voltage evidence (D24 → 24 V DC candidate)', () => {
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*V.*DC/i);
      expect(profile.coilVoltage.value).toBe('DC_24V');
    });

    it('attaches catalog mounting evidence (ISO 4401-03 class)', () => {
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-03');
    });

    it('attaches catalog spool portState (2 → closed center)', () => {
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
    });

    it('attaches catalog connector evidence (N1)', () => {
      expect(profile.connectorType.catalogEvidence?.displayCandidate).toMatch(/Plug-in/i);
    });
  });

  describe('Yuken DSHG-03-3C4-T-D24-14', () => {
    const profile = buildProfile('DSHG-03-3C4-T-D24-14');

    it('attaches catalog voltage evidence (D24 → 24 V DC candidate)', () => {
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*V.*DC/i);
      expect(profile.coilVoltage.value).toBe('DC_24V');
    });

    it('attaches catalog mounting evidence (DSHG-03 → ISO 4401-05 class)', () => {
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-05');
    });

    it('attaches catalog spool portState (4 → P blocked, A-B-T connected)', () => {
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'connected_to_A_B',
        A: 'connected_to_B_T',
        B: 'connected_to_A_T',
      });
    });
  });

  describe('Vickers DG4V-3-2A-M-U-H7-60', () => {
    const profile = buildProfile('DG4V-3-2A-M-U-H7-60');

    it('attaches catalog voltage evidence (H → 24 V DC candidate)', () => {
      expect(profile.coilVoltage.catalogEvidence?.source).toBe('catalog_data');
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*DC/i);
      expect(profile.coilVoltage.value).toBe('DC_24V');
      expect(profile.coilVoltage.requiresCatalogCheck).toBe(true);
    });

    it('attaches catalog mounting evidence (ISO 4401-03 class)', () => {
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-03');
    });

    it('attaches catalog spool portState (2 + spring A → closed center)', () => {
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
      expect(profile.centerCondition.requiresCatalogCheck).toBe(true);
    });

    it('attaches catalog connector evidence (U)', () => {
      expect(profile.connectorType.catalogEvidence?.displayCandidate).toMatch(/ISO4400|DIN 43650/i);
    });

    it('attaches catalog technical data (350 bar, 80 l/min)', () => {
      expect(profile.maxPressureBar.catalogEvidence?.numericValueBar).toBe(350);
      expect(profile.maxFlowLpm.catalogEvidence?.numericValueLpm).toBe(80);
    });
  });

  describe('Vickers DG4V-3-2A-M-U-D24-60', () => {
    const profile = buildProfile('DG4V-3-2A-M-U-D24-60');

    it('attaches catalog voltage evidence (D24 → 24 V DC)', () => {
      expect(profile.coilVoltage.catalogEvidence?.source).toBe('catalog_data');
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*DC/i);
      expect(profile.coilVoltage.value).toBe('DC_24V');
    });

    it('attaches catalog spool portState and technical data', () => {
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
      expect(profile.maxPressureBar.catalogEvidence?.numericValueBar).toBe(350);
      expect(profile.maxFlowLpm.catalogEvidence?.numericValueLpm).toBe(80);
    });

    it('shows centering from code (spring A → yay merkezlemeli)', () => {
      expect(profile.centering.value).toBe('spring_centered');
      expect(profile.centering.displayValue).toMatch(/Yay merkezlemeli/i);
    });
  });

  describe('cross-brand catalog spool matching', () => {
    it('cross-brand Rexroth E vs Yuken 2: spool compatible when catalog portStates match', () => {
      const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
      const yuken = buildProfile('DSG-01-3C2-D24-N1-70');
      expect(catalogSpoolPortStatesMatch(rexroth, yuken)).toBe(true);

      const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);
      const spool = result.comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);
      expect(spool?.status).toBe('compatible');
    });

    it('cross-brand Rexroth E vs Vickers 2A: spool compatible when catalog portStates match', () => {
      const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
      const vickers = buildProfile('DG4V-3-2A-M-U-H7-60');
      expect(catalogSpoolPortStatesMatch(rexroth, vickers)).toBe(true);

      const result = compareHydraulicValveCanonicalProfiles(rexroth, vickers);
      const spool = result.comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);
      expect(spool?.status).toBe('compatible');
    });
  });
});
