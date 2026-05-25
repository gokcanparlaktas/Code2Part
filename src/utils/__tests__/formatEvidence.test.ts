import {
  buildEvidenceDetailRows,
  formatEvidenceExplanation,
  formatEvidenceLabel,
} from '../formatEvidence';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('formatEvidence', () => {
  it('maps default evidence levels to Turkish labels', () => {
    expect(formatEvidenceLabel('code')).toBe('Koddan okundu');
    expect(formatEvidenceLabel('series_table')).toBe('Seri bilgisinden geldi');
    expect(formatEvidenceLabel('standard')).toBe('Standarttan türetildi');
    expect(formatEvidenceLabel('inferred')).toBe('Tahmin edildi');
    expect(formatEvidenceLabel('unknown')).toBe('Bilinmiyor');
  });

  it('uses field-specific labels for brand and series', () => {
    expect(formatEvidenceLabel('series_table', 'series')).toBe('Koddan tespit edildi');
    expect(formatEvidenceLabel('series_table', 'brand')).toBe('Seri bilgisinden geldi');
    expect(formatEvidenceLabel('series_table', 'productType')).toBe(
      'Seri bilgisinden geldi'
    );
  });

  it('uses field-specific explanations', () => {
    expect(formatEvidenceExplanation('series_table', 'series')).toBe(
      'Ürün kodundaki seri/prefix bilgisiyle eşleşti.'
    );
    expect(formatEvidenceExplanation('series_table', 'brand')).toBe(
      'Koddan tespit edilen seri, yerel katalogda bu markaya bağlıdır.'
    );
    expect(formatEvidenceExplanation('code', 'bore')).toBe(
      'Bu bilgi ürün kodundan doğrudan çıkarıldı.'
    );
    expect(formatEvidenceExplanation('series_table', 'productType')).toBe(
      'Bu bilgi ürün serisinin yerel katalog bilgisinden geldi.'
    );
  });
});

describe('buildEvidenceDetailRows', () => {
  it('includes expected fields for a recognized DSBC code', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const identification = identifyProduct(input, normalizeCode(input));
    const rows = buildEvidenceDetailRows(identification);
    const labels = rows.map((r) => r.label);

    expect(labels).toContain('Marka');
    expect(labels).toContain('Seri');
    expect(labels).toContain('Ürün tipi');
    expect(labels).toContain('Standart aile');
    expect(labels).toContain('Çap');
    expect(labels).toContain('Strok');
    expect(labels).toContain('Muadil grup');
    expect(labels).toContain('Güven skoru');

    const series = rows.find((r) => r.label === 'Seri');
    expect(series?.evidenceLabel).toBe('Koddan tespit edildi');
    expect(series?.explanation).toBe(
      'Ürün kodundaki seri/prefix bilgisiyle eşleşti.'
    );

    const brand = rows.find((r) => r.label === 'Marka');
    expect(brand?.evidenceLabel).toBe('Seri bilgisinden geldi');
    expect(brand?.explanation).toBe(
      'Koddan tespit edilen seri, yerel katalogda bu markaya bağlıdır.'
    );

    const bore = rows.find((r) => r.label === 'Çap');
    expect(bore?.value).toBe('50 mm');
    expect(bore?.evidenceLabel).toBe('Koddan okundu');
    expect(bore?.explanation).toBe('Bu bilgi ürün kodundan doğrudan çıkarıldı.');

    const productType = rows.find((r) => r.label === 'Ürün tipi');
    expect(productType?.evidenceLabel).toBe('Seri bilgisinden geldi');
    expect(productType?.explanation).toBe(
      'Bu bilgi ürün serisinin yerel katalog bilgisinden geldi.'
    );
  });
});
