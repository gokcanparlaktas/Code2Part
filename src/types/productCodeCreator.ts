import type { ProductResolverCategory } from '@/types/category';

export type CodeCreatorCategoryKey = Extract<
  ProductResolverCategory,
  'hydraulic_valve' | 'pneumatic_cylinder'
>;

export type HydraulicValveMountingGroupKey = 'cetop_03_ng6' | 'cetop_05_ng10';

export type CodeCreatorBrandKey =
  | 'rexroth'
  | 'yuken'
  | 'vickers'
  | 'atos'
  | 'parker'
  | 'festo'
  | 'smc'
  | 'aventics'
  | 'airtac';

export type CodeCreatorFieldKey =
  | 'ways_positions'
  | 'center_condition'
  | 'coil_voltage'
  | 'manual_override'
  | 'connector_type'
  | 'design_series'
  | 'design_number'
  | 'bore'
  | 'stroke'
  | 'cushioning_type'
  | 'variant_suffix';

export interface CodeCreatorFieldOption {
  value: string;
  labelTr: string;
  isUncertain?: boolean;
}

export type CodeCreatorFieldControl = 'chips' | 'select';

export interface CodeCreatorFieldDefinition {
  key: CodeCreatorFieldKey;
  labelTr: string;
  options: CodeCreatorFieldOption[];
  required?: boolean;
  control?: CodeCreatorFieldControl;
  hintTr?: string;
}

export interface CodeCreatorCategoryDefinition {
  key: CodeCreatorCategoryKey;
  labelTr: string;
  descriptionTr: string;
  mountingGroups?: Array<{ key: HydraulicValveMountingGroupKey; labelTr: string }>;
  brands: Array<{ key: CodeCreatorBrandKey | null; labelTr: string }>;
}

export type CodeCreatorSelections = Partial<Record<CodeCreatorFieldKey, string | null>>;

export type GeneratedCodeStatus = 'generated_full' | 'generated_partial' | 'unsupported';

export interface GeneratedProductCode {
  brand: string;
  series: string;
  seriesId: string;
  code: string;
  status: GeneratedCodeStatus;
  notes: string[];
}

export interface ProductCodeCreatorResult {
  category: CodeCreatorCategoryKey;
  mountingGroup?: HydraulicValveMountingGroupKey;
  brandFilter: CodeCreatorBrandKey | null;
  selections: CodeCreatorSelections;
  codes: GeneratedProductCode[];
  checkNotes: string[];
}
