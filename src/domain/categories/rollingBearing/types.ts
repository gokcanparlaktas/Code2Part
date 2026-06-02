import type { CatalogCandidateConfidence } from '@/domain/catalogData/types';
import type { EvidenceLevel } from '@/types/product';

export type BearingBrandDetectionType =
  | 'explicit_brand_token'
  | 'suffix_hint'
  | 'ambiguous_common_suffix'
  | 'unknown';

export interface BearingRawToken {
  attributeKey: string;
  rawToken: string;
  position: number;
}

export interface BearingBrandDetection {
  manufacturer: string | null;
  brandAlias?: string | null;
  detectionType: BearingBrandDetectionType;
  confidence: CatalogCandidateConfidence;
  needsReview: boolean;
  hintManufacturers: string[];
  notesTr: string[];
}

export interface BearingSuffixResolution {
  rawToken: string;
  attributeKey: string;
  normalizedMeaning: string | null;
  variantGroupId?: string;
  sealShieldType?: string;
  sideCount?: number;
  confidence: CatalogCandidateConfidence;
  needsReview: boolean;
  isAmbiguousForBrand: boolean;
}

export interface BearingSeriesDetection {
  seriesGroup: string;
  seriesPrefix: string;
  bearingTypeKey: string;
  bearingTypeNameTr: string;
  confidence: CatalogCandidateConfidence;
  needsReview: boolean;
}

export type BearingDimensionsStatus =
  | 'complete'
  | 'dimensions_unknown_or_check'
  | 'bore_only';

export interface BearingDecodedDimensions {
  status: BearingDimensionsStatus;
  boreDiameterMm: number | null;
  outsideDiameterMm: number | null;
  widthMm: number | null;
  boreEvidence: EvidenceLevel;
  outsideDiameterEvidence: EvidenceLevel;
  widthEvidence: EvidenceLevel;
}

export interface BearingDecodedProfile {
  inputCode: string;
  normalizedCode: string;
  baseCode: string | null;
  seriesPrefix: string | null;
  boreCode: string | null;
  suffixBlock: string | null;
  rawTokens: BearingRawToken[];
  suffixResolutions: BearingSuffixResolution[];
  series: BearingSeriesDetection | null;
  brand: BearingBrandDetection;
  dimensions: BearingDecodedDimensions;
  internalClearance: string | null;
  decodeNotesTr: string[];
}

export interface BearingCodeSuggestion {
  manufacturer: string;
  brandAlias?: string;
  suggestedCode: string;
  generationStatus: 'generated_full' | 'generated_partial';
  requiresCheck: boolean;
  checkNotesTr: string[];
  suffixTokensUsed: string[];
}
