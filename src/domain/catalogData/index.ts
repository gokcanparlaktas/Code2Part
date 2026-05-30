export * from '@/domain/catalogData/types';
export * from '@/domain/catalogData/loadCatalogData';
export * from '@/domain/catalogData/CatalogDataProvider';
export * from '@/domain/catalogData/context/buildResolverContext';
export { resolveVoltageCandidate } from '@/domain/catalogData/resolvers/resolveVoltageCandidate';
export { resolveMountingCandidate } from '@/domain/catalogData/resolvers/resolveMountingCandidate';
export { resolveConnectorCandidate } from '@/domain/catalogData/resolvers/resolveConnectorCandidate';
export {
  resolveSpoolCandidate,
  portStatesMatch,
} from '@/domain/catalogData/resolvers/resolveSpoolCandidate';
export { resolveTechnicalDataCandidate } from '@/domain/catalogData/resolvers/resolveTechnicalDataCandidate';
export type { TechnicalDataResolved } from '@/domain/catalogData/resolvers/resolveTechnicalDataCandidate';
export {
  formatFlowCandidateDisplay,
  formatPressureCandidateDisplay,
  flowToLpm,
  pressureToBar,
  pressuresEquivalentBar,
} from '@/domain/catalogData/technical/normalizeHydraulicTechnicalUnits';
