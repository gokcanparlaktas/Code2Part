import { LocalCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { identifyProductService } from '@/backend/services/identifyProductService';
import { findEquivalentsService } from '@/backend/services/findEquivalentsService';

describe('backend resolver services — rolling bearing', () => {
  const provider = new LocalCatalogDataProvider();

  it('identifies 6005-2RS with full outcome and bearing labels', async () => {
    const dto = await identifyProductService({
      code: '6005-2RS',
      catalogProvider: provider,
    });

    expect(dto.outcome).toBe('full');
    expect(dto.matched).toBe(true);
    expect(dto.resolverCategoryKey).toBe('rolling_bearing');
    expect(dto.productType).toBe('Bilyalı rulman');
    expect(dto.boreMm).toBe(25);
    expect(dto.outsideDiameterMm).toBe(47);
    expect(dto.widthMm).toBe(12);
    expect(dto.productDetailRows.some((row) => row.label === 'İç çap')).toBe(true);
    expect(dto.productDetailRows.some((row) => row.label === 'Kalınlık')).toBe(true);
  });

  it('finds cross-brand equivalents for 6005-2RS', async () => {
    const dto = await findEquivalentsService({
      code: '6005-2RS',
      catalogProvider: provider,
    });

    expect(dto.candidates.length).toBeGreaterThan(0);
    expect(dto.candidates.some((c) => c.code.includes('6005'))).toBe(true);
  });
});
