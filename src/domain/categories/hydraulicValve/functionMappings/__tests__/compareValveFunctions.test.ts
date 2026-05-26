import { compareValveFunctions } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctions';

describe('compareValveFunctions', () => {
  it('exact same token is compatible with explicit same-code message', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
    });

    expect(result.comparison.status).toBe('compatible');
    expect(result.matchType).toBe('exact_token_match');
    expect(result.statusMessageTr).toBe('Sürgü/fonksiyon kodu aynı: E');
  });

  it('Rexroth E vs Yuken 3C2 is unknownOrCheck, not compatible', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C2' },
    });

    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('compatible');
    expect(result.statusMessageTr).toContain('benzer olabilir');
    expect(result.statusMessageTr).toContain('Katalog sembolüyle doğrulanmalıdır');
    expect(result.statusMessageTr).not.toMatch(/aynıdır/i);
  });

  it('Rexroth E vs Atos 0711 is unknownOrCheck, not compatible', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Atos', series: 'DHI', token: '0711' },
    });

    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.statusMessageTr).toContain('katalogdan kontrol edilmelidir');
  });

  it('Yuken 3C12 vs Rexroth E is different', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C12' },
      target: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
    });

    expect(result.comparison.status).toBe('different');
    expect(result.matchType).toBe('different');
  });
});
