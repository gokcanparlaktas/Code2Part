import { useEffect, useState } from 'react';

import {
  mapResolverApiErrorMessage,
  resolveProductSearchResolved,
  type ResolvedProductSearch,
} from '@/services/resolverService';

export interface UseResolvedProductSearchState {
  loading: boolean;
  errorMessage: string | null;
  data: ResolvedProductSearch | null;
}

export function useResolvedProductSearch(inputCode: string): UseResolvedProductSearchState {
  const [state, setState] = useState<UseResolvedProductSearchState>({
    loading: Boolean(inputCode.trim()),
    errorMessage: null,
    data: null,
  });

  useEffect(() => {
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setState({ loading: false, errorMessage: null, data: null });
      return;
    }

    let cancelled = false;
    setState({ loading: true, errorMessage: null, data: null });

    void resolveProductSearchResolved(trimmed)
      .then((data) => {
        if (!cancelled) {
          setState({ loading: false, errorMessage: null, data });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            loading: false,
            errorMessage: mapResolverApiErrorMessage(error),
            data: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inputCode]);

  return state;
}
