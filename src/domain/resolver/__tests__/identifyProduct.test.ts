import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';

function identify(input: string) {
  const normalized = normalizeCode(input);
  return identifyProduct(input, normalized);
}

describe('identifyProduct', () => {
  const cases = [
    {
      code: 'DSBC-50-100-PPVA-N3',
      brand: 'Festo',
      series: 'DSBC',
      bore: 50,
      stroke: 100,
    },
    {
      code: 'DSBC-32-25-PPSA-N3',
      brand: 'Festo',
      series: 'DSBC',
      bore: 32,
      stroke: 25,
    },
    {
      code: 'CP96-50-100',
      brand: 'SMC',
      series: 'CP96',
      bore: 50,
      stroke: 100,
    },
    {
      code: 'CP96SDB50-100',
      brand: 'SMC',
      series: 'CP96',
      bore: 50,
      stroke: 100,
    },
    {
      code: 'CQ2B32-50D',
      brand: 'SMC',
      series: 'CQ2',
      bore: 32,
      stroke: 50,
    },
    {
      code: 'SI50X100',
      brand: 'AirTAC',
      series: 'SI',
      bore: 50,
      stroke: 100,
    },
    {
      code: 'P1D-S050MS-0100',
      brand: 'Parker',
      series: 'P1D',
      bore: 50,
      stroke: 100,
    },
    {
      code: 'DSNU-25-80-P-A',
      brand: 'Festo',
      series: 'DSNU',
      bore: 25,
      stroke: 80,
    },
  ] as const;

  it.each(cases)(
    'identifies $code as $brand $series with bore and stroke from code',
    ({ code, brand, series, bore, stroke }) => {
      const result = identify(code);

      expect(result.outcome).toBe('full');
      expect(result.matched).toBe(true);
      expect(result.brand.value).toBe(brand);
      expect(result.series.value).toBe(series);
      expect(result.bore.value).toBe(bore);
      expect(result.stroke.value).toBe(stroke);
      expect(result.bore.evidence).toBe('code');
      expect(result.stroke.evidence).toBe('code');
      expect(result.confidence).toBe('high');
    }
  );
});
