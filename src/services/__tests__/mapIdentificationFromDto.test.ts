import { mapIdentifyProductResponse } from '@/backend/dto/mapIdentifyProductResponse';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { mapIdentificationFromDto } from '@/services/mapIdentificationFromDto';
import { mapIdentifyProductDtoToResolved } from '@/services/mapBackendResolverDtos';

describe('mapIdentificationFromDto', () => {
  it('round-trips rolling bearing identification through API DTO', () => {
    const inputCode = '6005-2RS';
    const identification = identifyProduct(inputCode, normalizeCode(inputCode));
    const dto = mapIdentifyProductResponse({ identification, inputCode });
    const restored = mapIdentificationFromDto(inputCode, dto);

    expect(restored.resolverCategoryKey).toBe('rolling_bearing');
    expect(restored.outcome).toBe('full');
    expect(restored.matched).toBe(true);
    expect(restored.productType.value).toBe('Bilyalı rulman');
    expect(restored.bore.value).toBe(25);
    expect(restored.outsideDiameter?.value).toBe(47);
    expect(restored.bearingWidth?.value).toBe(12);

    const resolved = mapIdentifyProductDtoToResolved(dto, inputCode);
    expect(resolved.identification.outcome).toBe('full');
    expect(resolved.identification.seriesId).toBe('rolling_bearing_metric');
  });
});
