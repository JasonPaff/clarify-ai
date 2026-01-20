import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import { IpcChannels } from './channels';

/** A discovered file with metadata about the action needed */
export interface DiscoveredFile {
  action: 'create' | 'delete' | 'modify' | 'review';
  confidence: 'high' | 'low' | 'medium';
  dependencies?: Array<string>;
  filePath: string;
  reason: string;
  repositoryId: number;
  snippets?: Array<string>;
}

/** Request payload for generating file discovery */
export interface DiscoveryGenerateRequest {
  clarificationContext?: string;
  customPrompt?: string;
  enableThinking?: boolean;
  featureRequestDescription: string;
  featureRequestId: number;
  modelId: string; // Format: "provider:modelId"
  repositoryOverviews: Array<DiscoveryRepositoryOverview>;
  scopeConfig?: DiscoveryScopeConfig;
}

/** Repository overview data passed to file discovery */
export interface DiscoveryRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/** Scope configuration for file discovery */
export interface DiscoveryScopeConfig {
  excludePatterns?: Array<string>;
  includePatterns?: Array<string>;
  maxFiles?: number;
}

/** Stream chunk sent to renderer during file discovery */
export interface DiscoveryStreamChunk {
  content?: string;
  discoveredFiles?: Array<DiscoveredFile>;
  progress?: {
    currentStep?: string;
    percentage?: number;
  };
  type: 'error' | 'finish' | 'progress' | 'reasoning' | 'reasoning_end' | 'reasoning_start' | 'result' | 'text';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiDiscoveryHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Generate file discovery with streaming
  ipcMain.handle(
    IpcChannels.ai.discovery.generate,
    async (
      _event: IpcMainInvokeEvent,
      request: DiscoveryGenerateRequest
    ): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const { featureRequestDescription, repositoryOverviews } = request;

      // Validate request
      if (!featureRequestDescription) {
        return { error: 'Feature request description is required', success: false };
      }

      if (!repositoryOverviews || repositoryOverviews.length === 0) {
        return { error: 'At least one repository overview is required', success: false };
      }

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Send initial progress
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          progress: {
            currentStep: 'Analyzing repositories...',
            percentage: 10,
          },
          type: 'progress',
        } satisfies DiscoveryStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Simulate processing delay for placeholder
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          progress: {
            currentStep: 'Identifying relevant files...',
            percentage: 50,
          },
          type: 'progress',
        } satisfies DiscoveryStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Simulate more processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send mock discovered files result
        const mockDiscoveredFiles: Array<DiscoveredFile> = [
          {
            action: 'modify',
            confidence: 'high',
            dependencies: [],
            filePath: 'src/placeholder-file.ts',
            reason: 'This is a placeholder result. Real implementation will use AI to discover files.',
            repositoryId: repositoryOverviews[0]?.repositoryId ?? 0,
            snippets: [],
          },
        ];

        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          discoveredFiles: mockDiscoveredFiles,
          type: 'result',
        } satisfies DiscoveryStreamChunk);

        // Send finish chunk
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          type: 'finish',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        } satisfies DiscoveryStreamChunk);

        // Clean up
        activeAbortController = null;

        return { success: true };
      } catch (error) {
        activeAbortController = null;

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during file discovery';

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies DiscoveryStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing file discovery
  ipcMain.handle(IpcChannels.ai.discovery.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}
