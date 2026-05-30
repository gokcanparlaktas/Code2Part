import {
  completeProductCode,
  shouldSuppressWeakPartialSuggestions,
} from '@/domain/resolver/completeProductCode';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { suggestProductsDetailed } from '@/domain/resolver/suggestProducts';

describe('completeProductCode', () => {
  it('identifies 4WE6J62 as can_complete with Rexroth WE6 fields and missing coil options', () => {
    const result = completeProductCode('4WE6J62');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.manufacturer).toBe('Rexroth');
    expect(result.family).toBe('WE6');
    expect(result.recognizedFields.map((field) => field.key)).toEqual([
      'manufacturer',
      'series',
      'family',
      'spool_symbol',
      'design_series',
    ]);
    expect(result.recognizedFields.find((field) => field.key === 'spool_symbol')?.value).toBe(
      'Kısmi açık / katalogdan kontrol edilmeli'
    );
    expect(result.recognizedFields.find((field) => field.key === 'design_series')?.value).toBe('62');
    expect(result.missingFields.map((field) => field.key)).toEqual([
      'coil_voltage',
      'manual_override',
      'connector_type',
    ]);
    expect(
      result.missingFields.every((field) =>
        field.options.some((option) => option.displayValue === 'Kararsızım / Bilmiyorum')
      )
    ).toBe(true);

    const coilField = result.missingFields.find((field) => field.key === 'coil_voltage');
    expect(coilField?.options.map((option) => option.displayValue)).toEqual([
      '24 V DC',
      '12 V DC',
      '24 V DC (H tipi)',
      'Kararsızım / Bilmiyorum',
    ]);

    const manualField = result.missingFields.find((field) => field.key === 'manual_override');
    expect(manualField?.options.map((option) => option.displayValue)).toEqual([
      'Var',
      'Yok',
      'Kararsızım / Bilmiyorum',
    ]);
  });

  it('does not treat 4WE6J62 suggestions as useful full examples', () => {
    const completion = completeProductCode('4WE6J62');
    const suggestions = suggestProductsDetailed('4WE6J62');

    expect(shouldSuppressWeakPartialSuggestions(completion)).toBe(true);
    expect(suggestions.suggestions.some((item) => item.exampleCodeFormat === '4WE6')).toBe(true);
  });

  it('builds completed_full code for EG24/N9/K4 selections on 4WE6J62', () => {
    const result = completeProductCode('4WE6J62', {
      coil_voltage: 'EG24',
      manual_override: 'N9',
      connector_type: 'K4',
    });

    expect(result.completionStatus).toBe('completed_full');
    expect(result.completedCode).toBe('4WE6J-62/EG24N9K4');
    expect(identifyProduct(result.completedCode!, normalizeCode(result.completedCode!)).outcome).toBe(
      'full'
    );
  });

  it('builds completed_partial code when manual override is uncertain', () => {
    const result = completeProductCode('4WE6J62', {
      coil_voltage: 'EG24',
      manual_override: null,
      connector_type: 'K4',
    });

    expect(result.completionStatus).toBe('completed_partial');
    expect(result.completedCode).toBe('4WE6J-62/EG24K4');
    expect(result.uncertainFields).toContain('manual_override');
    expect(result.checkNotes.some((note) => note.includes('Manuel kumanda'))).toBe(true);
    expect(resolveProductSearch(result.completedCode!).hasEquivalents).toBe(true);
  });

  it('completes 4WE6E62 to 4WE6E-62/EG24N9K4', () => {
    const result = completeProductCode('4WE6E62', {
      coil_voltage: 'EG24',
      manual_override: 'N9',
      connector_type: 'K4',
    });

    expect(result.completedCode).toBe('4WE6E-62/EG24N9K4');
    expect(result.completionStatus).toBe('completed_full');
  });

  it('marks 4WE6J-62/EG24N9K4 as already_complete', () => {
    const result = completeProductCode('4WE6J-62/EG24N9K4');

    expect(result.completionStatus).toBe('already_complete');
    expect(result.missingFields).toEqual([]);
  });

  it('keeps recognized header when all completion fields are uncertain', () => {
    const result = completeProductCode('4WE6J62', {
      coil_voltage: null,
      manual_override: null,
      connector_type: null,
    });

    expect(result.completionStatus).toBe('completed_partial');
    expect(result.completedCode).toBe('4WE6J-62');
    expect(result.recognizedFields.length).toBeGreaterThan(0);
    expect(result.uncertainFields).toEqual([
      'coil_voltage',
      'manual_override',
      'connector_type',
    ]);
  });

  it('identifies DSG-01 as can_complete with Yuken completion fields', () => {
    const result = completeProductCode('DSG-01');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.manufacturer).toBe('Yuken');
    expect(result.family).toBe('DSG-01');
    expect(result.missingFields.map((field) => field.key)).toEqual([
      'function_code',
      'coil_voltage',
      'manual_override',
      'connector_type',
      'design_number',
    ]);
    const centerField = result.missingFields.find((field) => field.key === 'function_code');
    expect(centerField?.labelTr).toBe('Merkez Tipi');
    expect(centerField?.options.some((option) => option.displayValue.includes('('))).toBe(false);
    expect(centerField?.options.some((option) => option.displayValue === 'Kapalı merkez')).toBe(
      true
    );
    expect(new Set(centerField?.options.map((option) => option.displayValue)).size).toBe(
      centerField?.options.length
    );
    expect(shouldSuppressWeakPartialSuggestions(result)).toBe(true);
  });

  it('normalizes DSG 01 shorthand to DSG-01 completion', () => {
    const result = completeProductCode('DSG 01');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.family).toBe('DSG-01');
  });

  it('builds completed_full Yuken code from DSG-01 selections', () => {
    const result = completeProductCode('DSG-01', {
      function_code: '3C2',
      coil_voltage: 'D24',
      manual_override: 'default',
      connector_type: 'N1',
      design_number: '70',
    });

    expect(result.completionStatus).toBe('completed_full');
    expect(result.completedCode).toBe('DSG-01-3C2-D24-N1-70');
    expect(identifyProduct(result.completedCode!, normalizeCode(result.completedCode!)).outcome).toBe(
      'full'
    );
  });

  it('builds Yuken code with C manual override segment', () => {
    const result = completeProductCode('DSG-01', {
      function_code: '3C2',
      coil_voltage: 'D24',
      manual_override: 'C',
      connector_type: 'N1',
      design_number: '70',
    });

    expect(result.completedCode).toBe('DSG-01-3C2-D24-C-N1-70');
    expect(result.completionStatus).toBe('completed_full');
  });

  it('keeps recognized function when completing DSG-01-3C2 tail fields only', () => {
    const result = completeProductCode('DSG-01-3C2');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.missingFields.map((field) => field.key)).toEqual([
      'coil_voltage',
      'manual_override',
      'connector_type',
      'design_number',
    ]);
    expect(result.recognizedFields.some((field) => field.key === 'function_code')).toBe(true);
    const centerField = result.recognizedFields.find((field) => field.key === 'function_code');
    expect(centerField?.labelTr).toBe('Merkez Tipi');
    expect(centerField?.value).toBe('Kapalı merkez');
  });

  it('identifies 3WE6 as can_complete with spool and design selectors', () => {
    const result = completeProductCode('3WE6');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.manufacturer).toBe('Rexroth');
    expect(result.recognizedFields.find((field) => field.key === 'series')?.value).toBe('3WE6');
    expect(result.missingFields.map((field) => field.key)).toEqual([
      'spool_symbol',
      'design_series',
      'coil_voltage',
      'manual_override',
      'connector_type',
    ]);
    expect(shouldSuppressWeakPartialSuggestions(result)).toBe(true);
  });

  it('identifies 3WE6Y with recognized spool and missing design plus coil fields', () => {
    const result = completeProductCode('3WE6Y');

    expect(result.completionStatus).toBe('can_complete');
    expect(result.recognizedFields.some((field) => field.key === 'spool_symbol')).toBe(true);
    expect(result.missingFields.map((field) => field.key)).toEqual([
      'design_series',
      'coil_voltage',
      'manual_override',
      'connector_type',
    ]);
  });

  it('builds full 3WE6 code from series-only input', () => {
    const result = completeProductCode('3WE6', {
      spool_symbol: 'Y',
      design_series: '62',
      coil_voltage: 'EG24',
      manual_override: 'N9',
      connector_type: 'K4',
    });

    expect(result.completedCode).toBe('3WE6Y-62/EG24N9K4');
    expect(result.completedCode).not.toMatch(/\dX/i);
    expect(result.completionStatus).toBe('completed_full');
    expect(identifyProduct(result.completedCode!, normalizeCode(result.completedCode!)).outcome).toBe(
      'full'
    );
  });

  it('never emits 6X/7X catalog shorthand in Rexroth design series options', () => {
    const result = completeProductCode('4WE6E');

    const designField = result.missingFields.find((field) => field.key === 'design_series');
    expect(designField?.options.every((option) => !option.token?.endsWith('X'))).toBe(true);
    expect(designField?.options.map((option) => option.token)).toEqual([
      '62',
      '61',
      '71',
      '72',
      null,
    ]);
  });

  it('identifies 3WE6 in product search as partial Rexroth series', () => {
    const resolved = resolveProductSearch('3WE6');

    expect(resolved.identification.outcome).toBe('series_only');
    expect(resolved.identification.series.value).toBe('3WE6');
    expect(resolved.identification.brand.value).toBe('Rexroth');
  });

  it('identifies 3WE4 in product search as partial Rexroth series', () => {
    const resolved = resolveProductSearch('3WE4');

    expect(resolved.identification.outcome).toBe('series_only');
    expect(resolved.identification.series.value).toBe('3WE4');
    expect(resolved.identification.brand.value).toBe('Rexroth');
  });

  it('builds full 3WE4 code from series-only input', () => {
    const result = completeProductCode('3WE4', {
      spool_symbol: 'E',
      design_series: '42',
      coil_voltage: 'EG24',
      manual_override: 'N9',
      connector_type: 'K4',
    });

    expect(result.completedCode).toBe('3WE4E-42/EG24N9K4');
    expect(result.completionStatus).toBe('completed_full');
    expect(identifyProduct(result.completedCode!, normalizeCode(result.completedCode!)).brand.value).toBe(
      'Rexroth'
    );
  });

  it('maps Kapalı merkez to Rexroth E spool for best Yuken equivalent', () => {
    const canComplete = completeProductCode('4WE6');
    const closedCenter = canComplete.missingFields
      .find((field) => field.key === 'spool_symbol')
      ?.options.find((option) => option.displayValue === 'Kapalı merkez');

    expect(closedCenter?.token).toBe('E');
  });

  it('completed Rexroth closed center + Var yields compatible Yuken merkez and manuel', () => {
    const completed = completeProductCode('4WE6', {
      spool_symbol: 'E',
      design_series: '62',
      coil_voltage: 'EG24',
      manual_override: 'N9',
      connector_type: 'K4',
    });

    expect(completed.completionStatus).toBe('completed_full');
    expect(completed.completedCode).toBe('4WE6E-62/EG24N9K4');

    const resolved = resolveProductSearch(completed.completedCode!);
    const yuken = resolved.compatibilityResults.find(
      (result) => result.candidate.seriesId === 'yuken_dsg01'
    );

    expect(yuken?.candidate.suggestedCode).toBe('DSG-01-3C2-D24-N1-70');
    expect(yuken?.compatible.some((item) => item.label === 'Merkez tipi')).toBe(true);
    expect(yuken?.checkItems.some((item) => item.field === 'Merkez tipi')).toBe(false);
    expect(yuken?.compatible.some((item) => item.label === 'Manuel kumanda')).toBe(true);
    expect(yuken?.checkItems.some((item) => item.field === 'Manuel kumanda')).toBe(false);
  });

  it('completed Rexroth manual Yok yields incompatible manuel vs Yuken default', () => {
    const completed = completeProductCode('4WE6', {
      spool_symbol: 'E',
      design_series: '62',
      coil_voltage: 'EG24',
      manual_override: '',
      connector_type: 'K4',
    });

    expect(completed.completedCode).toBe('4WE6E-62/EG24K4');

    const resolved = resolveProductSearch(completed.completedCode!);
    const yuken = resolved.compatibilityResults.find(
      (result) => result.candidate.seriesId === 'yuken_dsg01'
    );

    expect(yuken?.different.some((item) => item.label === 'Manuel kumanda')).toBe(true);
    expect(yuken?.checkItems.some((item) => item.field === 'Manuel kumanda')).toBe(false);
  });
});
