import {
  buildHydraulicCenterTypeCatalogOptions,
  formatVickersOrderingFunctionCode,
  serializePortStateKey,
  type HydraulicCenterTypeOption,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import type { HydraulicEquivalentTokens } from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import type { CanonicalValveFunctionId } from '@/domain/categories/hydraulicValve/functionMappings/canonicalValveFunctions';
import { getCatalogFunctionMappings } from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  isRexrothWE6SoftTransitionOrderingToken,
  isRexrothWEOrderingSpoolSymbol,
  rexrothWE6BehaviorLookupToken,
  rexrothWE6OrderingSpoolTokenForEquivalent,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import { parseVickersDG4VSpoolFunctionCode } from '@/domain/categories/hydraulicValve/manufacturers/vickers/vickersDG4VSemantics';
import type { CatalogPortState } from '@/domain/catalogData/types';

export type SpoolBrand = 'rexroth' | 'yuken' | 'vickers';

const YUKEN_DSG_ORDERING_FUNCTION_PATTERN = /^[0-9][CBD]\d{1,2}$/i;

function isYukenDsgOrderingFunctionToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && YUKEN_DSG_ORDERING_FUNCTION_PATTERN.test(token.trim()));
}

function isVickersOrderingFunctionToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && /^\d{1,3}[ABCD]$/i.test(token.trim()));
}

function isEatonSpoolTypeToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim() && /^\d{1,3}$/.test(token.trim()));
}

