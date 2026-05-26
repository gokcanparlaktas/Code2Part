import {
  getCatalogV2Bundle,
  getCatalogVoltageCodes,
  getHydraulicFunctionAliasesFromCatalog,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import { validateCatalogV2Bundle } from '@/domain/catalog/validateCatalogV2';
import { parseHydraulicCoilVoltage } from '@/domain/categories/hydraulicValve/hydraulicValveIdentify';
import { getHydraulicValveAttributes } from '@/domain/categories/hydraulicValve/hydraulicValveAttributes';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import { cloneCatalogV2Bundle } from './catalogV2TestFixtures';

describe('hydraulic voltage safety (catalog v2)', () => {
  it('catalog H7 entry is not mapped to 24V DC', () => {
    const vickersCodes = getCatalogVoltageCodes('vickers_dg4v3');
    const h7 = vickersCodes.find((v) => v.code === 'H7');
    expect(h7).toBeDefined();
    expect(h7?.labelTr).toBeUndefined();
    expect(h7?.requiresCatalogCheck).toBe(true);
    expect(h7?.confidence).not.toBe('high');
  });

  it('DG4V example with H7 is not interpreted as confirmed 24V DC', () => {
    const code = 'DG4V-3-2A-M-U-H7-60';
    const series = getProductSeriesById('vickers_dg4v3')!;
    const parsed = parseHydraulicCoilVoltage(normalizeCode(code), series);
    expect(parsed.value).toBeNull();
    expect(parsed.evidence).not.toBe('code');
    expect(parsed.requiresCheck).toBe(true);

    const id = identifyProduct(code, normalizeCode(code));
    const voltageAttr = getTechnicalAttributes(id).find((a) => a.key === 'voltage');
    expect(voltageAttr?.value).not.toBe('24V DC');
    if (voltageAttr?.value !== null) {
      expect(String(voltageAttr?.value)).not.toMatch(/^24\s*V/i);
    }
  });

  it('EG24/D24/24DC mappings may be high confidence 24V DC', () => {
    const rexroth = getCatalogVoltageCodes('rexroth_4we6');
    const eg24 = rexroth.find((v) => v.code === 'EG24');
    expect(eg24?.labelTr).toMatch(/24/i);
    expect(eg24?.confidence).toBe('high');
  });

  it('validation fails when catalog illegally maps H7 to 24V DC', () => {
    const bundle = cloneCatalogV2Bundle();
    const vickers = bundle.productSeries.find((s) => s.id === 'vickers_dg4v3');
    expect(vickers).toBeDefined();
    vickers!.voltageCodes = [
      ...(vickers!.voltageCodes ?? []),
      {
        code: 'H7',
        labelTr: '24 V DC',
        confidence: 'high',
        requiresCatalogCheck: false,
      },
    ];

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'h7_mapped_as_24v')).toBe(true);
    expect(result.errors.some((e) => e.messageTr.includes('H7'))).toBe(true);
  });

  it('function mappings stay cautious (no high confidence without catalog check)', () => {
    const mappings = getHydraulicFunctionAliasesFromCatalog();
    expect(mappings.length).toBeGreaterThan(0);
    for (const mapping of mappings) {
      if (mapping.confidence === 'high') {
        expect(mapping.requiresCatalogCheck).toBe(false);
      } else {
        expect(mapping.requiresCatalogCheck).toBe(true);
      }
    }
    expect(getCatalogV2Bundle().functionMappings.every((m) => m.requiresCatalogCheck)).toBe(
      true
    );
  });
});
