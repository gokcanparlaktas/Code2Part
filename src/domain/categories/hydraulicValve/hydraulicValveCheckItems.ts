import type { CheckItem } from '@/types/compatibility';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

const HYDRAULIC_VALVE_BASE_CHECK_ITEMS: Omit<
  CheckItem,
  'sourceValue' | 'targetValue'
>[] = [
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

export interface HydraulicValveDynamicCheckValues {
  spool?: {
    source: string;
    target: string;
    status: 'unknownOrCheck' | 'different' | 'compatible';
    reasonTr?: string;
  };
  voltage?: { source: string; target: string; status: 'unknownOrCheck' | 'different' | 'compatible' };
  connector?: { source: string; target: string; status: 'unknownOrCheck' | 'different' | 'compatible' };
}

export function getHydraulicValveCheckItems(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  dynamic: HydraulicValveDynamicCheckValues = {}
): CheckItem[] {
  const unknown = 'Ürün kodundan net okunamadı';

  const checks: CheckItem[] = [];

  if (dynamic.spool?.status === 'unknownOrCheck') {
    checks.push({
      field: 'Sürgü sembolü / fonksiyon',
      sourceValue: dynamic.spool.source,
      targetValue: dynamic.spool.target,
      reasonTr:
        dynamic.spool.reasonTr ??
        'Sürgü tipi ve sembolü ürün kodundan her zaman net okunamaz. Hidrolik şemada doğrulanmalıdır.',
      severity: 'high',
    });
  }

  if (dynamic.voltage?.status === 'unknownOrCheck') {
    checks.push({
      field: 'Bobin voltajı',
      sourceValue: dynamic.voltage.source,
      targetValue: dynamic.voltage.target,
      reasonTr:
        'Bobin voltajı ve bağlantı tipi sipariş öncesi mutlaka kontrol edilmelidir.',
      severity: 'high',
    });
  }

  if (dynamic.connector?.status === 'unknownOrCheck') {
    checks.push({
      field: 'Konnektör tipi',
      sourceValue: dynamic.connector.source,
      targetValue: dynamic.connector.target,
      reasonTr: 'Konnektör ve bobin bağlantısı seri ve üreticiye göre değişebilir.',
      severity: 'medium',
    });
  }

  checks.push(
    ...HYDRAULIC_VALVE_BASE_CHECK_ITEMS.map((item) => ({
      ...item,
      sourceValue: unknown,
      targetValue: unknown,
    }))
  );

  // Still show the identification-level attributes in the check list if needed by UI.
  // (They are only used for display; actual compatibility is determined in comparisons.)
  if (dynamic.voltage?.status === 'unknownOrCheck') {
    // already present with dynamic values
  } else if (dynamic.voltage?.status === undefined) {
    // keep nothing
  }

  return checks;
}
