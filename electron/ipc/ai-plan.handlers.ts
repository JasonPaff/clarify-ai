import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { DiscoveredFile, DiscoveryRepositoryOverview } from './ai-discovery.handlers';

import { IpcChannels } from './channels';

/** Complete implementation plan */
export interface ImplementationPlan {
  overview: string;
  prerequisites?: Array<string>;
  risks?: Array<string>;
  steps: Array<PlanStep>;
  summary: string;
  testingStrategy?: string;
}

/** Request payload for generating implementation plan */
export interface PlanGenerateRequest {
  clarificationContext?: string;
  customPrompt?: string;
  discoveredFiles: Array<DiscoveredFile>;
  enableThinking?: boolean;
  featureRequestDescription: string;
  featureRequestId: number;
  modelId: string; // Format: "provider:modelId"
  repositoryOverviews: Array<DiscoveryRepositoryOverview>;
}

/** Quality gate for validating a plan step */
export interface PlanQualityGate {
  command?: string;
  description: string;
  type: 'command' | 'manual';
}

/** A single step in the implementation plan */
export interface PlanStep {
  description: string;
  estimatedComplexity: 'high' | 'low' | 'medium';
  files: Array<string>;
  order: number;
  qualityGates?: Array<PlanQualityGate>;
  title: string;
}

/** Stream chunk sent to renderer during plan generation */
export interface PlanStreamChunk {
  content?: string;
  plan?: ImplementationPlan;
  type: 'error' | 'finish' | 'plan' | 'reasoning' | 'reasoning_end' | 'reasoning_start' | 'text';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
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

      const { discoveredFiles, featureRequestDescription, repositoryOverviews } = request;

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

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Send initial text
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          content: 'Analyzing discovered files and generating implementation plan...',
          type: 'text',
        } satisfies PlanStreamChunk);

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Simulate processing delay for placeholder
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check for abort
        if (activeAbortController?.signal.aborted) {
          return { error: 'Generation cancelled', success: false };
        }

        // Simulate more processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send mock implementation plan result
        const mockPlan: ImplementationPlan = {
          overview:
            'This is a placeholder implementation plan. Real implementation will use AI to generate detailed plans.',
          prerequisites: ['Prerequisite 1 (placeholder)', 'Prerequisite 2 (placeholder)'],
          risks: ['Risk 1: This is a placeholder (placeholder)', 'Risk 2: Actual risks will be identified by AI'],
          steps: [
            {
              description: 'This is a placeholder step description. Real implementation will provide detailed guidance.',
              estimatedComplexity: 'medium',
              files: discoveredFiles.map((f) => f.filePath),
              order: 1,
              qualityGates: [
                {
                  command: 'pnpm typecheck',
                  description: 'Verify TypeScript types',
                  type: 'command',
                },
                {
                  description: 'Manual code review',
                  type: 'manual',
                },
              ],
              title: 'Placeholder Step 1',
            },
          ],
          summary: 'Placeholder summary of the implementation plan.',
          testingStrategy: 'Placeholder testing strategy. AI will generate comprehensive testing guidance.',
        };

        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          plan: mockPlan,
          type: 'plan',
        } satisfies PlanStreamChunk);

        // Send finish chunk
        mainWindow.webContents.send(IpcChannels.ai.plan.stream, {
          type: 'finish',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        } satisfies PlanStreamChunk);

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
