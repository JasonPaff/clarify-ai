'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FileSearchProgress, FileSearchRequest, FileSearchResponse } from '@/types/electron';

import { useElectronFileSearch } from '../useElectron';

/**
 * File search mutation input
 */
interface FileSearchInput {
  repositories: Array<SearchRepository>;
  request: FileSearchRequest;
}

/**
 * File search state tracking
 */
interface FileSearchState {
  error: null | string;
  isSearching: boolean;
  progress: FileSearchProgress | null;
  response: FileSearchResponse | null;
}

/**
 * Repository info required for file search
 */
interface SearchRepository {
  id: number;
  name: string;
  path: string;
}

/**
 * Hook for executing file searches with progress tracking and cancellation support.
 *
 * Uses useMutation since search is an on-demand operation (not auto-fetching).
 * Provides progress state tracking during search and handles cancellation properly.
 *
 * @returns Object containing search mutation, cancel function, and progress state
 */
export function useFileSearch() {
  const { cancel, isElectron, search, subscribeToProgress } = useElectronFileSearch();

  // Track search state internally
  const [state, setState] = useState<FileSearchState>({
    error: null,
    isSearching: false,
    progress: null,
    response: null,
  });

  // Track whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track active subscription cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel any active search on unmount
      void cancel();
      // Cleanup subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [cancel]);

  // Mutation for executing the search
  const mutation = useMutation({
    mutationFn: async ({ repositories, request }: FileSearchInput): Promise<FileSearchResponse | null> => {
      if (!isElectron) {
        throw new Error('File search is only available in Electron');
      }

      if (repositories.length === 0) {
        throw new Error('No repositories provided for search');
      }

      // Cleanup previous subscription if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Subscribe to progress updates before starting search
      unsubscribeRef.current = subscribeToProgress((progress) => {
        if (isMountedRef.current) {
          setState((prev) => ({ ...prev, progress }));
        }
      });

      // Execute the search with guaranteed cleanup
      let result;
      try {
        result = await search(request, repositories);
      } finally {
        // Cleanup subscription after search completes or fails
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }

      if (!result.success) {
        throw new Error(result.error ?? 'Search failed');
      }

      return result.response ?? null;
    },
    onError: (error) => {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isSearching: false,
          progress: null,
        }));
      }
    },
    onMutate: () => {
      if (isMountedRef.current) {
        setState({
          error: null,
          isSearching: true,
          progress: null,
          response: null,
        });
      }
    },
    onSuccess: (response) => {
      if (isMountedRef.current) {
        setState({
          error: null,
          isSearching: false,
          progress: null,
          response,
        });
      }
    },
  });

  // Cancel function with cleanup
  const cancelSearch = useCallback(async () => {
    await cancel();

    // Cleanup subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (isMountedRef.current) {
      setState((prev) => ({
        ...prev,
        error: 'Search cancelled',
        isSearching: false,
        progress: null,
      }));
    }
  }, [cancel]);

  // Reset function to clear state
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({
        error: null,
        isSearching: false,
        progress: null,
        response: null,
      });
    }
    mutation.reset();
  }, [mutation]);

  return {
    /** Cancel the current search operation */
    cancel: cancelSearch,
    /** Error message if search failed */
    error: state.error,
    /** Whether the search is currently executing */
    isSearching: state.isSearching,
    /** The underlying mutation object for advanced usage */
    mutation,
    /** Current progress during search */
    progress: state.progress,
    /** Reset the search state */
    reset,
    /** Search results after completion */
    response: state.response,
    /** Execute a file search */
    search: mutation.mutate,
    /** Execute a file search (async version) */
    searchAsync: mutation.mutateAsync,
  };
}
