import type { CompatibilityResult, EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { compareProducts, isCrossCategoryComparison } from './compareProducts';
import { getProductSeriesById } from './productSeriesCatalog';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';

export class CompareTwoProductCodesError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'empty_source'
      | 'empty_target'
      | 'source_unresolved'
      | 'target_unresolved'
      | 'target_series_missing'
      | 'category_mismatch'
  ) {
    super(message);
    this.name = 'CompareTwoProductCodesError';
  }
}

function requireFullIdentification(
  inputCode: string,
  identification: ProductIdentification,
  role: 'source' | 'target'
): ProductIdentification {
  if (identification.outcome !== 'full' || !identification.seriesId) {
    const label = role === 'source' ? 'Kaynak' : 'Hedef';
    throw new CompareTwoProductCodesError(
      `${label} ürün kodu tam tanımlanamadı. Kodu kontrol edin veya önerilerden seçin.`,
      role === 'source' ? 'source_unresolved' : 'target_unresolved'
    );
  }

  return identification;
}

export function prepareTwoProductCodeComparison(
  sourceCode: string,
  candidateCode: string
): { source: ProductIdentification; candidate: EquivalentCandidate } {
  const sourceInput = sourceCode.trim();
  const candidateInput = candidateCode.trim();

  if (!sourceInput) {
    throw new CompareTwoProductCodesError('Kaynak ürün kodu girilmedi.', 'empty_source');
  }
  if (!candidateInput) {
    throw new CompareTwoProductCodesError('Hedef ürün kodu girilmedi.', 'empty_target');
  }

  const sourceIdentification = requireFullIdentification(
    sourceInput,
    identifyProduct(sourceInput, normalizeCode(sourceInput)),
    'source'
  );

  const targetIdentification = requireFullIdentification(
    candidateInput,
    identifyProduct(candidateInput, normalizeCode(candidateInput)),
    'target'
  );

  const targetSeries = getProductSeriesById(targetIdentification.seriesId!);
  if (!targetSeries) {
    throw new CompareTwoProductCodesError(
      'Hedef seri katalogda bulunamadı.',
      'target_series_missing'
    );
  }

  const candidate: EquivalentCandidate = {
    seriesId: targetSeries.id,
    brand: targetSeries.brand,
    series: targetSeries.series,
    productType: targetSeries.productType,
    productCategory: targetSeries.productCategory,
    standardFamily: targetSeries.standardFamily,
    suggestedCode: candidateInput,
    targetIdentification,
  };

  if (isCrossCategoryComparison(sourceIdentification, candidate)) {
    throw new CompareTwoProductCodesError(
      'Ürün kategorileri farklı. Hidrolik valf ile pnömatik silindir gibi farklı ürün türleri karşılaştırılamaz.',
      'category_mismatch'
    );
  }

  return { source: sourceIdentification, candidate };
}

export function compareTwoProductCodes(
  sourceCode: string,
  candidateCode: string
): CompatibilityResult {
  const { source, candidate } = prepareTwoProductCodeComparison(sourceCode, candidateCode);
  return compareProducts(source, candidate);
}
