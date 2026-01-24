'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { RepositoryOverviewStreamChunk } from '@/types/electron';

import { useUpsertRepositoryOverview } from '@/hooks/queries/use-repository-overviews';
import { useToast } from '@/hooks/use-toast';
import { useElectronAiOverview } from '@/hooks/useElectron';

/**
 * Represents an active background overview generation session.
 */
interface BackgroundGenerationSession {
  /** Accumulated content from streaming */
  content: string;
  /** Custom prompt used for generation (empty string if default) */
  customPrompt: string;
  /** AI model ID used for generation */
  modelId: string;
  /** Repository ID being generated for */
  repositoryId: number;
  /** Repository name for display in notifications */
  repositoryName: string;
  /** Current status of the generation */
  status: 'error' | 'generating';
}

interface BackgroundOverviewGenerationContextValue {
  /**
   * Check if a repository has an active background generation.
   */
  hasActiveBackgroundGeneration: (repositoryId: number) => boolean;

  /**
   * Start a background generation session.
   * Called when user clicks "Continue in Background" in the confirmation dialog.
   */
  startBackgroundGeneration: (session: Omit<BackgroundGenerationSession, 'status'>) => void;
}

const BackgroundOverviewGenerationContext = createContext<BackgroundOverviewGenerationContextValue | undefined>(
  undefined
);

type BackgroundOverviewGenerationProviderProps = RequiredChildren;

export function BackgroundOverviewGenerationProvider({ children }: BackgroundOverviewGenerationProviderProps) {
  const [sessions, setSessions] = useState<Map<number, BackgroundGenerationSession>>(new Map());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  // Track repository IDs that have already had their finish/error events processed
  // to prevent duplicate side effects when React calls the state updater multiple times
  const processedEventsRef = useRef<Set<number>>(new Set());

  const { subscribeToStream } = useElectronAiOverview();
  const upsertOverview = useUpsertRepositoryOverview();
  const toast = useToast();

  // Handle stream chunks for background generations
  const handleStreamChunk = useCallback(
    (chunk: RepositoryOverviewStreamChunk) => {
      setSessions((prev) => {
        // Find any active generating session (there should only be one at a time)
        const activeSession = Array.from(prev.entries()).find(([, session]) => session.status === 'generating');

        if (!activeSession) {
          return prev;
        }

        const [repositoryId, session] = activeSession;
        const newSessions = new Map(prev);

        switch (chunk.type) {
          case 'error': {
            // Check if this event was already processed (React may call state updaters multiple times)
            if (!processedEventsRef.current.has(repositoryId)) {
              processedEventsRef.current.add(repositoryId);
              // Show error toast
              toast.error({
                description: chunk.content ?? 'An error occurred during generation',
                title: 'Generation Failed',
              });
            }
            // Remove the session
            newSessions.delete(repositoryId);
            break;
          }
          case 'finish': {
            // Check if this event was already processed (React may call state updaters multiple times)
            if (!processedEventsRef.current.has(repositoryId)) {
              processedEventsRef.current.add(repositoryId);
              // Auto-save the overview
              void upsertOverview
                .mutateAsync({
                  data: {
                    content: session.content,
                    generatedAt: new Date().toISOString(),
                    modelId: session.modelId,
                    promptUsed: session.customPrompt || 'default',
                  },
                  repositoryId,
                })
                .then(() => {
                  // Show success toast
                  toast.success({
                    description: `Overview for "${session.repositoryName}" has been saved.`,
                    title: 'Overview Generated',
                  });
                  // Clean up the processed event tracking
                  processedEventsRef.current.delete(repositoryId);
                })
                .catch((error: unknown) => {
                  // Show error toast if save fails
                  toast.error({
                    description: error instanceof Error ? error.message : 'Failed to save the overview',
                    title: 'Save Failed',
                  });
                  // Clean up the processed event tracking
                  processedEventsRef.current.delete(repositoryId);
                });
            }
            // Remove the session
            newSessions.delete(repositoryId);
            break;
          }
          // Ignore reasoning chunks for background generation
          case 'reasoning':
          case 'reasoning_end':
          case 'reasoning_start':
            break;
          case 'text': {
            // Accumulate text content
            if (chunk.content) {
              newSessions.set(repositoryId, {
                ...session,
                content: session.content + chunk.content,
              });
            }
            break;
          }
        }

        return newSessions;
      });
    },
    [toast, upsertOverview]
  );

  // Subscribe to stream events when we have active sessions
  useEffect(() => {
    const hasActiveSessions = Array.from(sessions.values()).some((s) => s.status === 'generating');

    if (hasActiveSessions && !unsubscribeRef.current) {
      unsubscribeRef.current = subscribeToStream(handleStreamChunk);
    } else if (!hasActiveSessions && unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessions, subscribeToStream, handleStreamChunk]);

  const hasActiveBackgroundGeneration = useCallback(
    (repositoryId: number): boolean => {
      const session = sessions.get(repositoryId);
      return session?.status === 'generating';
    },
    [sessions]
  );

  const startBackgroundGeneration = useCallback(
    (sessionData: Omit<BackgroundGenerationSession, 'status'>) => {
      // Clear any previous processed event tracking for this repository
      processedEventsRef.current.delete(sessionData.repositoryId);

      setSessions((prev) => {
        const newSessions = new Map(prev);
        newSessions.set(sessionData.repositoryId, {
          ...sessionData,
          status: 'generating',
        });
        return newSessions;
      });

      // Show info toast that generation continues in background
      toast.info({
        description: `Overview for "${sessionData.repositoryName}" will be saved automatically when complete.`,
        title: 'Generating in Background',
      });
    },
    [toast]
  );

  const value = useMemo<BackgroundOverviewGenerationContextValue>(
    () => ({
      hasActiveBackgroundGeneration,
      startBackgroundGeneration,
    }),
    [hasActiveBackgroundGeneration, startBackgroundGeneration]
  );

  return (
    <BackgroundOverviewGenerationContext.Provider value={value}>{children}</BackgroundOverviewGenerationContext.Provider>
  );
}

export function useBackgroundOverviewGeneration(): BackgroundOverviewGenerationContextValue {
  const context = useContext(BackgroundOverviewGenerationContext);
  if (context === undefined) {
    throw new Error('useBackgroundOverviewGeneration must be used within a BackgroundOverviewGenerationProvider');
  }
  return context;
}
