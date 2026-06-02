import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('buildProductDetailRows', () => {
  it('hydraulic_valve rows do not include Çap or Strok', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const labels = rows.map((r) => r.label);

    expect(labels).not.toContain('Çap');
    expect(labels).not.toContain('Strok');
  });

  it('hydraulic_valve rows include Montaj standardı when known', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const row = rows.find((r) => r.label === 'Montaj standardı');
    expect(row?.value).toMatch(/ISO 4401-03|CETOP 03|NG6/);
  });

  it('catalog-derived rows use clean evidence labels without internal review wording', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const rows = buildProductDetailRows(identifyProduct(code, normalizeCode(code)));

    const mounting = rows.find((r) => r.label === 'Montaj standardı');
    expect(mounting?.value).toMatch(/ISO 4401-03-02-0-05/i);
    expect(mounting?.evidence).toBe('Katalogdan');
    expect(mounting?.requiresCheck).toBe(false);
    expect(mounting?.evidence).not.toMatch(/Katalog adayı|Kontrol gerekli/i);

    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    expect(voltage?.value).toMatch(/24\s*V\s*DC/i);
    expect(voltage?.evidence).toBe('Ürün kodundan');
    expect(voltage?.requiresCheck).toBe(false);

    const center = rows.find((r) => r.label === 'Merkez tipi');
    expect(center?.value).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(center?.evidence).toBe('Katalogdan');
    expect(center?.value).not.toContain('Port durumu katalog adayından');

    const centering = rows.find((r) => r.label === 'Merkezleme');
    expect(centering?.value).toContain('Yay merkezlemeli');
    expect(centering?.evidence).toBe('Ürün kodundan');
    expect(centering?.evidence).not.toBe('Bilinmiyor');
  });

  it('Yuken DSG center type shows closed-center portState summary', () => {
    const code = 'DSG-01-3C2-D24-N1-70';
    const rows = buildProductDetailRows(identifyProduct(code, normalizeCode(code)));
    const center = rows.find((r) => r.label === 'Merkez tipi');
    expect(center?.value).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(center?.evidence).toBe('Katalogdan');
  });

  it('Yuken DSG default manual override shows Var, pin detail, Katalogdan', () => {
    const rows = buildProductDetailRows(
      identifyProduct('DSG-01-3C2-D24-N1-70', normalizeCode('DSG-01-3C2-D24-N1-70'))
    );
    const manual = rows.find((r) => r.label === 'Manuel kumanda');
    expect(manual?.value).toMatch(/^Var/);
    expect(manual?.value).toContain('Manuel override pimi');
    expect(manual?.evidence).toBe('Katalogdan');
  });

  it('Rexroth N9 manual override shows Var with detail, not internal wording', () => {
    const rows = buildProductDetailRows(
      identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'))
    );
    const manual = rows.find((r) => r.label === 'Manuel kumanda');
    expect(manual?.value).toMatch(/^Var/);
    expect(manual?.value).toContain('Gizli / korumalı manuel kumanda');
    expect(manual?.value).not.toContain('Katalog');
  });

  it('technical catalog pressure uses Teknik katalogdan source', () => {
    const rows = buildProductDetailRows(
      identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'))
    );
    const pressure = rows.find((r) => r.label === 'Maks. basınç (A/B/P)');
    expect(pressure?.value).toMatch(/350\s*bar/i);
    expect(pressure?.evidence).toBe('Teknik katalogdan');
  });

  it('pneumatic_cylinder rows include Çap and Strok', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const labels = rows.map((r) => r.label);
    expect(labels).toContain('Çap');
    expect(labels).toContain('Strok');
  });

  it('product category omits repeated product type tail', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);

    const productType = rows.find((r) => r.label === 'Ürün tipi');
    const productCategory = rows.find((r) => r.label === 'Ürün kategorisi');

    expect(productType?.value).toMatch(/Hidrolik yön kontrol valfi/i);
    expect(productCategory?.value).toMatch(/CETOP 03|NG6/i);
    expect(productCategory?.value).not.toMatch(/hidrolik yön kontrol valfi/i);
  });

  it('pneumatic product category omits repeated pnömatik silindir tail', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const productCategory = rows.find((r) => r.label === 'Ürün kategorisi');

    expect(productCategory?.value).toBe('ISO 15552');
  });
});

describe('equivalence warnings (user-facing)', () => {
  it('uses one general order warning instead of repeated catalog review lines', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const series = getProductSeriesById('yuken_dsg01')!;
    const result = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: 'DSG-01-3C2-D24-N1-70',
      targetIdentification: identifyProduct(
        'DSG-01-3C2-D24-N1-70',
        normalizeCode('DSG-01-3C2-D24-N1-70')
      ),
    });

    expect(result.warnings).toContain(GENERAL_ORDER_CATALOG_WARNING_TR);
    const catalogCandidateLines = result.warnings.filter((w) =>
      w.includes('Katalog adayı — doğrulanmalı')
    );
    expect(catalogCandidateLines).toHaveLength(0);

    const genericPressureChecks = result.checkItems.filter(
      (item) =>
        item.reasonTr.includes('yeterli kesin bilgi yok') &&
        (item.field.includes('basınç') || item.field.includes('Basınç'))
    );
    expect(genericPressureChecks).toHaveLength(0);
  });
});
