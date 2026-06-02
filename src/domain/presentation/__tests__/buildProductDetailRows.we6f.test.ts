import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('buildProductDetailRows Rexroth 4WE6F', () => {
  it('shows resolved center and centering without catalog-check placeholders for 4WE6F-62/EG24N9K4', () => {
    const code = '4WE6F-62/EG24N9K4';
    const rows = buildProductDetailRows(identifyProduct(code, normalizeCode(code)));

    const spool = rows.find((r) => r.label === 'Sürgü sembolü');
    const center = rows.find((r) => r.label === 'Merkez tipi');
    const centering = rows.find((r) => r.label === 'Merkezleme');

    expect(center?.value).toMatch(/P-A-T Bağlı, B Kapalı/i);
    expect(center?.value).not.toMatch(/Kapalı merkez\)/);
    expect(center?.requiresCheck).toBe(false);
    expect(centering?.value).toContain('Yay merkezlemeli');
    expect(centering?.requiresCheck).toBe(false);
    if (spool) {
      expect(spool.requiresCheck).toBe(false);
      expect(spool.value).not.toMatch(/doğrulanmalı/i);
    }
  });
});
