import { useCallback, useState, useLayoutEffect } from 'react';

export function useChatDraft(chatId: string | null) {
  const storageKey = chatId ? `chat-draft-${chatId}` : 'chat-draft-new';
  const [draftValue, setDraftValueState] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Use useLayoutEffect to avoid flash - runs before paint
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) || '';
      setDraftValueState(stored);
      setIsInitialized(true);
    }
  }, [storageKey]);

  const setDraftValue = useCallback(
    (value: string) => {
      setDraftValueState(value);

      if (typeof window !== 'undefined') {
        if (value) {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    setDraftValueState('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    draftValue,
    setDraftValue,
    clearDraft,
    isInitialized, // Optional: for loading states
  };
}
