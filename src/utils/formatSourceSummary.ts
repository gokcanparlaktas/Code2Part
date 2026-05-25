import type { ProductIdentification } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

export function formatSourceSummary(identification: ProductIdentification): string {
  const brand = identification.brand.value ?? 'Bilinmiyor';
  const series = identification.series.value ?? '';
  const standard = identification.standardFamily.value ?? '—';

  const bore = identification.bore.value;
  const stroke = identification.stroke.value;
  const dimensions =
    bore !== null && stroke !== null
      ? `${formatAttributeValue(bore, identification.bore.unit)} x ${formatAttributeValue(stroke, identification.stroke.unit)}`
      : 'ölçü kontrol gerekli';

  const name = series ? `${brand} ${series}` : brand;
  return `${name} · ${standard} · ${dimensions}`;
}
