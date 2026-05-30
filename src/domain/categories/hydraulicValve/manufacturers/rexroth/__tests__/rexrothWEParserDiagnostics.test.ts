import {
  diagnoseRexrothWECode,
  parseRexrothWEWithDiagnostics,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

describe('Rexroth WE parser diagnostics', () => {
  it('reports fully_parsed for 4WE6J62/EG24N9K4', () => {
    const { attributes, diagnostics } = parseRexrothWEWithDiagnostics('4WE6J62/EG24N9K4');

    expect(diagnostics.parseCompleteness).toBe('fully_parsed');
    expect(diagnostics.unknownTokens).toEqual([]);
    expect(diagnostics.parserNotes).toContain('Tam çözümlenmiş katalog kodu');
    expect(attributes).not.toBeNull();

    const map = new Map(attributes!.map((item) => [item.key, item]));
    expect(map.get('spool_symbol')?.value).toBe('J');
    expect(map.get('design_series')?.value).toBe('62');
    expect(map.get('design_series_family')?.value).toBe('6X');
    expect(map.get('raw_design_series')?.value).toBe('62');
    expect(map.get('coil_rating')?.value).toBe('EG24');
    expect(map.get('manual_override')?.value).toBe('N9');
    expect(map.get('connector_type')?.value).toBe('K4');
  });

  it('parses hyphenated numeric design series 4WE6J-62/EG24N9K4', () => {
    const { attributes, diagnostics } = parseRexrothWEWithDiagnostics('4WE6J-62/EG24N9K4');

    expect(diagnostics.parseCompleteness).toBe('fully_parsed');
    const map = new Map(attributes!.map((item) => [item.key, item]));
    expect(map.get('design_series')?.value).toBe('62');
    expect(map.get('design_series_family')?.value).toBe('6X');
  });

  it('parses catalog shorthand 4WE6J6X/EG24N9K4', () => {
    const { attributes, diagnostics } = parseRexrothWEWithDiagnostics('4WE6J6X/EG24N9K4');

    expect(diagnostics.parseCompleteness).toBe('fully_parsed');
    const map = new Map(attributes!.map((item) => [item.key, item]));
    expect(map.get('spool_symbol')?.value).toBe('J');
    expect(map.get('design_series')?.value).toBe('6X');
    expect(map.get('design_series_family')?.value).toBe('6X');
    expect(map.get('raw_design_series')).toBeUndefined();
  });

  it('identifies spaced nameplate code with design series detail rows', () => {
    const identification = identifyProduct('4WE 6 J62/EG24N9K4', normalizeCode('4WE 6 J62/EG24N9K4'));
    const rows = buildProductDetailRows(identification);

    expect(identification.outcome).toBe('full');
    expect(identification.confidence).toBe('high');
    expect(rows.some((row) => row.label === 'Tasarım serisi' && row.value.includes('62'))).toBe(true);
  });

  it('finds equivalents for fully parsed J62 without exact example membership', () => {
    const resolved = resolveProductSearch('4WE6J62/EG24N9K4');

    expect(resolved.identification.outcome).toBe('full');
    expect(resolved.hasEquivalents).toBe(true);
  });

  it('returns partial diagnostics for unknown spool token ZZ', () => {
    const diagnostics = diagnoseRexrothWECode('4WE6ZZ62/EG24N9K4');

    expect(diagnostics.parseCompleteness).toBe('partial');
    expect(diagnostics.unknownTokens).toContain('ZZ');
    expect(diagnostics.unresolvedSegments).toContain('spool_symbol');
    expect(diagnostics.parserNotes.some((note) => note.includes('ZZ'))).toBe(true);
  });

  it('returns partial diagnostics for invalid design series 99', () => {
    const diagnostics = diagnoseRexrothWECode('4WE6J99/EG24N9K4');

    expect(diagnostics.parseCompleteness).toBe('partial');
    expect(diagnostics.unknownTokens).toContain('99');
    expect(diagnostics.unresolvedSegments).toContain('design_series');
  });
});
