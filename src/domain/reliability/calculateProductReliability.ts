import { calculateHydraulicValveReliability } from '@/domain/categories/hydraulicValve/hydraulicValveReliability';
import { calculatePneumaticCylinderReliability } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderReliability';
import { calculateRollingBearingReliability } from '@/domain/categories/rollingBearing/rollingBearingReliability';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  ROLLING_BEARING_CATEGORY,
} from '@/types/category';
import type { ConfidenceLevel, ProductIdentification } from '@/types/product';
import { isLowConfidence } from '@/utils/confidenceScore';

export interface ProductReliabilityResult {
  confidence: ConfidenceLevel;
  isLowConfidence: boolean;
  warningTitleTr?: string;
  warningMessageTr?: string;
  seriesOnlyNoticeTr?: string;
}

export function calculateProductReliability(
  identification: ProductIdentification
): ProductReliabilityResult {
  if (identification.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY) {
    const result = calculatePneumaticCylinderReliability(identification);
    return { ...result, isLowConfidence: isLowConfidence(result.confidence) };
  }

  if (identification.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY) {
    const result = calculateHydraulicValveReliability(identification);
    return { ...result, isLowConfidence: isLowConfidence(result.confidence) };
  }

  if (identification.resolverCategoryKey === ROLLING_BEARING_CATEGORY) {
    const result = calculateRollingBearingReliability(identification);
    return { ...result, isLowConfidence: isLowConfidence(result.confidence) };
  }

  const confidence: ConfidenceLevel = identification.matched ? 'low' : 'unknown';
  return {
    confidence,
    isLowConfidence: isLowConfidence(confidence),
    warningTitleTr: identification.matched
      ? 'Bu sonuç sınırlı bilgiyle üretildi.'
      : 'Ürün tipi netleştirilemedi.',
    warningMessageTr: 'Katalog bilgileri kontrol edilmelidir.',
  };
}

