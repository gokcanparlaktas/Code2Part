import type { ProductResolverCategory } from '@/types/category';

export type ProductCompatibilityProfile = {
  productCategory: ProductResolverCategory;
  brand?: string;
  series?: string;
  attributes: Record<
    string,
    {
      label: string;
      value: string | number | boolean | null;
      /** User-facing primary text (canonical engineering meaning). */
      displayValue?: string;
      /** Machine-readable canonical key; `unknown` must never compare as compatible with itself. */
      canonicalKey?: string;
      canonicalValue?: string | number | boolean | null;
      rawTokenLabel?: string;
      rawValue?: string | number | boolean | null;
      rawToken?: string;
      manufacturer?: string;
      sourceDocument?: string;
      unit?: string;
      importance: 'critical' | 'important' | 'optional';
      evidence: 'code' | 'series_table' | 'standard' | 'inferred' | 'unknown';
      confidence: 'high' | 'medium' | 'low' | 'unknown';
      requiresCatalogCheck?: boolean;
      compareMode:
        | 'exact'
        | 'numeric'
        | 'same_or_check'
        | 'presence'
        | 'catalog_check'
        | 'ignore';
      notes?: string[];
    }
  >;
};

