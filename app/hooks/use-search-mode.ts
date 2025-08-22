import { useCallback, useState } from 'react';

const STORAGE_KEY = 'search-mode-enabled';

export function useSearchMode() {
  const [searchMode, setSearchModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const setSearchMode = useCallback((value: boolean) => {
    setSearchModeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value.toString());
    }
  }, []);

  const toggleSearchMode = useCallback(() => {
    setSearchMode(!searchMode);
  }, [searchMode, setSearchMode]);

  return {
    searchMode,
    setSearchMode,
    toggleSearchMode,
  };
}
