import cylinderCheckItemsData from '@/data/cylinderCheckItems.json';
import equivalenceProfilesData from '@/data/equivalenceProfiles.json';
import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  EquivalenceSummary,
  EquivalentCandidate,
  MatchLevelTr,
  RiskLevel,
} from '@/types/compatibility';
import type {
  CylinderCheckItemsRecord,
  EquivalenceProfileRecord,
  ProductIdentification,
  TechnicalAttribute,
} from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';
import { getProductSeriesById } from './identifyProduct';

const cylinderChecks = cylinderCheckItemsData as CylinderCheckItemsRecord;
const equivalenceProfiles = equivalenceProfilesData as EquivalenceProfileRecord[];

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function brandLabel(identification: ProductIdentification | null, fallback: string): string {
  if (!identification) {
    return fallback;
  }
  const brand = identification.brand.value ?? fallback;
  const series = identification.series.value ?? '';
  return series ? `${brand} ${series}` : brand;
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === 'string'
      ? { value: target, evidence: 'series_table', requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (source.requiresCheck || targetAttr.requiresCheck) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (
    source.evidence === 'unknown' ||
    targetAttr.evidence === 'unknown' ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (source.evidence === 'inferred' || targetAttr.evidence === 'inferred') {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (String(source.value) === String(targetAttr.value)) {
    return { label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  return { label, sourceDisplay, targetDisplay, status: 'different' };
}

function attributeCheckReason(label: string, status: AttributeComparison['status']): string {
  if (status === 'different') {
    return `${label} değerleri farklı görünüyor. Teknik şartname veya montaj çizimi ile doğrulayın.`;
  }
  if (label === 'Marka') {
    return 'Farklı üretici serileri karşılaştırılıyor. Bağlantı ve montaj detayları marka bazında değişebilir.';
  }
  if (label === 'Çap (bore)' || label === 'Strok') {
    return `${label} bilgisi ürün kodundan okunamadı veya eksik. Sipariş öncesinde ölçüler doğrulanmalıdır.`;
  }
  return `${label} için yeterli kesin bilgi yok. Sipariş öncesinde kontrol edilmelidir.`;
}

function attributeCheckSeverity(
  label: string,
  status: AttributeComparison['status']
): CheckItem['severity'] {
  if (label === 'Çap (bore)' || label === 'Strok') {
    return status === 'different' ? 'high' : 'medium';
  }
  if (label === 'Marka') {
    return 'medium';
  }
  return status === 'different' ? 'medium' : 'low';
}

function comparisonToCheckItem(
  comparison: AttributeComparison,
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CheckItem | null {
  if (comparison.status !== 'unknownOrCheck') {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: attributeCheckReason(comparison.label, comparison.status),
    severity: attributeCheckSeverity(comparison.label, comparison.status),
  };
}

function getCylinderCheckItems(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CheckItem[] {
  const sourceSeries = source.seriesId ? getProductSeriesById(source.seriesId) : undefined;
  const groupId = sourceSeries?.equivalenceGroupId;

  if (groupId !== cylinderChecks.equivalenceGroupId) {
    return [];
  }

  const sourceLabel = brandLabel(source, sourceSeries?.brand ?? 'Kaynak');
  const targetLabel = brandLabel(
    candidate.targetIdentification,
    candidate.brand
  );

  return cylinderChecks.items.map((item) => ({
    field: item.field,
    sourceValue: personalizeCheckValue(item.sourceValue, sourceLabel),
    targetValue: personalizeCheckValue(item.targetValue, targetLabel),
    reasonTr: item.reasonTr,
    severity: item.severity,
  }));
}

function personalizeCheckValue(template: string, seriesLabel: string): string {
  if (template.includes('marka')) {
    return template.replace('marka', seriesLabel);
  }
  return `${seriesLabel} — ${template}`;
}

function lookupEquivalenceSummary(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  compatibleCount: number,
  checkCount: number
): EquivalenceSummary {
  const profile = equivalenceProfiles.find(
    (p) =>
      p.sourceSeriesId === source.seriesId &&
      p.targetSeriesId === candidate.seriesId
  );

  if (profile) {
    return {
      matchLevelTr: profile.matchLevelTr,
      summaryTr: profile.summaryTr,
      riskLevel: profile.riskLevel,
    };
  }

  if (compatibleCount >= 4 && checkCount <= 2) {
    return {
      matchLevelTr: 'Yüksek uyumlu muadil adayı',
      summaryTr:
        'Temel teknik alanlar uyumlu görünüyor. Yine de sipariş öncesi bağlantı ve aksesuar detaylarını kontrol edin.',
      riskLevel: 'low',
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Benzer standart ailesinde muadil olabilir. Kodda okunamayan alanlar sipariş öncesi doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  return {
    matchLevelTr: 'Fonksiyonel alternatif',
    summaryTr:
      'Aynı işlevi görebilir ancak teknik uyum sınırlı. Detaylı mühendislik kontrolü önerilir.',
    riskLevel: 'high',
  };
}

function collectWarnings(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): string[] {
  const warnings: string[] = [];

  if (!candidate.suggestedCode) {
    warnings.push(
      'Önerilen karşılaştırma kodu oluşturulamadı. Çap ve strok değerleri kodda net okunmalıdır.'
    );
  }

  if (source.confidence !== 'high') {
    warnings.push(
      'Kaynak ürün tanımlamasının güven düzeyi yüksek değil. Sonuçları sipariş öncesi doğrulayın.'
    );
  }

  if (
    candidate.targetIdentification &&
    candidate.targetIdentification.confidence !== 'high'
  ) {
    warnings.push(
      `${candidate.brand} ${candidate.series} için önerilen kod tam doğrulanamadı.`
    );
  }

  return warnings;
}

export function compareProducts(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const comparisons: AttributeComparison[] = [
    compareAttribute('Standart ailesi', source.standardFamily, candidate.standardFamily),
    compareAttribute('Ürün tipi', source.productType, candidate.productType),
    compareAttribute(
      'Çap (bore)',
      source.bore,
      target?.bore ?? { value: null, evidence: 'unknown', requiresCheck: true }
    ),
    compareAttribute(
      'Strok',
      source.stroke,
      target?.stroke ?? { value: null, evidence: 'unknown', requiresCheck: true }
    ),
  ];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c, source, candidate))
    .filter((item): item is CheckItem => item !== null);

  const markaCheck: CheckItem | null =
    source.brand.value !== candidate.brand
      ? {
          field: 'Marka',
          sourceValue: displayAttribute(source.brand),
          targetValue: `${candidate.brand} ${candidate.series}`,
          reasonTr:
            'Farklı üretici serileri karşılaştırılıyor. Bağlantı, montaj ve aksesuar detayları marka bazında değişebilir.',
          severity: 'medium',
        }
      : null;

  const cylinderItems = getCylinderCheckItems(source, candidate);

  const checkItems = [
    ...attributeChecks,
    ...(markaCheck && !attributeChecks.some((c) => c.field === 'Marka') ? [markaCheck] : []),
    ...cylinderItems,
  ];

  const summary = lookupEquivalenceSummary(
    source,
    candidate,
    compatible.length,
    checkItems.length
  );

  const warnings = collectWarnings(source, candidate);

  return {
    candidate,
    summary,
    compatible,
    different,
    checkItems,
    warnings,
  };
}
