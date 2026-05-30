import { useCallback, useEffect, useState } from 'react';

import { normalizeCode } from '@/domain/resolver/normalizeCode';
import {
  compareProductsResolved,
  isBackendResolverMode,
  mapResolverApiErrorMessage,
} from '@/services/resolverService';
import type { CompatibilityResult } from '@/types/compatibility';

export function useBackendCompareLoader(sourceCode: string) {
  const [compareByKey, setCompareByKey] = useState<Record<string, CompatibilityResult>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCompare = useCallback(
    async (candidateCode: string, rowKey: string) => {
      if (!isBackendResolverMode()) {
        return null;
      }
      if (compareByKey[rowKey]) {
        return compareByKey[rowKey]!;
      }

      setLoadingKey(rowKey);
      setErrorMessage(null);

      try {
        const result = await compareProductsResolved(sourceCode, candidateCode);
        setCompareByKey((current) => ({ ...current, [rowKey]: result }));
        return result;
      } catch (error) {
        setErrorMessage(mapResolverApiErrorMessage(error));
        return null;
      } finally {
        setLoadingKey(null);
      }
    },
    [compareByKey, sourceCode]
  );

  useEffect(() => {
    setCompareByKey({});
    setLoadingKey(null);
    setErrorMessage(null);
  }, [sourceCode]);

  const resolveDisplayResult = useCallback(
    (result: CompatibilityResult, rowKey: string): CompatibilityResult => {
      return compareByKey[rowKey] ?? result;
    },
    [compareByKey]
  );

  const candidateCodeForResult = useCallback((result: CompatibilityResult): string | null => {
    const fromSuggested = result.candidate.suggestedCode?.trim();
    if (fromSuggested) {
      return fromSuggested;
    }
    const fromId = result.candidate.targetIdentification?.normalizedCode;
    if (fromId?.trim()) {
      return normalizeCode(fromId);
    }
    return null;
  }, []);

  return {
    compareByKey,
    loadingKey,
    errorMessage,
    loadCompare,
    resolveDisplayResult,
    candidateCodeForResult,
  };
}
