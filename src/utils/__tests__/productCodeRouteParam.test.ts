import {
  decodeProductCodeFromRoute,
  encodeProductCodeForRoute,
  productCodeEquivalentsHref,
  productCodeResultHref,
} from '@/utils/productCodeRouteParam';

describe('productCodeRouteParam', () => {
  const code = '4WE6E-7X/HG24N9K4';

  it('encodes slash in product code', () => {
    expect(encodeProductCodeForRoute(code)).toBe('4WE6E-7X%2FHG24N9K4');
  });

  it('builds result href with encoded code', () => {
    expect(productCodeResultHref(code)).toBe('/result?code=4WE6E-7X%2FHG24N9K4');
  });

  it('builds equivalents href with encoded code', () => {
    expect(productCodeEquivalentsHref(code)).toBe('/equivalents?code=4WE6E-7X%2FHG24N9K4');
  });

  it('decodes route param back to full code', () => {
    expect(decodeProductCodeFromRoute('4WE6E-7X%2FHG24N9K4')).toBe(code);
  });

  it('leaves already-decoded codes unchanged', () => {
    expect(decodeProductCodeFromRoute(code)).toBe(code);
  });
});
