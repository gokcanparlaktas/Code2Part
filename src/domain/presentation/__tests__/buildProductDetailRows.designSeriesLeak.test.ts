import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function rowsText(code: string): { labels: string[]; text: string } {
  const id = identifyProduct(code, normalizeCode(code));
  const rows = buildProductDetailRows(id);
  return {
    labels: rows.map((r) => r.label),
    text: rows.map((r) => `${r.label}: ${r.value}`).join('\n'),
  };
}

describe('buildProductDetailRows design-series raw leakage', () => {
  it('Yuken DSG-01-3C2-D24-N1-50 does not render raw design series code row', () => {
    const { labels, text } = rowsText('DSG-01-3C2-D24-N1-50');
    expect(labels).not.toContain('Tasarım serisi kodu');
    expect(text).not.toMatch(/Tasarım serisi kodu:\s*50/i);
    expect(text).not.toContain('Kod kanıtı:');
  });

  it('Vickers DG4V-3-2A-M-U-H7-60 shows meaningful design series without raw code row', () => {
    const { labels, text } = rowsText('DG4V-3-2A-M-U-H7-60');
    expect(text).toContain('Tasarım serisi');
    expect(text).toContain('Basic design');
    expect(labels).not.toContain('Tasarım serisi kodu');
    expect(text).not.toMatch(/Tasarım serisi kodu:\s*60/i);
    expect(text).not.toContain('Kod kanıtı:');
  });
});

