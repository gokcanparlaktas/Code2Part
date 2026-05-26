import { compareValveFunctions } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctions';
import {
  extractHydraulicAttributes,
  extractPneumaticAttributes,
  extractTechnicalAttributeResults,
  normalizeVoltage,
} from '@/domain/attributes/extractors';
import { getCatalogVoltageCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';

function resultMap(
  results: ReturnType<typeof extractTechnicalAttributeResults>
) {
  return new Map(results.map((r) => [r.key, r]));
}

describe('extractTechnicalAttributes (catalog v2 driven)', () => {
  describe('hydraulic voltage', () => {
    it.each([
      ['4WE6E-7X/HG24N9K4', 'G24', '24V DC'],
      ['4WE10E-3X/CG24N9K4', 'CG24', '24V DC'],
      ['DSG-01-3C2-D24-N1-50', 'D24', '24V DC'],
      ['DHI-0711-X 24DC', '24DC', '24V DC'],
    ])('maps %s voltage token to %s', (code, token, expectedValue) => {
      const id = identifyProduct(code, normalizeCode(code));
      const map = resultMap(
        extractHydraulicAttributes({ inputCode: code, seriesId: id.seriesId })
      );
      expect(map.get('voltage')?.value).toBe(expectedValue);
      expect(map.get('voltage')?.sourceToken).toBe(token);
      expect(map.get('voltage')?.confidence).toBe('high');
    });

    it('H7 in DG4V code stays unresolved (not 24V DC)', () => {
      const code = 'DG4V-3-2A-M-U-H7-60';
      const id = identifyProduct(code, normalizeCode(code));
      const voltage = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      }).find((a) => a.key === 'voltage');

      expect(voltage?.value).toBeNull();
      expect(voltage?.evidence).toBe('unknown');
      expect(voltage?.sourceToken).toBe('H7');
      expect(voltage?.requiresCatalogCheck).toBe(true);
    });

    it('catalog H7 entry is not high-confidence 24V DC', () => {
      const h7 = getCatalogVoltageCodes('vickers_dg4v3').find((v) => v.code === 'H7');
      expect(h7?.labelTr).toBeUndefined();
      expect(h7?.confidence).not.toBe('high');
      expect(normalizeVoltage(h7?.labelTr)).toBeNull();
    });
  });

  describe('hydraulic function caution', () => {
    it('Rexroth E vs Atos 0711 is not fully compatible', () => {
      const result = compareValveFunctions({
        label: 'Sürgü / fonksiyon kodu',
        source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
        target: { manufacturer: 'Atos', series: 'DHI', token: '0711' },
      });
      expect(result.comparison.status).toBe('unknownOrCheck');
      expect(result.comparison.status).not.toBe('compatible');
    });

    it('exact same function token remains compatible', () => {
      const result = compareValveFunctions({
        label: 'Sürgü / fonksiyon kodu',
        source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
        target: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      });
      expect(result.comparison.status).toBe('compatible');
    });
  });

  describe('hydraulic connector and function', () => {
    it('extracts Rexroth WE6 connector from RE 23164 parser with catalog confidence', () => {
      const code = '4WE6E-7X/HG24N9K4';
      const id = identifyProduct(code, normalizeCode(code));
      const connector = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      }).find((a) => a.key === 'connector_token');

      expect(connector?.value).toBe('K4');
      expect(connector?.confidence).toBe('high');
      expect(connector?.requiresCatalogCheck).toBe(false);
    });

    it('extracts connector token with check required on non-catalog hydraulic series', () => {
      const code = 'DSG-01-3C2-D24-N1-50';
      const id = identifyProduct(code, normalizeCode(code));
      const connector = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      }).find((a) => a.key === 'connector_token');

      expect(connector?.value).toBe('N1');
      expect(connector?.confidence).toBe('low');
      expect(connector?.requiresCatalogCheck).toBe(true);
    });
  });

  describe('pneumatic extraction', () => {
    it('DSBC-50-100-PPVA-N3 extracts bore, stroke, cushioning, variant N3', () => {
      const code = 'DSBC-50-100-PPVA-N3';
      const id = identifyProduct(code, normalizeCode(code));
      const map = resultMap(
        extractPneumaticAttributes({ inputCode: code, seriesId: id.seriesId })
      );

      expect(map.get('bore')?.value).toBe(50);
      expect(map.get('bore')?.evidence).toBe('code');
      expect(map.get('stroke')?.value).toBe(100);
      expect(map.get('stroke')?.evidence).toBe('code');
      expect(map.get('cushioning_token')?.value).toBe('PPVA');
      expect(map.get('cushioning_token')?.requiresCatalogCheck).toBe(true);
      expect(map.get('options')?.value).toContain('N3');
      expect(map.get('options')?.confidence).not.toBe('high');
    });

    it('CQ2B32-50D compact form still parses bore/stroke', () => {
      const code = 'CQ2B32-50D';
      const id = identifyProduct(code, normalizeCode(code));
      const map = resultMap(
        extractPneumaticAttributes({ inputCode: code, seriesId: id.seriesId })
      );
      expect(map.get('bore')?.value).toBe(32);
      expect(map.get('stroke')?.value).toBe(50);
    });

    it('unknown random token is not a high-confidence attribute', () => {
      const code = 'DSBC-50-100-UNKNOWNTOKEN';
      const id = identifyProduct(code, normalizeCode(code));
      const results = extractPneumaticAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      });
      const unknownAttr = results.find((a) => a.value === 'UNKNOWNTOKEN');
      expect(unknownAttr).toBeUndefined();
      expect(results.every((a) => a.confidence !== 'high' || a.evidence === 'code')).toBe(
        true
      );
    });
  });

  describe('presentation bridge', () => {
    it('getTechnicalAttributes matches extractor output for hydraulic', () => {
      const code = '4WE6E-6X/EG24N9K4';
      const id = identifyProduct(code, normalizeCode(code));
      const fromFacade = getTechnicalAttributes(id);
      const fromExtractor = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      });

      expect(fromFacade.find((a) => a.key === 'function_token')?.value).toBe('E');
      expect(fromExtractor.find((a) => a.key === 'function_token')?.value).toBe('E');
    });
  });
});
