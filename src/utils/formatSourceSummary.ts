import { buildProductSummaryText } from '@/domain/presentation/buildProductSummaryText';
import type { ProductIdentification } from '@/types/product';

export function formatSourceSummary(identification: ProductIdentification): string {
  return buildProductSummaryText(identification);
}
