import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { DiscoveredFileEntry, DiscoveryScopeConfig } from '../../lib/validations/discovery';
import type { AiLoggingService } from './lib/ai-logging-service';
import type { ApiKeyProvider } from './lib/provider-types';

import { IpcChannels } from './channels';
import { buildThinkingStreamOptions } from './lib/ai-utils';
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

export function registerAiDiscoveryHandlers(
  getMainWindow: () => BrowserWindow | null,
  loggingService: AiLoggingService
): void {
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

      // Start logging operation (outside try block so it's accessible in catch)
      const logResult = loggingService.startOperation({
        featureRequestId: request.featureRequestId,
        modelId,
        requestBody: request,
        workflowStep: 'discover',
      });
      const requestId = logResult?.requestId;

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
        const { createFileSearchTool } = await import('./lib/ai/tools/file-search-tool');
        const { createContentSearchTool } = await import('./lib/ai/tools/content-search-tool');
        const { createFileReadTool } = await import('./lib/ai/tools/file-read-tool');
        const { createProjectStructureTool } = await import('./lib/ai/tools/project-structure-tool');
        const { createRelatedFilesTool } = await import('./lib/ai/tools/related-files-tool');
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

        // Build repository path map for search tool
        const repositoryMap = new Map<number, string>();
        for (const repo of repositoryOverviews) {
          repositoryMap.set(repo.repositoryId, repo.repositoryPath);
        }

        // Create AI tools for codebase exploration
        const searchFilesTool = createFileSearchTool(repositoryMap, scopeConfig);
        const contentSearchTool = createContentSearchTool(repositoryMap, scopeConfig);
        const fileReadTool = createFileReadTool(repositoryMap);
        const projectStructureTool = createProjectStructureTool(repositoryMap);
        const relatedFilesTool = createRelatedFilesTool(repositoryMap);

        // Build the prompt with repository overviews
        const prompt = buildDiscoveryPrompt(
          featureRequestDescription,
          repositoryOverviews,
          clarificationContext,
          scopeConfig,
          customPrompt
        );

        // Check if the model supports thinking and build stream options
        // Only enable thinking when both the model supports it AND the user has enabled it
        const modelInfo = getModelInfo(modelId as `${ApiKeyProvider}:${string}`);
        const supportsThinking = modelInfo?.supportsThinking ?? false;
        const shouldEnableThinking = supportsThinking && enableThinking;
        const thinkingOptions = buildThinkingStreamOptions(
          provider as ApiKeyProvider,
          shouldEnableThinking,
          temperature,
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
          stopWhen: stepCountIs(10), // Allow multiple tool calls (search) before final discovery
          tools: {
            discoverFiles: discoveryTool,
            findRelatedFiles: relatedFilesTool,
            getProjectStructure: projectStructureTool,
            readFile: fileReadTool,
            searchContent: contentSearchTool,
            searchFiles: searchFilesTool,
          },
          ...thinkingOptions,
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

              // Complete logging operation
              if (requestId) {
                loggingService.completeOperation({
                  inputTokens: usage?.inputTokens,
                  outputTokens: usage?.outputTokens,
                  reasoningTokens: usage?.outputTokenDetails?.reasoningTokens,
                  requestId,
                });
              }
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

              // Log reasoning chunk
              if (requestId) {
                loggingService.recordStreamChunk({
                  content: part.text,
                  requestId,
                  type: 'reasoning',
                });
              }
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

              // Log text chunk
              if (requestId) {
                loggingService.recordStreamChunk({
                  content: part.text,
                  requestId,
                  type: 'text',
                });
              }
              break;

            case 'tool-call': {
              // Map tool names to progress descriptions
              const toolProgressMap: Record<string, { pct: number; step: string }> = {
                discoverFiles: { pct: 80, step: 'Compiling discovered files...' },
                findRelatedFiles: { pct: 60, step: 'Analyzing file relationships...' },
                getProjectStructure: { pct: 35, step: 'Exploring project structure...' },
                readFile: { pct: 55, step: 'Reading file contents...' },
                searchContent: { pct: 50, step: 'Searching file contents...' },
                searchFiles: { pct: 45, step: 'Searching for files...' },
              };

              const progress = toolProgressMap[part.toolName] ?? { pct: 50, step: 'Processing...' };

              // Send progress update when tool is being called
              mainWindow.webContents.send(IpcChannels.ai.discovery.stream, {
                progress: {
                  currentStep: progress.step,
                  percentage: progress.pct,
                },
                type: 'progress',
              } satisfies DiscoveryStreamChunk);
              chunk = {
                toolArgs: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                type: 'tool_call',
              };

              // Log tool call
              if (requestId) {
                loggingService.recordToolCall({
                  args: part.input,
                  requestId,
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                });
              }
              break;
            }

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

              // Log tool result
              if (requestId) {
                loggingService.recordToolResult({
                  requestId,
                  result: part.output,
                  toolCallId: part.toolCallId,
                });
              }

              // Also send as a result chunk for easier consumption IF it is the discovery tool
              if (part.toolName === 'discoverFiles') {
                chunk = {
                  toolResult: part.output as DiscoveryToolResultData,
                  type: 'result',
                };
              } else {
                // For other tools, we don't send a 'result' chunk that would trigger completion
                // We just continue the loop (the tool_result was already sent above)
                continue;
              }
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
          // Log cancellation as failure
          if (requestId) {
            loggingService.failOperation({
              error: 'Generation cancelled',
              requestId,
            });
          }
          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during file discovery';

        // Log the failure
        if (requestId) {
          loggingService.failOperation({
            error: errorMessage,
            requestId,
          });
        }

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
