import { generateHydraulicValveCodes } from '@/domain/codeCreator/generateHydraulicValveCodes';
import { generatePneumaticCylinderCodes } from '@/domain/codeCreator/generatePneumaticCylinderCodes';
import type {
  CodeCreatorBrandKey,
  CodeCreatorCategoryKey,
  CodeCreatorSelections,
  HydraulicValveMountingGroupKey,
  ProductCodeCreatorResult,
} from '@/types/productCodeCreator';

export function generateProductCodes(options: {
  category: CodeCreatorCategoryKey;
  mountingGroup?: HydraulicValveMountingGroupKey;
  brandFilter?: CodeCreatorBrandKey | null;
  selections: CodeCreatorSelections;
}): ProductCodeCreatorResult {
  const brandFilter = options.brandFilter ?? null;

  if (options.category === 'hydraulic_valve') {
    const mountingGroup = options.mountingGroup ?? 'cetop_03_ng6';
    const { codes, checkNotes } = generateHydraulicValveCodes({
      mountingGroup,
      brandFilter,
      selections: options.selections,
    });

    return {
      category: options.category,
      mountingGroup,
      brandFilter,
      selections: options.selections,
      codes,
      checkNotes,
    };
  }

  const { codes, checkNotes } = generatePneumaticCylinderCodes({
    brandFilter,
    selections: options.selections,
  });

  return {
    category: options.category,
    brandFilter,
    selections: options.selections,
    codes,
    checkNotes,
  };
}
