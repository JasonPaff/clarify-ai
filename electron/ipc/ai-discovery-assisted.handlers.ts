import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type {
  AiDiscoveryFileEntry,
  AiDiscoveryResult,
  FileTreePruneConfig,
} from '../../lib/validations/ai-discovery';
import type { ApiKeyProvider } from './lib/provider-types';

import { IpcChannels } from './channels';
import { buildThinkingProviderOptions } from './lib/ai-utils';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

// ============================================================================
// Request/Response Types
// ============================================================================

/** Request payload for generating AI-assisted file discovery */
export interface AiDiscoveryAssistedGenerateRequest {
  /** Optional clarification context from previous step */
  clarificationContext?: string;
  /** Custom prompt template override */
  customPrompt?: string;
  /** Whether to enable thinking/reasoning mode */
  enableThinking?: boolean;
  /** The feature request description */
  featureDescription: string;
  /** Feature request ID for context */
  featureRequestId: number;
  /** Pruned file tree string from the repository */
  fileTree: string;
  /** Maximum tokens for the response */
  maxTokens?: number;
  /** AI model ID in format "provider:modelId" */
  modelId: string;
  /** Configuration for file tree pruning (used for logging/tracking) */
  pruneConfig?: FileTreePruneConfig;
  /** Repository overview data */
  repositoryOverviews: Array<AiDiscoveryAssistedRepositoryOverview>;
  /** Temperature for response generation */
  temperature?: number;
  /** Thinking budget in tokens */
  thinkingBudget?: number;
  /** Optional user hints to guide discovery */
  userHints?: string;
}

/** Repository overview data passed to AI-assisted file discovery */
export interface AiDiscoveryAssistedRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/** Stream chunk sent to renderer during AI-assisted file discovery */
export interface AiDiscoveryAssistedStreamChunk {
  /** Text content for text/reasoning/error chunks */
  content?: string;
  /** Progress information */
  progress?: {
    currentStep?: string;
    percentage?: number;
  };
  /** Tool call arguments */
  toolArgs?: unknown;
  /** Tool call ID */
  toolCallId?: string;
  /** Tool name */
  toolName?: string;
  /** Tool result data */
  toolResult?: AiDiscoveryAssistedToolResultData;
  /** Chunk type */
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
  /** Token usage information */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
}

/** Tool result data structure matching AiDiscoveryResult */
export interface AiDiscoveryAssistedToolResultData {
  /** When the discovery was completed */
  completedAt: string;
  /** Discovered files with justifications */
  files: Array<AiDiscoveryFileEntry>;
  /** AI model used for this discovery */
  modelUsed?: string;
  /** AI-generated reasoning about the discovery approach */
  reasoning: string;
  /** AI-generated summary of what was discovered */
  summary: string;
  /** When the discovery was started */
  timestamp: string;
  /** Total number of files analyzed */
  totalFilesAnalyzed: number;
  /** Total number of relevant files discovered */
  totalFilesDiscovered: number;
}

// ============================================================================
// Active Request Tracking
// ============================================================================

/** Active abort controller for cancellation */
let activeAbortController: AbortController | null = null;

// ============================================================================
// Handler Registration
// ============================================================================

/**
 * Register AI-assisted discovery handlers.
 * These handlers provide streaming file discovery with AI-powered file tree analysis.
 *
 * @param getMainWindow - Function to get the main browser window for sending stream chunks
 */
export function registerAiDiscoveryAssistedHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Generate AI-assisted file discovery with streaming
  ipcMain.handle(
    IpcChannels.ai.aiDiscovery.generate,
    async (
      _event: IpcMainInvokeEvent,
      request: AiDiscoveryAssistedGenerateRequest
    ): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const {
        clarificationContext,
        customPrompt,
        enableThinking = true,
        featureDescription,
        fileTree,
        maxTokens,
        modelId,
        repositoryOverviews,
        temperature,
        thinkingBudget,
        userHints,
      } = request;

      // Validate request
      if (!featureDescription) {
        return { error: 'Feature description is required', success: false };
      }

      if (!fileTree) {
        return { error: 'File tree is required', success: false };
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
        mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
          progress: {
            currentStep: 'Initializing AI model...',
            percentage: 5,
          },
          type: 'progress',
        } satisfies AiDiscoveryAssistedStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { aiDiscoveryTool } = await import('../../lib/ai/tools/ai-discovery-tool');
        const { buildAiDiscoveryPrompt } = await import('../../lib/ai/prompts/ai-discovery');
        const { getModelInfo } = await import('../../lib/ai/models');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
          progress: {
            currentStep: 'Building discovery prompt...',
            percentage: 15,
          },
          type: 'progress',
        } satisfies AiDiscoveryAssistedStreamChunk);

        // Build the prompt with file tree and repository overviews
        const prompt = buildAiDiscoveryPrompt({
          clarificationContext,
          customPrompt,
          featureRequest: featureDescription,
          fileTree,
          repositoryOverviews,
          userHints,
        });

        // Check if the model supports thinking and build provider options
        const modelInfo = getModelInfo(modelId as `${ApiKeyProvider}:${string}`);
        const supportsThinking = modelInfo?.supportsThinking ?? false;
        const shouldEnableThinking = supportsThinking && enableThinking;
        const providerOptions = buildThinkingProviderOptions(
          provider as ApiKeyProvider,
          shouldEnableThinking,
          thinkingBudget
        );

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
          progress: {
            currentStep: 'Analyzing file tree for relevant files...',
            percentage: 25,
          },
          type: 'progress',
        } satisfies AiDiscoveryAssistedStreamChunk);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          ...(maxTokens && { maxTokens }),
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          stopWhen: stepCountIs(2), // Allow tool call and response
          ...(temperature !== undefined && { temperature }),
          tools: {
            discoverFiles: aiDiscoveryTool,
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

          let chunk: AiDiscoveryAssistedStreamChunk;

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
                mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the file tree...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies AiDiscoveryAssistedStreamChunk);
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
                mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the file tree...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies AiDiscoveryAssistedStreamChunk);
              }
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            case 'tool-call':
              // Send progress update when tool is being called
              mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
                progress: {
                  currentStep: 'Compiling discovered files with justifications...',
                  percentage: 75,
                },
                type: 'progress',
              } satisfies AiDiscoveryAssistedStreamChunk);
              chunk = {
                toolArgs: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                type: 'tool_call',
              };
              break;

            case 'tool-result':
              // Send progress update when results are ready
              mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
                progress: {
                  currentStep: 'Processing discovery results...',
                  percentage: 90,
                },
                type: 'progress',
              } satisfies AiDiscoveryAssistedStreamChunk);

              // Send the tool result as both tool_result and result chunks
              chunk = {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolResult: part.output as AiDiscoveryAssistedToolResultData,
                type: 'tool_result',
              };
              mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, chunk);

              // Also send as a result chunk for easier consumption
              chunk = {
                toolResult: part.output as AiDiscoveryAssistedToolResultData,
                type: 'result',
              };
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, chunk);
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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during AI-assisted file discovery';

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.aiDiscovery.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies AiDiscoveryAssistedStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing AI-assisted file discovery
  ipcMain.handle(IpcChannels.ai.aiDiscovery.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}

// ============================================================================
// Type Re-exports
// ============================================================================

// Re-export validation types for convenience
export type { AiDiscoveryFileEntry, AiDiscoveryResult, FileTreePruneConfig };
