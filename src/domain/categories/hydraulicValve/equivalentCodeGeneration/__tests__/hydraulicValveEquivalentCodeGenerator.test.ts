import { generateHydraulicValveEquivalentCandidates } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/hydraulicValveEquivalentCodeGenerator';
import { UNRESOLVED_SPOOL_MAPPING_NOTE_TR } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/rexrothYukenGenerationMappings';
import { findEquivalentCandidates } from '@/domain/resolver/findEquivalentCandidates';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

describe('hydraulicValveEquivalentCodeGenerator', () => {
  const yukenDsg01 = getProductSeriesById('yuken_dsg01')!;
  const rexroth4we6 = getProductSeriesById('rexroth_4we6')!;

  it('generates DSG-01-3C2-D24-N1-70 as generated_full for Rexroth E full code', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const candidates = generateHydraulicValveEquivalentCandidates(source, yukenDsg01);

    expect(candidates.some((entry) => entry.generatedCode === 'DSG-01-3C2-D24-N1-70')).toBe(true);
    const primary = candidates.find((entry) => entry.generatedCode === 'DSG-01-3C2-D24-N1-70');
    expect(primary?.generationStatus).toBe('generated_full');
    expect(primary?.isExactKnownExample).toBe(true);
  });

  it('generates same Yuken candidate for numeric design series 62', () => {
    const source = identifyProduct('4WE6E62/EG24N9K4', normalizeCode('4WE6E62/EG24N9K4'));
    const candidates = generateHydraulicValveEquivalentCandidates(source, yukenDsg01);

    expect(candidates.some((entry) => entry.generatedCode === 'DSG-01-3C2-D24-N1-70')).toBe(true);
  });

  it('returns multiple generated_partial Yuken alternatives for unresolved Rexroth J spool', () => {
    const source = identifyProduct('4WE6J62/EG24N9K4', normalizeCode('4WE6J62/EG24N9K4'));
    const candidates = generateHydraulicValveEquivalentCandidates(source, yukenDsg01);

    expect(candidates.length).toBeGreaterThan(1);
    expect(candidates.every((entry) => entry.generationStatus === 'generated_partial')).toBe(true);
    expect(
      candidates.every((entry) =>
        entry.checkNotes.some((note) => note.includes(UNRESOLVED_SPOOL_MAPPING_NOTE_TR.slice(0, 20)))
      )
    ).toBe(true);
    expect(candidates.some((entry) => entry.generatedCode === 'DSG-01-3C2-D24-N1-70')).toBe(true);
    expect(candidates.some((entry) => entry.generatedCode === 'DSG-01-3C60-D24-N1-70')).toBe(true);
  });

  it('generates Rexroth template from Yuken DSG full code', () => {
    const source = identifyProduct('DSG-01-3C2-D24-N1-70', normalizeCode('DSG-01-3C2-D24-N1-70'));
    expect(source.seriesId).toBe('yuken_dsg01');
    const candidates = generateHydraulicValveEquivalentCandidates(source, rexroth4we6);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.generatedCode).toMatch(/^4WE6E-6X\/EG24N9K4$/);
    expect(candidates[0]?.generationStatus).toBe('generated_full');
  });

  it('does not invent target spool for unknown Rexroth ZZ token', () => {
    const source = identifyProduct('4WE6ZZ62/EG24N9K4', normalizeCode('4WE6ZZ62/EG24N9K4'));
    const candidates = generateHydraulicValveEquivalentCandidates(source, yukenDsg01);

    expect(candidates.length).toBeGreaterThan(1);
    expect(candidates.every((entry) => entry.generationStatus === 'generated_partial')).toBe(true);
    expect(
      candidates.some((entry) =>
        entry.checkNotes.some((note) => note.includes('ZZ') || note.includes('çözümlenemedi'))
      )
    ).toBe(true);
  });

  it('dedupes generated and exact catalog candidates in findEquivalents', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const discoveries = findEquivalentCandidates(source, '4WE6E-6X/EG24N9K4');
    const yukenCodes = discoveries
      .filter((entry) => entry.candidate.seriesId === 'yuken_dsg01')
      .map((entry) => entry.candidate.suggestedCode);

    const normalizedMatches = yukenCodes.filter(
      (code) => normalizeCode(code ?? '') === normalizeCode('DSG-01-3C2-D24-N1-70')
    );
    expect(normalizedMatches).toHaveLength(1);

    const merged = discoveries.find(
      (entry) => normalizeCode(entry.candidate.suggestedCode ?? '') === normalizeCode('DSG-01-3C2-D24-N1-70')
    );
    expect(merged?.candidate.generation?.isExactKnownExample).toBe(true);
    expect(merged?.candidate.generation?.generationStatus).toBe('generated_full');
  });

  it('includes generated candidates in resolveProductSearch results', () => {
    const resolved = resolveProductSearch('4WE6E-6X/EG24N9K4');
    expect(
      resolved.compatibilityResults.some(
        (result) => result.candidate.suggestedCode === 'DSG-01-3C2-D24-N1-70'
      )
    ).toBe(true);
  });
});
