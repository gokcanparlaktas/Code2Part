import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

import {
  mapCompareProductsDtoToCompatibilityResult,
  mapFindEquivalentsCandidateToCompatibilityResult,
  mapIdentifyProductDtoToResolved,
} from '@/services/mapBackendResolverDtos';

describe('mapBackendResolverDtos', () => {
  it('maps identify DTO to ProductIdentification-compatible shape', () => {
    const mapped = mapIdentifyProductDtoToResolved(
      {
        normalizedCode: '4WE6E-6X/EG24N9K4',
        manufacturer: 'Rexroth',
        series: '4WE6',
        category: 'CETOP 03 / NG6 hidrolik yön kontrol valfi',
        outcome: 'full',
        confidence: 'high',
        technicalAttributes: [],
        productDetailRows: [
          {
            label: 'Marka',
            value: 'Rexroth',
            evidence: 'Seri tablosundan',
            requiresCheck: false,
          },
        ],
        warnings: [],
      },
      '4WE6E-6X/EG24N9K4'
    );

    expect(mapped.source).toBe('backend');
    expect(mapped.identification.brand.value).toBe('Rexroth');
    expect(mapped.identification.outcome).toBe('full');
    expect(mapped.productDetailRows).toHaveLength(1);
  });

  it('maps compare DTO with server match percentage', () => {
    const mapped = mapCompareProductsDtoToCompatibilityResult({
      sourceCode: '4WE6E-6X/EG24N9K4',
      candidateCode: 'DSG-01-3C2-D24-N1-70',
      metadata: {
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      },
      summary: {
        matchLevelTr: 'Yüksek uyumlu muadil adayı',
        summaryTr: 'Özet',
        riskLevel: 'low',
        matchPercentage: 86,
      },
      compatible: [
        {
          label: 'Montaj standardı',
          sourceDisplay: 'ISO 4401-03-02-0-05',
          targetDisplay: 'ISO 4401-03-02-0-05',
          status: 'compatible',
        },
      ],
      different: [],
      unknownOrCheck: [
        {
          field: 'Konnektör tipi',
          sourceValue: 'DIN',
          targetValue: 'Farklı',
          reasonTr: 'Konnektör tipi kontrol edilmeli',
          severity: 'medium',
        },
      ],
      warnings: [],
    });

    expect(mapped.serverMatchPercentage).toBe(86);
    expect(calculateMatchPercentage(mapped).percentage).toBe(86);
    expect(mapped.compatible).toHaveLength(1);
    expect(mapped.checkItems).toHaveLength(1);
    expect(mapped.different).toHaveLength(0);
  });

  it('maps equivalents candidate preview rows', () => {
    const mapped = mapFindEquivalentsCandidateToCompatibilityResult({
      code: 'DSG-01-3C2-D24-N1-70',
      manufacturer: 'Yuken',
      series: 'DSG-01',
      matchPercentage: 86,
      metadata: {
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      },
      summary: 'Yüksek uyum',
      compatibleHighlights: ['Montaj standardı: ISO 4401-03-02-0-05'],
      checkNotes: ['Konnektör tipi kontrol edilmeli'],
    });

    expect(mapped.candidate.brand).toBe('Yuken');
    expect(mapped.candidate.suggestedCode).toBe('DSG-01-3C2-D24-N1-70');
    expect(mapped.serverMatchPercentage).toBe(86);
    expect(mapped.checkItems[0]?.reasonTr).toContain('Konnektör');
  });
});
