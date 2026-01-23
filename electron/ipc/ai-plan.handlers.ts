import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { DiscoveredFileEntry } from '../../lib/validations/discovery';
import type { ImplementationPlan, PlanRisk, PlanStep, TestingStrategy } from '../../lib/validations/plan';
import type { ApiKeyProvider } from './lib/provider-types';

import { IpcChannels } from './channels';
import { buildThinkingStreamOptions } from './lib/ai-utils';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

// Re-export types from validations for backward compatibility
export type { ImplementationPlan, PlanRisk, PlanStep, QualityGate, TestingStrategy } from '../../lib/validations/plan';

/** Request payload for generating implementation plan */
export interface PlanGenerateRequest {
  clarificationContext?: string;
  customPrompt?: string;
  discoveredFiles: Array<DiscoveredFileEntry>;
  enableThinking?: boolean;
  featureRequestDescription: string;
  featureRequestId: number;
  maxTokens?: number;
  modelId: string; // Format: "provider:modelId"
  repositoryOverviews: Array<PlanRepositoryOverview>;
  scopeConfig?: PlanScopeConfig;
  temperature?: number;
  thinkingBudget?: number;
}

/** Repository overview data for plan generation */
export interface PlanRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/** Scope configuration for plan generation */
export interface PlanScopeConfig {
  /** Complexity threshold filter */
  complexityFilter?: 'all' | 'high' | 'low' | 'medium';
  /** Whether to include risk assessment */
  includeRiskAssessment?: boolean;
  /** Whether to include testing strategy */
  includeTestingStrategy?: boolean;
  /** Maximum number of steps to generate */
  maxSteps?: number;
  /** Specific repository IDs to focus on */
  repositoryIds?: Array<number>;
}

/** Stream chunk sent to renderer during plan generation */
export interface PlanStreamChunk {
  content?: string;
  plan?: ImplementationPlan;
  progress?: {
    currentStep?: string;
    percentage?: number;
  };
  toolArgs?: unknown;
  toolCallId?: string;
  toolName?: string;
  toolResult?: PlanToolResultData;
  type:
    | 'error'
    | 'finish'
    | 'plan'
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

/** Plan tool result structure (matches the tool output) */
export interface PlanToolResultData {
  completedAt: string;
  confidence: number;
  overview: string;
  prerequisites: Array<string>;
  reasoning: string;
  risks: Array<PlanRisk>;
  steps: Array<PlanStep>;
  stepsGenerated: number;
  summary: string;
  testingStrategy?: TestingStrategy;
  timestamp: string;
  totalFiles: number;
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiPlanHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Generate implementation plan with streaming
  ipcMain.handle(
    IpcChannels.ai.plan.generate,
    async (_event: IpcMainInvokeEvent, request: PlanGenerateRequest): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const {
        clarificationContext,
        customPrompt,
        discoveredFiles,
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

      if (!discoveredFiles || discoveredFiles.length === 0) {
        return { error: 'At least one discovered file is required', success: false };
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
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          progress: {
            currentStep: 'Initializing AI model...',
            percentage: 5,
          },
          type: 'progress',
        } satisfies PlanStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { planTool } = await import('../../lib/ai/tools/plan-tool');
        const { buildPlanPrompt } = await import('../../lib/ai/prompts/plan');
        const { getModelInfo } = await import('../../lib/ai/models');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Send progress update
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          progress: {
            currentStep: 'Building implementation plan prompt...',
            percentage: 15,
          },
          type: 'progress',
        } satisfies PlanStreamChunk);

        // Build the prompt with repository overviews and discovered files
        const prompt = buildPlanPrompt(
          featureRequestDescription,
          repositoryOverviews,
          clarificationContext,
          discoveredFiles,
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
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          progress: {
            currentStep: 'Analyzing discovered files and generating implementation plan...',
            percentage: 25,
          },
          type: 'progress',
        } satisfies PlanStreamChunk);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          ...(maxTokens && { maxTokens }),
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          stopWhen: stepCountIs(2), // Allow tool call and response
          tools: {
            generatePlan: planTool,
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

          let chunk: PlanStreamChunk;

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
                mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the codebase and planning implementation...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies PlanStreamChunk);
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
                mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
                  progress: {
                    currentStep: 'AI is analyzing the codebase and planning implementation...',
                    percentage: 40,
                  },
                  type: 'progress',
                } satisfies PlanStreamChunk);
              }
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            case 'tool-call':
              // Send progress update when tool is being called
              mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
                progress: {
                  currentStep: 'Generating implementation plan structure...',
                  percentage: 75,
                },
                type: 'progress',
              } satisfies PlanStreamChunk);
              chunk = {
                toolArgs: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                type: 'tool_call',
              };
              break;

            case 'tool-result': {
              // Send progress update when results are ready
              mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
                progress: {
                  currentStep: 'Processing implementation plan results...',
                  percentage: 90,
                },
                type: 'progress',
              } satisfies PlanStreamChunk);

              // Cast the tool output to our expected type
              const toolResultData = part.output as PlanToolResultData;

              // Send the tool result as both tool_result and plan chunks
              // The tool_result contains the full structured data
              chunk = {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolResult: toolResultData,
                type: 'tool_result',
              };
              mainWindow.webContents.send(IpcChannels.ai.plan.stream, chunk);

              // Also send as a plan chunk for easier consumption by the UI
              const plan = convertToolResultToPlan(toolResultData);
              chunk = {
                plan,
                type: 'plan',
              };
              mainWindow.webContents.send(IpcChannels.ai.plan.stream, chunk);

              // Also send as a result chunk for consistency with discovery handler
              chunk = {
                toolResult: toolResultData,
                type: 'result',
              };
              break;
            }

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.plan.stream, chunk);
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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during plan generation';

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies PlanStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing plan generation
  ipcMain.handle(IpcChannels.ai.plan.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}

/**
 * Convert tool result to ImplementationPlan format for the renderer.
 * Maps the tool result structure to the expected plan format.
 */
function convertToolResultToPlan(toolResult: PlanToolResultData): ImplementationPlan {
  return {
    completedAt: toolResult.completedAt,
    confidence: toolResult.confidence,
    modelUsed: undefined, // Will be set by the caller if needed
    overview: toolResult.overview,
    prerequisites: toolResult.prerequisites,
    reasoning: toolResult.reasoning,
    risks: toolResult.risks,
    steps: toolResult.steps,
    summary: toolResult.summary,
    testingStrategy: toolResult.testingStrategy,
    timestamp: toolResult.timestamp,
  };
}
