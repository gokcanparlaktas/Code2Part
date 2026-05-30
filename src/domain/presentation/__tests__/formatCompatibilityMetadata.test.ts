import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import {
  buildHydraulicValveBehaviorDescriptions,
  formatBehaviorDescriptionForUi,
} from '@/domain/canonical/hydraulicValve/hydraulicValveBehaviorDescriptions';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import {
  buildCompatibilityMetadataFootnote,
  buildLegacyMatchScoreFootnote,
  CATALOG_SUPPORTED_MATCH_FOOTNOTE_TR,
  formatCompatibilityLevelLabel,
  formatCompatibilityMetadataLines,
  formatCompatibilityWarningForUi,
  formatConfidenceLevelLabel,
  formatDataCompletenessLabel,
  formatEquivalenceStatusLabel,
  isCatalogReviewWarning,
} from '@/domain/presentation/formatCompatibilityMetadata';
import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

const REXROTH = '4WE6E-6X/EG24N9K4';
const YUKEN = 'DSG-01-3C2-D24-N1-70';

describe('formatCompatibilityMetadata', () => {
  it('maps metadata levels to Kaynak güveni / Veri kapsamı labels', () => {
    expect(formatCompatibilityLevelLabel('high')).toBe('Uyumluluk: Yüksek');
    expect(formatConfidenceLevelLabel('high')).toBe('Kaynak güveni: Yüksek');
    expect(formatDataCompletenessLabel('medium')).toBe('Veri kapsamı: Orta');
    expect(
      formatCompatibilityMetadataLines({
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'medium',
      })
    ).toEqual([
      'Uyumluluk: Yüksek',
      'Kaynak güveni: Yüksek',
      'Veri kapsamı: Orta',
    ]);
    expect(
      formatCompatibilityMetadataLines({
        compatibilityLevel: 'high',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      }).join(' ')
    ).not.toContain('Güven: Orta');
  });

  it('high compatibility status label is positive, not Orta risk', () => {
    expect(
      formatEquivalenceStatusLabel({
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      })
    ).toBe('Yüksek uyum');
    expect(
      formatEquivalenceStatusLabel(
        {
          compatibilityLevel: 'high',
          confidenceLevel: 'high',
          dataCompleteness: 'medium',
        },
        { hasCheckItems: true }
      )
    ).toBe('Yüksek uyum · Kontrol gerekli');
    expect(
      formatEquivalenceStatusLabel({
        compatibilityLevel: 'high',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      })
    ).toBe('Yüksek uyum · Kontrol gerekli');
    expect(
      formatEquivalenceStatusLabel({
        compatibilityLevel: 'high',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      })
    ).not.toContain('Orta risk');
  });

  it('not_compatible maps to Uyumsuz', () => {
    expect(
      formatEquivalenceStatusLabel({
        compatibilityLevel: 'not_compatible',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      })
    ).toBe('Uyumsuz');
  });

  it('medium compatibility maps to Orta uyum · Kontrol gerekli', () => {
    expect(
      formatEquivalenceStatusLabel({
        compatibilityLevel: 'medium',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      })
    ).toBe('Orta uyum · Kontrol gerekli');
  });

  it('high compatibility + medium legacy % produces score footnote', () => {
    expect(
      buildLegacyMatchScoreFootnote(
        {
          compatibilityLevel: 'high',
          confidenceLevel: 'high',
          dataCompleteness: 'medium',
        },
        'medium'
      )
    ).toMatch(/Yüzde skoru kontrol gerektiren/i);
    expect(
      buildLegacyMatchScoreFootnote(
        {
          compatibilityLevel: 'high',
          confidenceLevel: 'high',
          dataCompleteness: 'high',
        },
        'high'
      )
    ).toBeNull();
  });

  it('high compatibility footnote uses catalog-supported wording', () => {
    const footnote = buildCompatibilityMetadataFootnote(
      {
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'medium',
      },
      { hasCheckItems: true }
    );
    expect(footnote).toBe(CATALOG_SUPPORTED_MATCH_FOOTNOTE_TR);
    expect(footnote).not.toMatch(/Güven veya veri tamamlığı daha düşük/i);
  });

  it('catalog review warnings are labeled without implying mismatch', () => {
    const warning =
      'Sürgü merkez davranışı eşleşmesi, inceleme gerektiren katalog aday verisindeki port durumlarına dayanır';
    expect(isCatalogReviewWarning(warning)).toBe(true);
    const formatted = formatCompatibilityWarningForUi(warning);
    expect(formatted.title).toBe(GENERAL_ORDER_CATALOG_WARNING_TR);
    expect(formatted.isCatalogReview).toBe(true);
  });
});

describe('compareProducts UI data (Phase F)', () => {
  function comparePair() {
    const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const series = getProductSeriesById('yuken_dsg01')!;
    return compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: YUKEN,
      targetIdentification: identifyProduct(YUKEN, normalizeCode(YUKEN)),
    });
  }

  it('main pair: high source confidence, no Orta risk label, high match %', () => {
    const result = comparePair();

    expect(result.metadata?.compatibilityLevel).toBe('high');
    expect(result.metadata?.confidenceLevel).toBe('high');
    expect(result.different).toHaveLength(0);

    const statusLabel = formatEquivalenceStatusLabel(result.metadata!, {
      hasCheckItems: result.checkItems.length > 0,
    });
    expect(statusLabel).not.toContain('Orta risk');
    expect(statusLabel).toMatch(/Yüksek uyum/);

    const match = calculateMatchPercentage(result);
    expect(match.percentage).toBeGreaterThanOrEqual(70);
    expect(match.level).toBe('high');

    expect(
      formatCompatibilityMetadataLines(result.metadata!).join(' ')
    ).toContain('Kaynak güveni: Yüksek');
    expect(
      formatCompatibilityMetadataLines(result.metadata!).join(' ')
    ).not.toContain('Güven: Orta');
  });

  it('main pair exposes metadata and keeps spool compatible (not different)', () => {
    const result = comparePair();

    const spool = [...result.compatible, ...result.different].find(
      (c) => c.label === FIELD_LABELS.spoolFunctionCode
    );
    expect(spool?.status).toBe('compatible');
    expect(result.warnings).toContain(GENERAL_ORDER_CATALOG_WARNING_TR);
  });

  it('known voltage mismatch: not_compatible but source confidence can stay high', () => {
    const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D12-N1-70';
    const result = compareProducts(source, {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    });

    expect(result.different.some((c) => c.label === FIELD_LABELS.coilVoltage)).toBe(true);
    expect(result.metadata?.compatibilityLevel).toBe('not_compatible');
    expect(result.metadata?.confidenceLevel).toBe('high');
    expect(formatEquivalenceStatusLabel(result.metadata!)).toBe('Uyumsuz');
  });

  it('product detail uses resolved voltage primary with raw token evidence', () => {
    const id = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const profile = buildHydraulicValveCanonicalProfile({
      identification: id,
      attributes: getTechnicalAttributes(id),
    });
    const voltageDesc = buildHydraulicValveBehaviorDescriptions({
      identification: id,
      attributes: getTechnicalAttributes(id),
    }).find((d) => d.title === 'Bobin voltajı');

    expect(voltageDesc).toBeDefined();
    expect(voltageDesc!.primaryDescription).toMatch(/24.*V.*DC/i);
    expect(voltageDesc!.primaryDescription).not.toBe('G24');
    expect(formatBehaviorDescriptionForUi(voltageDesc!)).toMatch(/24.*V.*DC/i);
    expect(profile.coilVoltage.catalogEvidence?.displayCandidate).toMatch(/24/i);
  });
});
