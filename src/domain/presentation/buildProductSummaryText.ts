import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

function formatHydraulicSummary(identification: ProductIdentification): string {
  const brand = identification.brand.value ?? 'Bilinmiyor';
  const series = identification.series.value ?? '';
  const name = series ? `${brand} ${series}` : brand;

  const cetop =
    identification.cetopNgSize?.value ??
    identification.standardFamily.value ??
    null;

  if (cetop) {
    return `${name} · ${cetop}`;
  }

  return `${name} · CETOP/NG doğrulanamadı`;
}

function formatPneumaticSummary(identification: ProductIdentification): string {
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

export function buildProductSummaryText(identification: ProductIdentification): string {
  if (identification.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY) {
    return formatHydraulicSummary(identification);
  }

  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    return formatPneumaticSummary(identification);
  }

  const brand = identification.brand.value ?? 'Bilinmiyor';
  const series = identification.series.value ?? '';
  const name = series ? `${brand} ${series}` : brand;
  return name;
}
