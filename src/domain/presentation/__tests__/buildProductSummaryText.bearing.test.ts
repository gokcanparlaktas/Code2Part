import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { buildProductSummaryText } from '@/domain/presentation/buildProductSummaryText';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('bearing presentation', () => {
  it('uses İç çap, Dış çap and Kalınlık labels for 6005', () => {
    const id = identifyProduct('6005', normalizeCode('6005'));
    const rows = buildProductDetailRows(id);
    const labels = rows.map((row) => row.label);

    expect(labels).toContain('İç çap');
    expect(labels).toContain('Dış çap');
    expect(labels).toContain('Kalınlık');
    expect(labels).not.toContain('Genişlik (B)');
    expect(labels).not.toContain('Strok');

    expect(buildProductSummaryText(id)).toContain('Bilyalı rulman');
    expect(buildProductSummaryText(id)).toContain('6005');
  });
});
