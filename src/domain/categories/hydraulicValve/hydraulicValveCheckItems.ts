import type { CheckItem } from '@/types/compatibility';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

const HYDRAULIC_VALVE_CHECK_ITEMS: Omit<CheckItem, 'sourceValue' | 'targetValue'>[] = [
  {
    field: 'Sürgü sembolü / fonksiyon',
    reasonTr:
      'Sürgü tipi ve sembolü ürün kodundan her zaman net okunamaz. Hidrolik şemada doğrulanmalıdır.',
    severity: 'high',
  },
  {
    field: 'Bobin voltajı',
    reasonTr: 'Bobin voltajı ve bağlantı tipi sipariş öncesi mutlaka kontrol edilmelidir.',
    severity: 'high',
  },
  {
    field: 'Konnektör tipi',
    reasonTr: 'Konnektör ve bobin bağlantısı seri ve üreticiye göre değişebilir.',
    severity: 'medium',
  },
  {
    field: 'Manuel kumanda',
    reasonTr: 'Manuel kumanda veya mekanik kilit seçeneği kodda farklı ifade edilebilir.',
    severity: 'medium',
  },
  {
    field: 'Conta malzemesi',
    reasonTr: 'Conta malzemesi ve sıvı uyumu katalogdan doğrulanmalıdır.',
    severity: 'medium',
  },
  {
    field: 'Debi değeri',
    reasonTr: 'Nominal debi çalışma basıncına göre değişir; katalog değeri kontrol edilmelidir.',
    severity: 'medium',
  },
  {
    field: 'Basınç değeri',
    reasonTr: 'Maksimum çalışma basıncı uygulama koşullarına göre doğrulanmalıdır.',
    severity: 'high',
  },
  {
    field: 'Montaj arayüzü',
    reasonTr: 'CETOP/NG ölçüsü aynı olsa bile montaj yüzeyi detayları farklı olabilir.',
    severity: 'medium',
  },
];

export const HYDRAULIC_VALVE_WARNINGS = [
  'Hidrolik valflerde sembol, sürgü tipi ve bobin voltajı mutlaka kontrol edilmelidir.',
  'CETOP/NG ölçüsü aynı olsa bile tüm teknik özellikler birebir uyumlu olmayabilir.',
  'Basınç, debi, conta malzemesi ve bağlantı tipi katalogdan doğrulanmalıdır.',
];

export function getHydraulicValveCheckItems(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CheckItem[] {
  const unknown = 'Ürün kodundan net okunamadı';

  return HYDRAULIC_VALVE_CHECK_ITEMS.map((item) => {
    if (item.field === 'Bobin voltajı') {
      return {
        ...item,
        sourceValue: formatAttributeValue(source.valveCoilVoltage?.value ?? null),
        targetValue: formatAttributeValue(
          candidate.targetIdentification?.valveCoilVoltage?.value ?? null
        ),
      };
    }
    if (item.field === 'Sürgü sembolü / fonksiyon') {
      return {
        ...item,
        sourceValue: formatAttributeValue(source.valveSpoolFunction?.value ?? null),
        targetValue: formatAttributeValue(
          candidate.targetIdentification?.valveSpoolFunction?.value ?? null
        ),
      };
    }
    return {
      ...item,
      sourceValue: unknown,
      targetValue: unknown,
    };
  });
}
