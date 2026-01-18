import { tool } from 'ai';
import { z } from 'zod';

// Zod schema for clarification tool input
const clarificationToolInputSchema = z.object({
  affectedAreas: z
    .array(z.string())
    .optional()
    .describe('Areas of the codebase or system that might be affected by this feature'),
  ambiguities: z
    .array(z.string())
    .optional()
    .describe('Specific ambiguities or missing details identified in the request'),
  detailScore: z.number().min(1).max(5).describe('How detailed is the feature request? 1=very vague, 5=comprehensive'),
  questions: z
    .array(
      z.object({
        allowCustom: z.boolean().default(true).describe('Whether to allow the user to provide a custom answer'),
        id: z.string().describe('Unique identifier for this question'),
        options: z
          .array(
            z.object({
              description: z.string().optional().describe('Additional context for this option'),
              label: z.string().describe('Display text for this option'),
              value: z.string().describe('Value to store if this option is selected'),
            })
          )
          .describe('Pre-suggested options for the user to choose from'),
        question: z.string().describe('The full question text to ask the user'),
      })
    )
    .optional()
    .describe('Clarifying questions to ask the user (generate if detailScore < 4)'),
  reasoning: z.string().optional().describe('Your reasoning for the detail score assessment'),
  summary: z.string().describe('A brief summary of the feature request and its current state of clarity'),
});

export type ClarificationToolInput = z.infer<typeof clarificationToolInputSchema>;

// Type for the tool result
export interface ClarificationToolResult {
  affectedAreas: Array<string>;
  ambiguities: Array<string>;
  completedAt: string;
  detailScore: number;
  questions: Array<{
    allowCustom: boolean;
    id: string;
    options: Array<{
      description?: string;
      label: string;
      value: string;
    }>;
    question: string;
  }>;
  questionsGenerated: number;
  reasoning?: string;
  summary: string;
}

// Create the clarification tool for Vercel AI SDK v6
// Using inputSchema instead of parameters
export const clarificationTool = tool({
  description:
    'Generate clarifying questions to better understand a feature request. Analyze the request, assess its detail level, and generate targeted questions if needed.',
  execute: async (input: ClarificationToolInput): Promise<ClarificationToolResult> => {
    // The tool execution returns the structured data for the handler to process
    return {
      affectedAreas: input.affectedAreas ?? [],
      ambiguities: input.ambiguities ?? [],
      completedAt: new Date().toISOString(),
      detailScore: input.detailScore,
      questions: input.questions ?? [],
      questionsGenerated: input.questions?.length ?? 0,
      reasoning: input.reasoning,
      summary: input.summary,
    };
  },
  inputSchema: clarificationToolInputSchema,
});
