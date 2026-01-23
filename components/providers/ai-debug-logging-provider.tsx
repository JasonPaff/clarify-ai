'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AiLogConfig } from '@/types/ai-log';

import { useElectronAiDebugLogging } from '@/hooks/useElectron';
import { DEFAULT_AI_DEBUG_LOGGING_CONFIG } from '@/lib/ai/debug-logging/constants';

interface AiDebugLoggingContextValue {
  config: AiLogConfig;
  isEnabled: boolean;
  isLoading: boolean;
  setConfig: (config: AiLogConfig) => void;
  setIsEnabled: (isEnabled: boolean) => void;
}

const AiDebugLoggingContext = createContext<AiDebugLoggingContextValue | undefined>(undefined);

type AiDebugLoggingProviderProps = RequiredChildren;

export const AiDebugLoggingProvider = ({ children }: AiDebugLoggingProviderProps) => {
  const [config, setConfigState] = useState<AiLogConfig>(DEFAULT_AI_DEBUG_LOGGING_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const { getConfig, setConfig: persistConfig } = useElectronAiDebugLogging();

  // Load saved configuration from electron-store on mount
  useEffect(() => {
    async function loadConfig() {
      const savedConfig = await getConfig();
      if (savedConfig && typeof savedConfig === 'object') {
        setConfigState(savedConfig);
      }
      setIsLoaded(true);
    }
    void loadConfig();
  }, [getConfig]);

  // Persist configuration changes to electron-store
  const setConfig = useCallback(
    async (newConfig: AiLogConfig) => {
      setConfigState(newConfig);
      await persistConfig(newConfig);
    },
    [persistConfig]
  );

  // Convenience method for toggling enabled state
  const setIsEnabled = useCallback(
    (isEnabled: boolean) => {
      const newConfig = { ...config, enabled: isEnabled };
      void setConfig(newConfig);
    },
    [config, setConfig]
  );

  const value = useMemo<AiDebugLoggingContextValue>(
    () => ({
      config,
      isEnabled: config.enabled,
      isLoading: !isLoaded,
      setConfig: (newConfig: AiLogConfig) => void setConfig(newConfig),
      setIsEnabled,
    }),
    [config, isLoaded, setConfig, setIsEnabled]
  );

  // Prevent flash of wrong state by not rendering until loaded
  if (!isLoaded) {
    return null;
  }

  return <AiDebugLoggingContext.Provider value={value}>{children}</AiDebugLoggingContext.Provider>;
};

export const useAiDebugLogging = (): AiDebugLoggingContextValue => {
  const context = useContext(AiDebugLoggingContext);
  if (context === undefined) {
    throw new Error('useAiDebugLogging must be used within an AiDebugLoggingProvider');
  }
  return context;
};
