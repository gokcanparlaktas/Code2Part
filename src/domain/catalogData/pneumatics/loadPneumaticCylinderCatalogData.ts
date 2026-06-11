/**
 * Read-only loaders for data/catalog-data/pneumatics/cylinders.
 * Do not mutate returned objects.
 */

import familyIndex from '../../../../data/catalog-data/pneumatics/cylinders/family-index.json';
import appCurrentSeriesCandidates from '../../../../data/catalog-data/pneumatics/cylinders/shared/app-current-series-candidates.json';
import commonAttributeCandidates from '../../../../data/catalog-data/pneumatics/cylinders/shared/common-attribute-candidates.json';
import standardFamilyCandidates from '../../../../data/catalog-data/pneumatics/cylinders/shared/standard-family-candidates.json';
import comparableOptionCandidates from '../../../../data/catalog-data/pneumatics/cylinders/shared/comparable-option-candidates.json';
import codeGenerationCandidates from '../../../../data/catalog-data/pneumatics/cylinders/shared/code-generation-candidates.json';
import festoParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/festo/parser-spec-candidate.json';
import smcParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/smc/parser-spec-candidate.json';
import parkerParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/parker/parser-spec-candidate.json';
import aventicsParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/aventics/parser-spec-candidate.json';
import norgrenParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/norgren/parser-spec-candidate.json';
import camozziParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/camozzi/parser-spec-candidate.json';
import airtacParserSpec from '../../../../data/catalog-data/pneumatics/cylinders/airtac/parser-spec-candidate.json';

export type PneumaticCylinderFamilyIndex = typeof familyIndex;
export type PneumaticAppCurrentSeriesCandidates = typeof appCurrentSeriesCandidates;
export type PneumaticCommonAttributeCandidates = typeof commonAttributeCandidates;
export type PneumaticStandardFamilyCandidates = typeof standardFamilyCandidates;
export type PneumaticComparableOptionCandidates = typeof comparableOptionCandidates;
export type PneumaticCodeGenerationCandidates = typeof codeGenerationCandidates;

export type PneumaticBrandParserSpec =
  | typeof festoParserSpec
  | typeof smcParserSpec
  | typeof parkerParserSpec
  | typeof aventicsParserSpec
  | typeof norgrenParserSpec
  | typeof camozziParserSpec
  | typeof airtacParserSpec;

const BRAND_PARSER_SPECS: PneumaticBrandParserSpec[] = [
  festoParserSpec,
  smcParserSpec,
  parkerParserSpec,
  aventicsParserSpec,
  norgrenParserSpec,
  camozziParserSpec,
  airtacParserSpec,
];

export function getPneumaticCylinderFamilyIndex(): PneumaticCylinderFamilyIndex {
  return familyIndex;
}

export function getPneumaticAppCurrentSeriesCandidates(): PneumaticAppCurrentSeriesCandidates {
  return appCurrentSeriesCandidates;
}

export function getPneumaticCommonAttributeCandidates(): PneumaticCommonAttributeCandidates {
  return commonAttributeCandidates;
}

export function getPneumaticStandardFamilyCandidates(): PneumaticStandardFamilyCandidates {
  return standardFamilyCandidates;
}

export function getPneumaticComparableOptionCandidates(): PneumaticComparableOptionCandidates {
  return comparableOptionCandidates;
}

export function getPneumaticCodeGenerationCandidates(): PneumaticCodeGenerationCandidates {
  return codeGenerationCandidates;
}

export function getPneumaticBrandParserSpecs(): PneumaticBrandParserSpec[] {
  return BRAND_PARSER_SPECS;
}
