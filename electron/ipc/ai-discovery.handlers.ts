import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { DiscoveredFileEntry, DiscoveryScopeConfig } from '../../lib/validations/discovery';
import type { ApiKeyProvider } from './lib/provider-types';

import { IpcChannels } from './channels';
import { buildThinkingProviderOptions } from './lib/ai-utils';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

// Re-export DiscoveryScopeConfig from validations for backward compatibility
export type { DiscoveryScopeConfig } from '../../lib/validations/discovery';

/** A discovered file with metadata about the action needed (backward compatibility type) */
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
  maxTokens?: number;
  modelId: string; // Format: "provider:modelId"
  repositoryOverviews: Array<DiscoveryRepositoryOverview>;
  scopeConfig?: DiscoveryScopeConfig;
  temperature?: number;
  thinkingBudget?: number;
}

/** Repository overview data passed to file discovery */
export interface DiscoveryRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/** Stream chunk sent to renderer during file discovery */
export interface DiscoveryStreamChunk {
  content?: string;
  progress?: {
    currentStep?: string;
    percentage?: number;
  };
  toolArgs?: unknown;
  toolCallId?: string;
  toolName?: string;
  toolResult?: DiscoveryToolResultData;
  type:
    | 'error'
    | 'finish'
    | 'progress'
    | 'reasoning'
    | 'reasoning_end'
    | 'reasoning_start'
    | 'result'
    | 'text'
    | 'tool_call'
    | 'tool_result';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
}

/** Discovery tool result structure (matches the tool output) */
export interface DiscoveryToolResultData {
  additionalNotes?: string;
  completedAt: string;
  confidence: number;
  files: Array<DiscoveredFileEntry>;
  filesDiscovered: number;
  missingFiles: Array<string>;
  reasoning: string;
  suggestedNewFiles: Array<{ path: string; purpose: string }>;
  summary: string;
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

      const {
        clarificationContext,
        customPrompt,
        enableThinking = true,
        featureRequestDescription,
        maxTokens,
        modelId,
        repositoryOverviews,
        scopeConfig,
        temperature,
        thinkingBudget,
      } = request;

      // Validate request
      if (!featureRequestDescription) {
        return { error: 'Feature request description is required', success: false };
      }

      if (!repositoryOverviews || repositoryOverviews.length === 0) {
        return { error: 'At least one repository overview is required', success: false };
      }

      // Parse the model ID to get provider and model
      const { modelId: model, provider } = parseModelId(modelId);

      // Get the credentials for the provider
      const credentials = getProviderCredentials(provider);
      if (!credentials) {
        return { error: `No credentials configured for ${provider}`, success: false };
      }

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Send initial progress
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          progress: {
            currentStep: 'Initializing AI model...',
            percentage: 5,
          },
          type: 'progress',
        } satisfies DiscoveryStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { discoveryTool } = await import('../../lib/ai/tools/discovery-tool');
        const { buildDiscoveryPrompt } = await import('../../lib/ai/prompts/discovery');
        const { getModelInfo } = await import('../../lib/ai/models');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          progress: {
            currentStep: 'Building discovery prompt...',
            percentage: 15,
          },
          type: 'progress',
        } satisfies DiscoveryStreamChunk);

        // Build the prompt with repository overviews
        const prompt = buildDiscoveryPrompt(
          featureRequestDescription,
          repositoryOverviews,
          clarificationContext,
          scopeConfig,
          customPrompt
        );

        // Check if the model supports thinking and build provider options
        // Only enable thinking when both the model supports it AND the user has enabled it
        const modelInfo = getModelInfo(modelId as `${ApiKeyProvider}:${string}`);
        const supportsThinking = modelInfo?.supportsThinking ?? false;
        const shouldEnableThinking = supportsThinking && enableThinking;
        const providerOptions = buildThinkingProviderOptions(
          provider as ApiKeyProvider,
          shouldEnableThinking,
          thinkingBudget
        );

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
          progress: {
            currentStep: 'Analyzing repositories for relevant files...',
            percentage: 25,
          },
          type: 'progress',
        } satisfies DiscoveryStreamChunk);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          ...(maxTokens && { maxTokens }),
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          stopWhen: stepCountIs(2), // Allow tool call and response
          ...(temperature !== undefined && { temperature }),
          tools: {
            discoverFiles: discoveryTool,
          },
          ...(providerOptions && { providerOptions }),
        } as Parameters<typeof streamText>[0]);

        // Track progress through the stream
        let hasStartedAnalysis = false;

        // Process the stream and send chunks to renderer
        for await (const part of result.fullStream) {
          if (activeAbortController?.signal.aborted) {
            break;
          }

          let chunk: DiscoveryStreamChunk;

          switch (part.type) {
            case 'error':
              chunk = {
                content: String(part.error),
                type: 'error',
              };
              break;

            case 'finish': {
              const usage = part.totalUsage;
              chunk = {
                type: 'finish',
                usage: usage
                  ? {
                      inputTokens: usage.inputTokens ?? 0,
                      outputTokens: usage.outputTokens ?? 0,
                      reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? undefined,
                      totalTokens: usage.totalTokens ?? 0,
                    }
                  : undefined,
              };
              break;
            }

            case 'reasoning-delta':
              // Send progress update when reasoning starts
              if (!hasStartedAnalysis) {
                hasStartedAnalysis = true;
                mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the codebase...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies DiscoveryStreamChunk);
              }
              chunk = {
                content: part.text,
                type: 'reasoning',
              };
              break;

            case 'reasoning-end':
              chunk = { type: 'reasoning_end' };
              break;

            case 'reasoning-start':
              chunk = { type: 'reasoning_start' };
              break;

            case 'text-delta':
              // Send progress update when text output starts
              if (!hasStartedAnalysis) {
                hasStartedAnalysis = true;
                mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the codebase...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies DiscoveryStreamChunk);
              }
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            case 'tool-call':
              // Send progress update when tool is being called
              mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
                progress: {
                  currentStep: 'Compiling discovered files...',
                  percentage: 75,
                },
                type: 'progress',
              } satisfies DiscoveryStreamChunk);
              chunk = {
                toolArgs: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                type: 'tool_call',
              };
              break;

            case 'tool-result':
              // Send progress update when results are ready
              mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
                progress: {
                  currentStep: 'Processing discovery results...',
                  percentage: 90,
                },
                type: 'progress',
              } satisfies DiscoveryStreamChunk);

              // Send the tool result as both tool_result and result chunks
              // The tool_result contains the full structured data
              chunk = {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolResult: part.output as DiscoveryToolResultData,
                type: 'tool_result',
              };
              mainWindow.webContents.send(IpcChannels.ai.discovery.stream, chunk);

              // Also send as a result chunk for easier consumption
              chunk = {
                toolResult: part.output as DiscoveryToolResultData,
                type: 'result',
              };
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.discovery.stream, chunk);
        }

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
