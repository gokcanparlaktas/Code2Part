import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import {
  isRexrothWECode,
  parseRexrothWE,
  parseRexrothWEProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function parserMap(inputCode: string) {
  const results = parseRexrothWE(inputCode);
  expect(results).not.toBeNull();
  return new Map(results!.map((a) => [a.key, a]));
}

function buildProfile(input: string) {
  const identification = identifyProduct(input, normalizeCode(input));
  const attributes = getTechnicalAttributes(identification);
  return buildHydraulicValveCanonicalProfile({ identification, attributes });
}

describe('parseRexrothWE (WE family)', () => {
  it('isRexrothWECode matches 3WE6, 4WE6 and 4WE10', () => {
    expect(isRexrothWECode('4WE6E-6X/EG24N9K4')).toBe(true);
    expect(isRexrothWECode('4WE10E-5X/EG24N9K4')).toBe(true);
    expect(isRexrothWECode('3WE6A-6X/EG24N9K4')).toBe(true);
    expect(isRexrothWECode('DSG-01-3C2-D24-N1-70')).toBe(false);
  });

  describe('4WE6E-6X/EG24N9K4', () => {
    const code = '4WE6E-6X/EG24N9K4';

    it('extracts WE6 family identity and raw segments', () => {
      const map = parserMap(code);
      expect(map.get('family')?.value).toBe('WE');
      expect(map.get('source_family')?.value).toBe('WE6');
      expect(map.get('nominal_size')?.value).toBe('6');
      expect(map.get('number_of_main_ports')?.value).toBe(4);
      expect(map.get('series')?.value).toBe('4WE6');
      expect(map.get('spool_symbol')?.value).toBe('E');
      expect(map.get('component_series')?.value).toBe('6X');
      expect(map.get('design_series')?.value).toBe('6X');
      expect(map.get('design_series_family')?.value).toBe('6X');
      expect(map.get('coil_rating')?.value).toBe('EG24');
      expect(map.get('coil_rating')?.sourceToken).toBe('G24');
      expect(map.get('manual_override')?.value).toBe('N9');
      expect(map.get('connector_type')?.value).toBe('K4');
    });

    it('catalog profile bridge enriches voltage, mounting, spool and connector', () => {
      const profile = buildProfile(code);
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*DC/i);
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-03');
      expect(profile.centerCondition.catalogEvidence?.portState?.P).toBe('blocked');
      expect(profile.connectorType.catalogEvidence?.displayCandidate).toMatch(/DIN/i);
    });
  });

  describe('4WE10E-5X/EG24N9K4', () => {
    const code = '4WE10E-5X/EG24N9K4';

    it('extracts WE10 family identity and raw segments', () => {
      const parsed = parseRexrothWEProductCode(code);
      expect(parsed?.sourceFamily).toBe('WE10');
      expect(parsed?.nominalSize).toBe('10');
      expect(parsed?.numberOfMainPorts).toBe(4);
      expect(parsed?.componentSeries).toBe('5X');

      const map = parserMap(code);
      expect(map.get('series')?.value).toBe('4WE10');
      expect(map.get('source_family')?.value).toBe('WE10');
      expect(map.get('nominal_size')?.value).toBe('10');
      expect(map.get('spool_symbol')?.value).toBe('E');
      expect(map.get('coil_rating')?.sourceToken).toBe('G24');
      expect(map.get('connector_type')?.value).toBe('K4');
    });

    it('catalog profile bridge enriches ISO 4401-05 mounting and spool portState', () => {
      const profile = buildProfile(code);
      expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*DC/i);
      expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-05');
      expect(profile.centerCondition.catalogEvidence?.portState).toEqual({
        P: 'blocked',
        T: 'blocked',
        A: 'blocked',
        B: 'blocked',
      });
      expect(profile.connectorType.catalogEvidence?.displayCandidate).toMatch(/DIN/i);
    });
  });

  describe('3WE6A-6X/EG24N9K4', () => {
    const code = '3WE6A-6X/EG24N9K4';

    it('extracts 3-port WE6 identity', () => {
      const map = parserMap(code);
      expect(map.get('series')?.value).toBe('3WE6');
      expect(map.get('source_family')?.value).toBe('WE6');
      expect(map.get('number_of_main_ports')?.value).toBe(3);
      expect(map.get('spool_symbol')?.value).toBe('A');
      expect(map.get('component_series')?.value).toBe('6X');
      expect(map.get('coil_rating')?.sourceToken).toBe('G24');
      expect(map.get('connector_type')?.value).toBe('K4');
    });
  });

  describe('nameplate and numeric design series', () => {
    it('parses spaced 4WE6 J62 nameplate with raw design series 62', () => {
      const map = parserMap('4WE 6 J62/EG24N9K4');
      expect(map.get('series')?.value).toBe('4WE6');
      expect(map.get('spool_symbol')?.value).toBe('J');
      expect(map.get('design_series')?.value).toBe('62');
      expect(map.get('design_series_family')?.value).toBe('6X');
      expect(map.get('component_series')?.value).toBe('6X');
      expect(map.get('coil_rating')?.value).toBe('EG24');
      expect(map.get('connector_type')?.value).toBe('K4');
      expect(map.get('parse_completeness')?.value).toBe('fully_parsed');
    });

    it('parses 3WE6 B61 nameplate', () => {
      const map = parserMap('3WE6B61/EG24N9K4');
      expect(map.get('series')?.value).toBe('3WE6');
      expect(map.get('spool_symbol')?.value).toBe('B');
      expect(map.get('design_series')?.value).toBe('61');
      expect(map.get('design_series_family')?.value).toBe('6X');
    });

    it('parses hyphenated numeric design series', () => {
      const map = parserMap('4WE6J-62/EG24N9K4');
      expect(map.get('design_series')?.value).toBe('62');
      expect(map.get('spool_symbol')?.value).toBe('J');
    });

    it('identifies nameplate code as full outcome with high confidence', () => {
      const identification = identifyProduct('4WE 6 J62/EG24N9K4', normalizeCode('4WE 6 J62/EG24N9K4'));
      expect(identification.outcome).toBe('full');
      expect(identification.confidence).toBe('high');
      expect(identification.seriesId).toBeTruthy();
    });
  });
});
