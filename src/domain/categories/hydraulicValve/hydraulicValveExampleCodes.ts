import type { ProductSeriesRecord } from '@/types/product';

const SERIES_EXAMPLE_CODES: Record<string, string> = {
  rexroth_4we6: '4WE6E-6X/EG24N9K4',
  rexroth_3we6: '3WE6A-6X/EG24N9K4',
  yuken_dsg01: 'DSG-01-3C2-D24-N1-70',
  vickers_dg4v3: 'DG4V-3-2A-M-U-H7-60',
  atos_dhi: 'DHI-0711-X 24DC',
  parker_d1vw: 'D1VW001CNJW',
  rexroth_4we10: '4WE10E-3X/CG24N9K4',
  yuken_dsg03: 'DSG-03-3C2-D24-N1-70',
  vickers_dg4v5: 'DG4V-5-2A-M-U-H7-60',
  atos_dhu: 'DHU-0711-X 24DC',
  parker_d3w: 'D3W001CNJW',
};

export function getHydraulicValveExampleCode(series: ProductSeriesRecord): string | null {
  if (series.exampleProductCodes?.length) {
    return series.exampleProductCodes[0] ?? null;
  }
  return SERIES_EXAMPLE_CODES[series.id] ?? null;
}
