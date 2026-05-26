import {
  DEMO_DISCLAIMER_LINES,
  getDemoDisclaimerText,
} from '@/utils/demoDisclaimer';
import { formatNotFoundSearchTips, NOT_FOUND_SEARCH_TIPS } from '@/utils/notFoundSearchTips';

describe('demoDisclaimer', () => {
  it('includes required Turkish disclaimer lines', () => {
    expect(DEMO_DISCLAIMER_LINES).toContain(
      'Demo verileri katalog kontrolü gerektirebilir.'
    );
    expect(DEMO_DISCLAIMER_LINES).toContain(
      'Uyumluluk sonuçları kesin teknik onay yerine geçmez.'
    );
  });

  it('joins lines for display', () => {
    expect(getDemoDisclaimerText()).toBe(DEMO_DISCLAIMER_LINES.join(' '));
    expect(getDemoDisclaimerText('\n')).toBe(DEMO_DISCLAIMER_LINES.join('\n'));
  });
});

describe('notFoundSearchTips', () => {
  it('lists practical search tips in Turkish', () => {
    expect(NOT_FOUND_SEARCH_TIPS.length).toBeGreaterThanOrEqual(3);
    const formatted = formatNotFoundSearchTips();
    expect(formatted).toContain('Tam ürün kodunu');
    expect(formatted.startsWith('•')).toBe(true);
  });
});
