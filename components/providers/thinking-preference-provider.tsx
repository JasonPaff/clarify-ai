'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useElectronStore } from '@/hooks/useElectron';
import {
  DEFAULT_THINKING_PREFERENCE,
  THINKING_PREFERENCE_STORAGE_KEY,
  type ThinkingPreference,
} from '@/lib/ai/thinking-preference/constants';

interface ThinkingPreferenceContextValue {
  isThinkingEnabled: ThinkingPreference;
  setIsThinkingEnabled: (isEnabled: ThinkingPreference) => void;
}

const ThinkingPreferenceContext = createContext<ThinkingPreferenceContextValue | undefined>(undefined);

type ThinkingPreferenceProviderProps = RequiredChildren;

export function ThinkingPreferenceProvider({ children }: ThinkingPreferenceProviderProps) {
  const [isThinkingEnabled, setIsThinkingEnabledState] = useState<ThinkingPreference>(DEFAULT_THINKING_PREFERENCE);
  const [isLoaded, setIsLoaded] = useState(false);
  const { get, set } = useElectronStore();

  // Load saved preference from electron-store on mount
  useEffect(() => {
    async function loadPreference() {
      const savedPreference = await get<ThinkingPreference>(THINKING_PREFERENCE_STORAGE_KEY);
      if (typeof savedPreference === 'boolean') {
        setIsThinkingEnabledState(savedPreference);
      }
      setIsLoaded(true);
    }
    loadPreference();
  }, [get]);

  // Persist preference changes to electron-store
  const setIsThinkingEnabled = useCallback(
    async (isEnabled: ThinkingPreference) => {
      setIsThinkingEnabledState(isEnabled);
      await set(THINKING_PREFERENCE_STORAGE_KEY, isEnabled);
    },
    [set]
  );

  const value = useMemo<ThinkingPreferenceContextValue>(
    () => ({
      isThinkingEnabled,
      setIsThinkingEnabled,
    }),
    [isThinkingEnabled, setIsThinkingEnabled]
  );

  // Prevent flash of wrong state by not rendering until loaded
  if (!isLoaded) {
    return null;
  }

  return <ThinkingPreferenceContext.Provider value={value}>{children}</ThinkingPreferenceContext.Provider>;
}

export function useThinkingPreference(): ThinkingPreferenceContextValue {
  const context = useContext(ThinkingPreferenceContext);
  if (context === undefined) {
    throw new Error('useThinkingPreference must be used within a ThinkingPreferenceProvider');
  }
  return context;
}
