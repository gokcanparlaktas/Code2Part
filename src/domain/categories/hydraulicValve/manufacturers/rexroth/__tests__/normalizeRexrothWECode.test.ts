import { normalizeRexrothWEComponentSeriesFromNameplate } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/normalizeRexrothWECode';

describe('normalizeRexrothWEComponentSeriesFromNameplate', () => {
  it('maps 4WE6 nameplate J62 to ordering J-6X', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE6J62/EG24N9K4')).toBe(
      '4WE6J-6X/EG24N9K4'
    );
  });

  it('maps 3WE6 nameplate B61 to ordering B-6X', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('3WE6B61/EG24N9K4')).toBe(
      '3WE6B-6X/EG24N9K4'
    );
  });

  it('maps 7x decade nameplate digits to 7X', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE6J71/HG24N9K4')).toBe(
      '4WE6J-7X/HG24N9K4'
    );
  });

  it('maps EA variant nameplate digits', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE6EA62/EG24N9K4')).toBe(
      '4WE6EA-6X/EG24N9K4'
    );
  });

  it('maps DOF detent header nameplate digits', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE6DOF62/EG24N9K4')).toBe(
      '4WE6DOF-6X/EG24N9K4'
    );
  });

  it('maps 4WE10 nameplate digits to 3X or 5X', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE10E35/EG24N9K4')).toBe(
      '4WE10E-3X/EG24N9K4'
    );
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE10E51/EG24N9K4')).toBe(
      '4WE10E-5X/EG24N9K4'
    );
  });

  it('leaves ordering format unchanged', () => {
    expect(normalizeRexrothWEComponentSeriesFromNameplate('4WE6J-6X/EG24N9K4')).toBe(
      '4WE6J-6X/EG24N9K4'
    );
  });
});
