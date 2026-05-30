import { prepareScannedProductCodeText } from '@/domain/labelReading/prepareScannedProductCodeText';

describe('prepareScannedProductCodeText', () => {
  it('normalizes spaced Rexroth nameplate text', () => {
    expect(
      prepareScannedProductCodeText('3WE 6 B61/EG24N9K4 SO561')
    ).toBe('3WE6B61/EG24N9K4SO561');
  });

  it('extracts MODEL line from multi-line label text', () => {
    expect(
      prepareScannedProductCodeText(
        'LUftec\nMODEL : FXBC 32X160-S\nGZ300000001GB'
      )
    ).toBe('FXBC32X160-S');
  });

  it('prefers model code over serial line', () => {
    expect(
      prepareScannedProductCodeText(
        'REXROTH\n3WE 6 B61/EG24N9K4\n*00546678* R42'
      )
    ).toBe('3WE6B61/EG24N9K4');
  });

  it('returns empty string for blank OCR output', () => {
    expect(prepareScannedProductCodeText('   \n  ')).toBe('');
  });
});