function brandLabel(brand: SpoolBrand): string {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function normalizeRexrothLookupToken(token: string): string {
  const upper = token.trim().toUpperCase();
  const ordering = rexrothWE6OrderingSpoolTokenForEquivalent(upper);
  if (ordering) {
    return ordering;
  }
  return rexrothWE6BehaviorLookupToken(upper) ?? upper;
}

function optionsWithPortState(portState: CatalogPortState): HydraulicCenterTypeOption[] {
  const portKey = serializePortStateKey(portState);
  return buildHydraulicCenterTypeCatalogOptions().filter(
    (entry) => entry.portState && serializePortStateKey(entry.portState) === portKey
  );
}

function centerConditionToCanonicalFunction(
  centerCondition: string | null | undefined
): CanonicalValveFunctionId | null {
  switch (centerCondition) {
    case 'closed_center':
      return 'closed_center_4_3';
    case 'tandem_center':
      return 'tandem_center_4_3';
    case 'open_center':
      return 'open_center_4_3';
    case 'partially_open':
      return 'partially_open_4_3';
    default:
      return null;
  }
}

function findRexrothEquivalencyOptionForSoftTransition(
  orderingToken: string
): HydraulicCenterTypeOption | null {
  const mapping = getCatalogFunctionMappings().find(
    (entry) =>
      entry.manufacturer.toLowerCase() === 'rexroth' &&
      entry.token.trim().toUpperCase() === orderingToken.trim().toUpperCase()
  );
  if (!mapping) {
    return null;
  }

  const rexrothPeers = getCatalogFunctionMappings().filter(
    (entry) =>
      entry.manufacturer.toLowerCase() === 'rexroth' &&
      entry.canonicalFunctionId === mapping.canonicalFunctionId &&
      !isRexrothWE6SoftTransitionOrderingToken(entry.token)
  );

  for (const peer of rexrothPeers) {
    const siblingOption = buildHydraulicCenterTypeCatalogOptions().find(
      (entry) => entry.rexrothSpoolToken === peer.token.trim().toUpperCase()
    );
    if (siblingOption?.portState) {
      return siblingOption;
    }
  }

  return null;
}

function findCenterTypeOptionByRexrothSpool(rexrothSpoolToken: string): HydraulicCenterTypeOption | null {
  const token = normalizeRexrothLookupToken(rexrothSpoolToken);

  if (isRexrothWE6SoftTransitionOrderingToken(token)) {
    return findRexrothEquivalencyOptionForSoftTransition(token);
  }

  let option = buildHydraulicCenterTypeCatalogOptions().find(
    (entry) => entry.rexrothSpoolToken === token
  );
  if (!option && token === 'C') {
    option = findRexrothEquivalencyOptionForSoftTransition('C46');
  }
  return option ?? null;
}

function findSharedPortStateOption(
  sourceBrand: SpoolBrand,
  sourceToken: string
): HydraulicCenterTypeOption | null {
  const directByBrand: Record<
    SpoolBrand,
    (token: string) => HydraulicCenterTypeOption | null
  > = {
    rexroth: findCenterTypeOptionByRexrothSpool,
    yuken: findCenterTypeOptionByYukenFunctionDirect,
    vickers: findCenterTypeOptionByVickersToken,
  };

  const direct = directByBrand[sourceBrand](sourceToken);
  if (direct?.portState) {
    return direct;
  }

  const normalized = sourceToken.trim().toUpperCase();
  const sourceMapping = getCatalogFunctionMappings().find(
    (entry) =>
      entry.manufacturer.toLowerCase() === sourceBrand &&
      entry.token.trim().toUpperCase() === normalized
  );
  if (!sourceMapping) {
    return null;
  }

  const peerBrands: SpoolBrand[] = ['rexroth', 'yuken', 'vickers'];
  for (const peerBrand of peerBrands) {
    if (peerBrand === sourceBrand) {
      continue;
    }

    const peers = getCatalogFunctionMappings().filter(
      (entry) =>
        entry.manufacturer.toLowerCase() === peerBrand &&
        entry.canonicalFunctionId === sourceMapping.canonicalFunctionId
    );

    for (const peer of peers) {
      const peerOption = directByBrand[peerBrand](peer.token);
      if (peerOption?.portState) {
        return peerOption;
      }
    }
  }

  return null;
}

function findCenterTypeOptionByYukenFunctionDirect(
  yukenFunctionToken: string
): HydraulicCenterTypeOption | null {
  const token = yukenFunctionToken.trim().toUpperCase();
  return (
    buildHydraulicCenterTypeCatalogOptions().find(
      (entry) => entry.yukenFunctionToken?.trim().toUpperCase() === token
    ) ?? null
  );
}

function findCenterTypeOptionByYukenFunction(
  yukenFunctionToken: string
): HydraulicCenterTypeOption | null {
  return (
    findCenterTypeOptionByYukenFunctionDirect(yukenFunctionToken) ??
    findSharedPortStateOption('yuken', yukenFunctionToken)
  );
}

function findCenterTypeOptionByVickersToken(vickersToken: string): HydraulicCenterTypeOption | null {
  const token = vickersToken.trim().toUpperCase();
  const options = buildHydraulicCenterTypeCatalogOptions();

  const byFunction = options.find(
    (entry) => entry.vickersFunctionToken?.trim().toUpperCase() === token
  );
  if (byFunction) {
    return byFunction;
  }

  const parsed = parseVickersDG4VSpoolFunctionCode(token);
  if (parsed) {
    const byParsedFunction = options.find(
      (entry) => entry.vickersFunctionToken?.trim().toUpperCase() === token
    );
    if (byParsedFunction) {
      return byParsedFunction;
    }

    const spoolType = parsed.spoolType.trim();
    return options.find((entry) => entry.vickersSpoolTypeToken?.trim() === spoolType) ?? null;
  }

  if (isEatonSpoolTypeToken(token)) {
    return options.find((entry) => entry.vickersSpoolTypeToken?.trim() === token) ?? null;
  }

  const mapping = getCatalogFunctionMappings().find(
    (entry) =>
      entry.manufacturer.toLowerCase() === 'vickers' &&
      entry.token.trim().toUpperCase() === token
  );
  if (mapping) {
    return (
      options.find(
        (entry) =>
          entry.vickersFunctionToken?.trim().toUpperCase() === mapping.token.toUpperCase() ||
          entry.vickersSpoolTypeToken?.trim() === mapping.token.replace(/[ABCD]$/i, '')
      ) ?? null
    );
  }

  return null;
}

/** Finds the merged catalog row for a source brand ordering token. */
export function findCenterTypeOptionBySourceToken(
  sourceBrand: SpoolBrand,
  sourceToken: string
): HydraulicCenterTypeOption | null {
  const token = sourceToken.trim();
  if (!token) {
    return null;
  }

  switch (sourceBrand) {
    case 'rexroth':
      return findCenterTypeOptionByRexrothSpool(token);
    case 'yuken':
      return findCenterTypeOptionByYukenFunction(token);
    case 'vickers':
      return findCenterTypeOptionByVickersToken(token);
    default:
      return null;
  }
}

function pickYukenOrderingToken(portState: CatalogPortState): string | null {
  const portKey = serializePortStateKey(portState);
  const matches = optionsWithPortState(portState);
  const ordering = matches.find((entry) =>
    isYukenDsgOrderingFunctionToken(entry.yukenFunctionToken)
  );
  if (ordering?.yukenFunctionToken) {
    return ordering.yukenFunctionToken.toUpperCase();
  }

  const directByBrand: Record<
    SpoolBrand,
    (token: string) => HydraulicCenterTypeOption | null
  > = {
    rexroth: findCenterTypeOptionByRexrothSpool,
    yuken: findCenterTypeOptionByYukenFunctionDirect,
    vickers: findCenterTypeOptionByVickersToken,
  };

  for (const mapping of getCatalogFunctionMappings()) {
    if (mapping.manufacturer.toLowerCase() !== 'yuken') {
      continue;
    }
    if (!isYukenDsgOrderingFunctionToken(mapping.token)) {
      continue;
    }

    const canonicalPeers = getCatalogFunctionMappings().filter(
      (entry) => entry.canonicalFunctionId === mapping.canonicalFunctionId
    );
    const sharesPortState = canonicalPeers.some((peer) => {
      const brand = peer.manufacturer.toLowerCase() as SpoolBrand;
      if (!directByBrand[brand]) {
        return false;
      }
      const peerOption = directByBrand[brand](peer.token);
      return (
        peerOption?.portState &&
        serializePortStateKey(peerOption.portState) === portKey
      );
    });

    if (sharesPortState) {
      return mapping.token.toUpperCase();
    }
  }

  return null;
}

function pickVickersOrderingToken(
  portState: CatalogPortState,
  _sourceRexrothToken?: string | null
): string | null {
  const portKey = serializePortStateKey(portState);
  const matches = optionsWithPortState(portState);
  const ordering = matches.find((entry) =>
    isVickersOrderingFunctionToken(entry.vickersFunctionToken)
  );
  if (ordering?.vickersFunctionToken) {
    return ordering.vickersFunctionToken.toUpperCase();
  }

  const spoolType = matches.find((entry) => entry.vickersSpoolTypeToken)?.vickersSpoolTypeToken;
  if (spoolType) {
    return formatVickersOrderingFunctionCode(spoolType, 'A');
  }

  for (const mapping of getCatalogFunctionMappings()) {
    if (mapping.manufacturer.toLowerCase() !== 'vickers') {
      continue;
    }
    if (!isVickersOrderingFunctionToken(mapping.token)) {
      continue;
    }

    const directByBrand: Record<
      SpoolBrand,
      (token: string) => HydraulicCenterTypeOption | null
    > = {
      rexroth: findCenterTypeOptionByRexrothSpool,
      yuken: findCenterTypeOptionByYukenFunctionDirect,
      vickers: findCenterTypeOptionByVickersToken,
    };

    const canonicalPeers = getCatalogFunctionMappings().filter(
      (entry) => entry.canonicalFunctionId === mapping.canonicalFunctionId
    );
    const sharesPortState = canonicalPeers.some((peer) => {
      const brand = peer.manufacturer.toLowerCase() as SpoolBrand;
      if (!directByBrand[brand]) {
        return false;
      }
      const peerOption = directByBrand[brand](peer.token);
      return (
        peerOption?.portState &&
        serializePortStateKey(peerOption.portState) === portKey
      );
    });

    if (sharesPortState) {
      return mapping.token.toUpperCase();
    }
  }

  return null;
}

function rankRexrothOrderingToken(token: string): number {
  const upper = token.trim().toUpperCase();
  if (isRexrothWE6SoftTransitionOrderingToken(upper)) {
    return 12;
  }
  if (upper.length === 1 && isRexrothWEOrderingSpoolSymbol(upper)) {
    return 10;
  }
  return upper.length === 1 ? 5 : 1;
}

function pickBestRexrothOrderingToken(candidates: Iterable<string>): string | null {
  const ranked = [...new Set([...candidates].map((token) => token.trim().toUpperCase()).filter(Boolean))].sort(
    (a, b) => rankRexrothOrderingToken(b) - rankRexrothOrderingToken(a)
  );
  const best = ranked[0];
  if (!best) {
    return null;
  }
  return rexrothWE6OrderingSpoolTokenForEquivalent(best) ?? best;
}

function pickRexrothOrderingToken(
  portState: CatalogPortState,
  sourceBrand?: SpoolBrand,
  sourceToken?: string | null
): string | null {
  const portKey = serializePortStateKey(portState);
  const matches = optionsWithPortState(portState);
  const candidates = new Set<string>();

  if (sourceBrand === 'rexroth' && sourceToken) {
    const normalized = normalizeRexrothLookupToken(sourceToken);
    const exact = matches.find((entry) => {
      const rowToken = entry.rexrothSpoolToken?.trim().toUpperCase();
      if (!rowToken) {
        return false;
      }
      return (
        rowToken === normalized ||
        rexrothWE6OrderingSpoolTokenForEquivalent(rowToken) === normalized
      );
    });
    if (exact?.rexrothSpoolToken) {
      return (
        rexrothWE6OrderingSpoolTokenForEquivalent(exact.rexrothSpoolToken) ??
        exact.rexrothSpoolToken
      );
    }
  }

  for (const entry of matches) {
    if (entry.rexrothSpoolToken) {
      candidates.add(entry.rexrothSpoolToken);
    }
  }

  if (sourceBrand && sourceToken) {
    const sourceMapping = getCatalogFunctionMappings().find(
      (entry) =>
        entry.manufacturer.toLowerCase() === sourceBrand &&
        entry.token.trim().toUpperCase() === sourceToken.trim().toUpperCase()
    );
    if (sourceMapping) {
      const rexrothPeers = getCatalogFunctionMappings().filter(
        (entry) =>
          entry.manufacturer.toLowerCase() === 'rexroth' &&
          entry.canonicalFunctionId === sourceMapping.canonicalFunctionId
      );
      let hasPortStateMatch = false;
      for (const peer of rexrothPeers) {
        const rexOption = findCenterTypeOptionByRexrothSpool(peer.token);
        if (
          rexOption?.portState &&
          serializePortStateKey(rexOption.portState) === portKey
        ) {
          hasPortStateMatch = true;
          if (!isRexrothWE6SoftTransitionOrderingToken(peer.token)) {
            candidates.add(peer.token);
          }
        }
      }
      if (hasPortStateMatch) {
        for (const peer of rexrothPeers) {
          if (isRexrothWE6SoftTransitionOrderingToken(peer.token)) {
            candidates.add(peer.token.trim().toUpperCase());
          }
        }
      }
    }
  }

  return pickBestRexrothOrderingToken(candidates);
}

function pickTargetTokenFromOption(
  option: HydraulicCenterTypeOption,
  targetBrand: SpoolBrand,
  sourceBrand?: SpoolBrand,
  sourceToken?: string | null
): string | null {
  if (!option.portState) {
    return null;
  }

  switch (targetBrand) {
    case 'rexroth':
      return pickRexrothOrderingToken(option.portState, sourceBrand, sourceToken);
    case 'yuken':
      return pickYukenOrderingToken(option.portState);
    case 'vickers':
      return pickVickersOrderingToken(option.portState);
    default:
      return null;
  }
}

function resolveTargetTokenViaCanonicalFunction(
  sourceOption: HydraulicCenterTypeOption,
  sourceBrand: SpoolBrand,
  sourceToken: string,
  targetBrand: SpoolBrand
): string | null {
  if (!sourceOption.portState) {
    return null;
  }

  const sourcePortKey = serializePortStateKey(sourceOption.portState);
  const sourceMapping = getCatalogFunctionMappings().find(
    (entry) =>
      entry.manufacturer.toLowerCase() === sourceBrand &&
      entry.token.trim().toUpperCase() === sourceToken.trim().toUpperCase()
  );

  const canonicalId =
    sourceMapping?.canonicalFunctionId ??
    centerConditionToCanonicalFunction(sourceOption.centerCondition);

  if (!canonicalId || canonicalId === 'unknown') {
    return null;
  }

  const targetCandidates = getCatalogFunctionMappings().filter(
    (entry) =>
      entry.manufacturer.toLowerCase() === targetBrand &&
      entry.canonicalFunctionId === canonicalId
  );

  for (const candidate of targetCandidates) {
    const targetOption = findCenterTypeOptionBySourceToken(targetBrand, candidate.token);
    if (!targetOption?.portState) {
      continue;
    }
    if (serializePortStateKey(targetOption.portState) !== sourcePortKey) {
      continue;
    }
    const picked = pickTargetTokenFromOption(
      targetOption,
      targetBrand,
      sourceBrand,
      sourceToken
    );
    if (picked) {
      return picked;
    }
  }

  return null;
}

/**
 * Resolves a target-brand spool/function ordering token from a source token via shared portState.
 * Returns null when catalog data does not link both sides — never guesses from pair tables.
 */
export function resolveTargetSpoolTokenByPortState(
  sourceBrand: SpoolBrand,
  sourceToken: string,
  targetBrand: SpoolBrand
): string | null {
  if (sourceBrand === targetBrand) {
    return sourceToken.trim().toUpperCase() || null;
  }

  const option = findSharedPortStateOption(sourceBrand, sourceToken);
  if (!option?.portState) {
    return null;
  }

  const fromPortState = pickTargetTokenFromOption(
    option,
    targetBrand,
    sourceBrand,
    sourceToken
  );
  if (fromPortState) {
    return fromPortState;
  }

  return resolveTargetTokenViaCanonicalFunction(option, sourceBrand, sourceToken, targetBrand);
}

function seriesIdToSpoolBrand(seriesId: string): SpoolBrand | null {
  if (
    seriesId === 'rexroth_3we6' ||
    seriesId === 'rexroth_4we6' ||
    seriesId === 'rexroth_4we10'
  ) {
    return 'rexroth';
  }
  if (seriesId === 'yuken_dsg01' || seriesId === 'yuken_dsg03') {
    return 'yuken';
  }
  if (seriesId === 'vickers_dg4v3' || seriesId === 'vickers_dg4v5') {
    return 'vickers';
  }
  return null;
}

function primarySourceSpoolToken(
  tokens: HydraulicEquivalentTokens,
  sourceBrand: SpoolBrand
): string | null {
  switch (sourceBrand) {
    case 'rexroth':
      return tokens.spoolSymbol ?? tokens.functionCode;
    case 'yuken':
      return tokens.functionCode ?? tokens.spoolSymbol;
    case 'vickers':
      return tokens.functionCode ?? tokens.spoolSymbol;
    default:
      return null;
  }
}

/** Resolves target spool token from extracted equivalent tokens and series ids. */
export function resolveTargetSpoolFromTokens(
  tokens: HydraulicEquivalentTokens,
  sourceSeriesId: string,
  targetBrand: SpoolBrand
): string | null {
  const sourceBrand = seriesIdToSpoolBrand(sourceSeriesId);
  if (!sourceBrand) {
    return null;
  }

  const sourceToken = primarySourceSpoolToken(tokens, sourceBrand);
  if (!sourceToken) {
    return null;
  }

  return resolveTargetSpoolTokenByPortState(sourceBrand, sourceToken, targetBrand);
}

export function hasPortStateSpoolMapping(
  sourceBrand: SpoolBrand,
  sourceToken: string,
  targetBrand: SpoolBrand
): boolean {
  return resolveTargetSpoolTokenByPortState(sourceBrand, sourceToken, targetBrand) !== null;
}
