import { useCallback, useState, useLayoutEffect } from 'react';

const STORAGE_KEY = 'search-mode-enabled';

export function useSearchMode() {
  const [searchMode, setSearchModeState] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Use useLayoutEffect to avoid flash - runs before paint
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) === 'true';
      setSearchModeState(stored);
      setIsInitialized(true);
    }
  }, []);

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
    isInitialized, // Optional: for loading states
  };
}
