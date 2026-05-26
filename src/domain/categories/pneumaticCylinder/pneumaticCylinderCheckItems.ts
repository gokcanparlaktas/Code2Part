import type { CheckItem } from '@/types/compatibility';
import type { CheckSeverity } from '@/types/compatibility';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

interface PneumaticCylinderCheckItemTemplate {
  field: string;
  sourceValue: string;
  targetValue: string;
  reasonTr: string;
  severity: CheckSeverity;
}

const PNEUMATIC_CYLINDER_CHECK_ITEM_TEMPLATES: PneumaticCylinderCheckItemTemplate[] =
  [
    {
      field: 'Mil ucu / diş',
      sourceValue: 'Ürün kodundan net okunamadı',
      targetValue: 'Ürün kodundan net okunamadı',
      reasonTr:
        'Mil ucu tipi ürün kodundan net okunamadı. Eski bağlantı elemanının yeni silindire uyup uymadığı kontrol edilmelidir.',
      severity: 'high',
    },
    {
      field: 'Port ölçüsü',
      sourceValue: 'Doğrulanmalı',
      targetValue: 'Doğrulanmalı',
      reasonTr:
        'Hava bağlantı ölçüsü seri ve çapa göre değişebilir. Sipariş öncesinde port ölçüsü doğrulanmalıdır.',
      severity: 'medium',
    },
    {
      field: 'Sensör uyumu',
      sourceValue: 'Marka bazında farklı olabilir',
      targetValue: 'Marka bazında farklı olabilir',
      reasonTr:
        'Her iki seri sensörlü kullanım için uygun olabilir, ancak sensör kanalı ve sensör modeli marka bazında farklılık gösterebilir.',
      severity: 'medium',
    },
    {
      field: 'Sönümleme seçeneği',
      sourceValue: 'Kodda farklı ifade edilebilir',
      targetValue: 'Kodda farklı ifade edilebilir',
      reasonTr:
        'Sönümleme seçeneği ürün kodunda farklı kodlarla ifade edilebilir. Aynı sönümleme tipi seçilmelidir.',
      severity: 'medium',
    },
    {
      field: 'Montaj aksesuarları',
      sourceValue: 'Marka bazında değişebilir',
      targetValue: 'Marka bazında değişebilir',
      reasonTr:
        'Standart aile aynı olsa bile ayak, flanş ve mafsal gibi aksesuarlar marka bazında değişebilir.',
      severity: 'medium',
    },
    {
      field: 'Üretici / seri farkı',
      sourceValue: 'Kaynak seri',
      targetValue: 'Hedef seri',
      reasonTr:
        'Farklı üretici ve seri kombinasyonları karşılaştırılıyor. Bağlantı, montaj ve aksesuar detayları marka bazında değişebilir.',
      severity: 'medium',
    },
  ];

export function getPneumaticCylinderCheckItems(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CheckItem[] {
  const sourceLabel = formatAttributeValue(source.brand.value, undefined);
  const targetLabel = `${candidate.brand} ${candidate.series}`;

  return PNEUMATIC_CYLINDER_CHECK_ITEM_TEMPLATES.map((item) => {
    if (item.field === 'Üretici / seri farkı') {
      return {
        field: item.field,
        sourceValue:
          source.brand.value && source.series.value
            ? `${source.brand.value} ${source.series.value}`
            : sourceLabel,
        targetValue: targetLabel,
        reasonTr: item.reasonTr,
        severity: item.severity,
      };
    }

    return {
      field: item.field,
      sourceValue: item.sourceValue,
      targetValue: item.targetValue,
      reasonTr: item.reasonTr,
      severity: item.severity,
    };
  });
}
