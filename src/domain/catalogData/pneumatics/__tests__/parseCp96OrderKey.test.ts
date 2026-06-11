import {
  matchCp96OrderKey,
  parseCp96OrderKeyFields,
} from '@/domain/catalogData/pneumatics/parseCp96OrderKey';

describe('parseCp96OrderKey', () => {
  it('parses CP96SDB50-100C per SMC CP96S/SD catalog order key', () => {
    const match = matchCp96OrderKey('CP96SDB50-100C');
    expect(match).toEqual({
      familyLine: 'CP96S',
      seriesModelVariant: 'CP96SD',
      mountingToken: 'B',
      boreMm: 50,
      strokeMm: 100,
      strokeSuffix: 'C',
    });

    const fields = parseCp96OrderKeyFields(match!);
    const byKey = Object.fromEntries(
      fields.filter((f) => f.rawToken).map((f) => [f.attributeKey, f.rawToken])
    );
    expect(byKey.series).toBe('CP96');
    expect(byKey.series_model_variant).toBe('SD');
    expect(byKey.mounting_style).toBe('B');
    expect(byKey.magnet_sensor_capability).toBe('CP96SD');
    expect(byKey.cushioning).toBe('C');
  });

  it('parses CP96SB40-80 without auto-switch suffix', () => {
    const match = matchCp96OrderKey('CP96SB40-80');
    expect(match?.familyLine).toBe('CP96S');
    expect(match?.seriesModelVariant).toBe('CP96S');
    expect(match?.mountingToken).toBe('B');
    expect(match?.boreMm).toBe(40);
    expect(match?.strokeMm).toBe(80);
  });

  it('parses CP96KB32-100CW per SMC CP96K/KD catalog order key', () => {
    const match = matchCp96OrderKey('CP96KB32-100CW');
    expect(match).toEqual({
      familyLine: 'CP96K',
      seriesModelVariant: 'CP96K',
      mountingToken: 'B',
      boreMm: 32,
      strokeMm: 100,
      strokeSuffix: 'CW',
    });

    const fields = parseCp96OrderKeyFields(match!);
    const byKey = Object.fromEntries(
      fields.filter((f) => f.rawToken).map((f) => [f.attributeKey, f.rawToken])
    );
    expect(byKey.series_family_line).toBe('CP96K');
    expect(byKey.series_model_variant).toBe('K');
    expect(byKey.rod_non_rotating).toBe('CP96K');
    expect(byKey.cushioning).toBe('C');
    expect(byKey.rod_configuration).toBe('W');
  });

  it('parses CP96KDB50-100C with auto-switch KD variant', () => {
    const match = matchCp96OrderKey('CP96KDB50-100C');
    expect(match?.familyLine).toBe('CP96K');
    expect(match?.seriesModelVariant).toBe('CP96KD');
    const fields = parseCp96OrderKeyFields(match!);
    expect(fields.some((f) => f.rawToken === 'CP96KD' && f.attributeKey === 'magnet_sensor_capability')).toBe(
      true
    );
  });

  it('rejects invalid bore size on CP96S line', () => {
    expect(matchCp96OrderKey('CP96SB30-80')).toBeNull();
  });

  it('rejects bore 125 on CP96K line', () => {
    expect(matchCp96OrderKey('CP96KB125-200')).toBeNull();
  });
});
