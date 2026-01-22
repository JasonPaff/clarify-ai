'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type {
  GlobalModelDefaults,
  GlobalModelDefaultsContextValue,
  GlobalStepModelDefaults,
} from '@/lib/ai/global-model-defaults';

import { useElectronStore } from '@/hooks/useElectron';
import { DEFAULT_GLOBAL_MODEL_DEFAULTS, GLOBAL_MODEL_DEFAULTS_STORAGE_KEY } from '@/lib/ai/global-model-defaults';

const GlobalModelDefaultsContext = createContext<GlobalModelDefaultsContextValue | undefined>(undefined);

type GlobalModelDefaultsProviderProps = RequiredChildren;

export function GlobalModelDefaultsProvider({ children }: GlobalModelDefaultsProviderProps) {
  const [defaults, setDefaultsState] = useState<GlobalModelDefaults>(DEFAULT_GLOBAL_MODEL_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const { get, set } = useElectronStore();

  // Load saved defaults from electron-store on mount
  useEffect(() => {
    async function loadDefaults() {
      const savedDefaults = await get<GlobalModelDefaults>(GLOBAL_MODEL_DEFAULTS_STORAGE_KEY);
      if (savedDefaults && typeof savedDefaults === 'object') {
        setDefaultsState(savedDefaults);
      }
      setIsLoaded(true);
    }
    void loadDefaults();
  }, [get]);

  // Update defaults for a specific step and persist to electron-store
  const setStepDefaults = useCallback(
    async (step: StepConfigurationStep, stepDefaults: GlobalStepModelDefaults) => {
      const newDefaults: GlobalModelDefaults = {
        ...defaults,
        [step]: {
          ...defaults[step],
          ...stepDefaults,
        },
      };
      setDefaultsState(newDefaults);
      await set(GLOBAL_MODEL_DEFAULTS_STORAGE_KEY, newDefaults);
    },
    [defaults, set]
  );

  // Replace all defaults and persist to electron-store
  const setDefaults = useCallback(
    async (newDefaults: GlobalModelDefaults) => {
      setDefaultsState(newDefaults);
      await set(GLOBAL_MODEL_DEFAULTS_STORAGE_KEY, newDefaults);
    },
    [set]
  );

  const value = useMemo<GlobalModelDefaultsContextValue>(
    () => ({
      defaults,
      isLoaded,
      setDefaults,
      setStepDefaults,
    }),
    [defaults, isLoaded, setDefaults, setStepDefaults]
  );

  // Prevent flash of wrong state by not rendering until loaded
  if (!isLoaded) {
    return null;
  }

  return <GlobalModelDefaultsContext.Provider value={value}>{children}</GlobalModelDefaultsContext.Provider>;
}

export function useGlobalModelDefaults(): GlobalModelDefaultsContextValue {
  const context = useContext(GlobalModelDefaultsContext);
  if (context === undefined) {
    throw new Error('useGlobalModelDefaults must be used within a GlobalModelDefaultsProvider');
  }
  return context;
}
