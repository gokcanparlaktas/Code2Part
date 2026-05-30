import { extractHydraulicAttributes } from '@/domain/attributes/extractors/extractHydraulicAttributes';
import { buildProductResolverContext } from '@/domain/catalogData';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import {
  isYukenDSHGCode,
  parseYukenDSHG,
  parseYukenDSHGProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSHG';
import { isYukenDSGCode, parseYukenDSG } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

const TARGET_CODE = 'DSHG-03-3C4-T-D24-14';

function parserMap(inputCode: string) {
  const attrs = parseYukenDSHG(inputCode);
  expect(attrs).not.toBeNull();
  return new Map(attrs!.map((a) => [a.key, a]));
}

describe('parseYukenDSHG', () => {
  it('DSHG-03-3C4-T-D24-14 extracts expected raw fields', () => {
    const map = parserMap(TARGET_CODE);

    expect(map.get('manufacturer')?.value).toBe('Yuken');
    expect(map.get('family')?.value).toBe('DSHG');
    expect(map.get('source_family')?.value).toBe('DSHG-03');
    expect(map.get('series')?.value).toBe('DSHG-03');
    expect(map.get('model_size')?.value).toBe('03');
    expect(map.get('function_code')?.value).toBe('3C4');
    expect(map.get('spool_symbol')?.value).toBe('4');
    expect(map.get('spring_arrangement')?.value).toBe('C');
    expect(map.get('pilot_drain_type')?.value).toBe('T');
    expect(map.get('coil_rating')?.value).toBe('D24');
    expect(map.get('design_number')?.value).toBe('14');
    expect(map.has('connector_type')).toBe(false);
  });

  it('does not route DSHG through DSG parser', () => {
    expect(isYukenDSGCode(TARGET_CODE)).toBe(false);
    expect(parseYukenDSG(TARGET_CODE)).toBeNull();
    expect(parseYukenDSHG(TARGET_CODE)).not.toBeNull();
  });

  it('DSHG-06-3C4-D24-N1-51 extracts connector when present', () => {
    const map = parserMap('DSHG-06-3C4-D24-N1-51');
    expect(map.get('connector_type')?.value).toBe('N1');
    expect(map.get('pilot_drain_type')).toBeUndefined();
  });

  it('H-DSHG-04-3C2-T-D24-N-52 extracts performance prefix', () => {
    const parsed = parseYukenDSHGProductCode('H-DSHG-04-3C2-T-D24-N-52');
    expect(parsed?.performanceOption).toBe('H');
    expect(parsed?.series).toBe('DSHG-04');
    const map = parserMap('H-DSHG-04-3C2-T-D24-N-52');
    expect(map.get('performance_option')?.value).toBe('H');
    expect(map.get('connector_type')?.value).toBe('N');
  });

  it('isYukenDSHGCode detects DSHG model codes', () => {
    expect(isYukenDSHGCode(TARGET_CODE)).toBe(true);
    expect(isYukenDSHGCode('DSG-01-3C2-D24-N1-70')).toBe(false);
  });

  it('extractHydraulicAttributes routes DSHG to parseYukenDSHG', () => {
    const attrs = extractHydraulicAttributes({ inputCode: TARGET_CODE });
    const map = new Map(attrs.map((a) => [a.key, a]));
    expect(map.get('family')?.value).toBe('DSHG');
    expect(map.get('function_code')?.value).toBe('3C4');
  });

  it('buildProductResolverContext returns DSHG-03 context', () => {
    expect(buildProductResolverContext(TARGET_CODE)).toMatchObject({
      manufacturer: 'Yuken',
      family: 'DSHG',
      series: 'DSHG-03',
      sourceFamily: 'DSHG-03',
      nominalSize: '03',
    });
  });

  it('identifyProduct recognizes DSHG-03 code', () => {
    const id = identifyProduct(TARGET_CODE, normalizeCode(TARGET_CODE));
    expect(id.seriesId).toBe('yuken_dshg03');
    expect(id.brand.value).toBe('Yuken');
  });

  it('profile enrichment attaches catalog voltage, mounting, and spool evidence', () => {
    const identification = identifyProduct(TARGET_CODE, normalizeCode(TARGET_CODE));
    const attributes = getTechnicalAttributes(identification);
    const profile = buildHydraulicValveCanonicalProfile({ identification, attributes });

    expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24.*V.*DC/i);
    expect(profile.mountingStandard.catalogEvidence?.isoCode).toContain('ISO 4401-05');
    expect(profile.centerCondition.catalogEvidence?.portState?.P).toBe('blocked');
    expect(profile.centerCondition.catalogEvidence?.portState?.A).toBe('connected_to_B_T');
  });
});
