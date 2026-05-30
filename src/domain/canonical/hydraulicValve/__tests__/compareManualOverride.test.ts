import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import {
  normalizeHydraulicManualOverrideDisplay,
} from '@/domain/canonical/hydraulicValve/hydraulicValveAttributeDisplay';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function buildProfile(code: string) {
  const identification = identifyProduct(code, normalizeCode(code));
  return buildHydraulicValveCanonicalProfile({
    identification,
    attributes: getTechnicalAttributes(identification),
  });
}

describe('Yuken DSG manual override', () => {
  it('DSG-01-3C2-D24-N1-70 manual override primary is Var with pin detail', () => {
    const display = normalizeHydraulicManualOverrideDisplay({
      rawValue: 'default',
      rawToken: 'default',
    });
    expect(display?.displayValue).toBe('Var');
    expect(display?.rawTokenLabel).toBe('Manuel override pimi');
  });

  it('DSG C manual override maps to push button and lock nut', () => {
    const display = normalizeHydraulicManualOverrideDisplay({
      rawValue: 'C',
      rawToken: 'C',
    });
    expect(display?.displayValue).toBe('Var');
    expect(display?.rawTokenLabel).toBe('Buton + kilitleme somunu');
  });

  it('Rexroth N9 vs Yuken default: presence compatible, not unknown', () => {
    const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
    const yuken = buildProfile('DSG-01-3C2-D24-N1-70');
    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);
    const manual = result.comparisons.find((c) => c.label === 'Manuel kumanda');
    expect(manual?.status).toBe('compatible');
    expect(manual?.sourceDisplay).toBe('Var');
    expect(manual?.targetDisplay).toBe('Var');
    expect(
      result.unknownOrCheck.some((line) => line.includes('Manuel kumanda katalogdan'))
    ).toBe(false);
  });

  it('Rexroth N9 vs Yuken C: presence compatible across brands', () => {
    const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
    const yuken = buildProfile('DSG-01-3C2-D24-C-N1-70');
    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);
    const manual = result.comparisons.find((c) => c.label === 'Manuel kumanda');
    expect(manual?.status).toBe('compatible');
    expect(manual?.sourceDisplay).toBe('Var');
    expect(manual?.targetDisplay).toBe('Var');
  });

  it('default vs C on DSG: compatible presence with type check note', () => {
    const defaultProfile = buildProfile('DSG-01-3C2-D24-N1-70');
    const cProfile = buildProfile('DSG-01-3C2-D24-C-N1-70');
    const result = compareHydraulicValveCanonicalProfiles(defaultProfile, cProfile);
    const manual = result.comparisons.find((c) => c.label === 'Manuel kumanda');
    expect(manual?.status).toBe('unknownOrCheck');
    expect(manual?.sourceDisplay).toBe('Var');
    expect(manual?.targetDisplay).toBe('Var');
  });
});
