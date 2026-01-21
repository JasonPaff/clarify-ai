import { tool } from 'ai';
import { z } from 'zod';

import {
  type ImplementationPlan,
  type PlanFile,
  planFileSchema,
  type PlanRisk,
  planRiskSchema,
  type PlanStep,
  planStepComplexitySchema,
  type QualityGate,
  qualityGateSchema,
  testingStrategySchema,
} from '@/lib/validations/plan';

// Zod schema for plan tool input
// This is what the AI will call to report the generated implementation plan
const planToolInputSchema = z.object({
  confidence: z.number().min(0).max(100).describe('Overall confidence score (0-100) for the implementation plan'),
  overview: z.string().describe('High-level overview of the implementation approach and architecture decisions'),
  prerequisites: z
    .array(z.string())
    .optional()
    .describe('Prerequisites that must be in place before starting implementation'),
  reasoning: z.string().describe('Explanation of how the plan was developed and why this approach was chosen'),
  risks: z.array(planRiskSchema).optional().describe('Potential risks and their mitigations for this implementation'),
  steps: z
    .array(
      z.object({
        complexity: planStepComplexitySchema.describe('Estimated complexity level for this step'),
        description: z.string().describe('Detailed description of what needs to be done in this step'),
        files: z.array(planFileSchema).describe('Files that need to be created, modified, or deleted in this step'),
        order: z.number().int().positive().describe('Execution order for this step (1-based)'),
        qualityGates: z
          .array(qualityGateSchema)
          .optional()
          .describe('Validation checkpoints to verify this step is complete'),
        title: z.string().describe('Short, descriptive title for this step'),
      })
    )
    .describe('Ordered list of implementation steps'),
  summary: z.string().describe('Brief summary of the implementation plan and expected outcomes'),
  testingStrategy: testingStrategySchema.optional().describe('Overall testing approach for the implementation'),
});

export type PlanToolInput = z.infer<typeof planToolInputSchema>;

// Type for the tool result
export interface PlanToolResult {
  completedAt: string;
  confidence: number;
  overview: string;
  prerequisites: Array<string>;
  reasoning: string;
  risks: Array<PlanRisk>;
  steps: Array<PlanStep>;
  stepsGenerated: number;
  summary: string;
  testingStrategy?: {
    commands?: Array<string>;
    description: string;
    unitTests?: Array<string>;
  };
  timestamp: string;
  totalFiles: number;
}

// Create the plan tool for Vercel AI SDK v6
// Using inputSchema instead of parameters
export const planTool = tool({
  description:
    'Report the generated implementation plan for a feature. Provide a comprehensive, step-by-step plan with file changes, quality gates, risks, and testing strategy.',
  execute: async (input: PlanToolInput): Promise<PlanToolResult> => {
    const now = new Date().toISOString();

    // Count total files across all steps
    const totalFiles = input.steps.reduce((total, step) => total + step.files.length, 0);

    // The tool execution returns the structured data for the handler to process
    return {
      completedAt: now,
      confidence: input.confidence,
      overview: input.overview,
      prerequisites: input.prerequisites ?? [],
      reasoning: input.reasoning,
      risks: input.risks ?? [],
      steps: input.steps,
      stepsGenerated: input.steps.length,
      summary: input.summary,
      testingStrategy: input.testingStrategy,
      timestamp: now,
      totalFiles,
    };
  },
  inputSchema: planToolInputSchema,
});

// Re-export types from validation schema for convenience
export type { ImplementationPlan, PlanFile, PlanRisk, PlanStep, QualityGate };
