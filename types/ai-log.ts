/**
 * AI Debug Logging Type Definitions
 *
 * Type definitions for the AI debug logging system, including log entries,
 * workflow steps, tool calls, streaming chunks, and configuration.
 */

/**
 * Configuration settings for the AI debug logging system.
 */
export interface AiLogConfig {
  /** Whether AI debug logging is enabled */
  enabled: boolean;
  /** Maximum age of log entries to retain (in milliseconds) */
  maxAgeMs: number;
  /** Maximum number of log entries to retain */
  maxEntries: number;
  /** Whether to redact sensitive data (API keys, tokens) in logs */
  redactSensitiveData: boolean;
  /** Maximum size of content fields before truncation (in characters) */
  truncationThreshold: number;
}

/**
 * Main AI log entry interface representing a complete AI operation.
 * Captures all metadata, timing, tokens, and content for debugging purposes.
 */
export interface AiLogEntry {
  /** Timestamp when the operation completed (ISO 8601 format) */
  completedAt?: string;
  /** Timestamp when the log entry was created (ISO 8601 format) */
  createdAt: string;
  /** Total duration of the operation in milliseconds */
  durationMs?: number;
  /** Error message if the operation failed */
  errorMessage?: string;
  /** Associated feature request ID (optional, for correlation) */
  featureRequestId?: number;
  /** Unique identifier for the log entry */
  id: number;
  /** Number of input tokens used */
  inputTokens?: number;
  /** AI model identifier used for the operation */
  modelId: string;
  /** Number of output tokens generated */
  outputTokens?: number;
  /** Associated project ID (optional, for correlation) */
  projectId?: number;
  /** Accumulated reasoning/thinking content from the AI model */
  reasoningBody?: string;
  /** Number of reasoning tokens used (for models that support extended thinking) */
  reasoningTokens?: number;
  /** Request body sent to the AI model (JSON string) */
  requestBody?: string;
  /** Unique request identifier for correlation */
  requestId: string;
  /** Response body received from the AI model (JSON string) */
  responseBody?: string;
  /** Timestamp when the operation started (ISO 8601 format) */
  startedAt?: string;
  /** Current status of the operation */
  status: AiLogStatus;
  /** Array of streaming chunks received during the operation (JSON string in storage) */
  streamChunks?: string;
  /** Array of tool calls made during the operation (JSON string in storage) */
  toolCalls?: string;
  /** Timestamp when the log entry was last updated (ISO 8601 format) */
  updatedAt: string;
  /** Workflow step this operation belongs to */
  workflowStep: AiLogWorkflowStep;
}

/**
 * Filter parameters for querying AI log entries.
 */
export interface AiLogFilterParams {
  /** Custom end date for time range filtering (ISO 8601 format) */
  endDate?: string;
  /** Filter by feature request ID */
  featureRequestId?: number;
  /** Maximum number of entries to return */
  limit?: number;
  /** Filter by model ID */
  modelId?: string;
  /** Number of entries to skip for pagination */
  offset?: number;
  /** Filter by project ID */
  projectId?: number;
  /** Filter by request ID */
  requestId?: string;
  /** Full-text search query across request/response content */
  searchQuery?: string;
  /** Custom start date for time range filtering (ISO 8601 format) */
  startDate?: string;
  /** Filter by operation status */
  status?: AiLogStatus;
  /** Predefined time range filter */
  timeRange?: AiLogTimeRange;
  /** Filter by workflow step */
  workflowStep?: AiLogWorkflowStep;
}

/**
 * Query result for AI log list operations.
 */
export interface AiLogQueryResult {
  /** Array of log entries matching the query */
  entries: Array<AiLogEntry>;
  /** Total number of entries matching the filters (for pagination) */
  totalCount: number;
}

/**
 * Statistics for AI log entries.
 */
export interface AiLogStats {
  /** Average duration of completed operations in milliseconds */
  averageDurationMs: number;
  /** Total number of completed operations */
  completedCount: number;
  /** Total number of failed operations */
  failedCount: number;
  /** Total number of log entries */
  totalCount: number;
  /** Total input tokens across all operations */
  totalInputTokens: number;
  /** Total output tokens across all operations */
  totalOutputTokens: number;
}

/**
 * AI log entry status values:
 * - 'pending': Operation not yet started
 * - 'streaming': Operation currently streaming response
 * - 'completed': Operation finished successfully
 * - 'failed': Operation encountered an error
 * - 'cancelled': Operation was cancelled by user
 */
export type AiLogStatus = 'cancelled' | 'completed' | 'failed' | 'pending' | 'streaming';

/**
 * Represents a streaming chunk received during an AI operation.
 * Used for tracking the granular output of streaming responses.
 */
export interface AiLogStreamChunk {
  /** Content of the chunk */
  content: string;
  /** Index/order of the chunk in the stream */
  index: number;
  /** Timestamp when the chunk was received */
  timestamp: string;
  /** Type of chunk content */
  type: 'reasoning' | 'text' | 'tool-call' | 'tool-result';
}

/**
 * Time range filter options for querying logs.
 */
export type AiLogTimeRange = 'all' | 'custom' | 'last-7d' | 'last-24h' | 'last-hour';

/**
 * Represents a tool invocation during an AI operation.
 * Tracks tool calls made by the AI model including their arguments and results.
 */
export interface AiLogToolCall {
  /** Arguments passed to the tool as a JSON string */
  args: string;
  /** Duration of the tool execution in milliseconds */
  durationMs?: number;
  /** Error message if the tool call failed */
  error?: string;
  /** Unique identifier for the tool call */
  id: string;
  /** Result returned by the tool as a JSON string */
  result?: string;
  /** Timestamp when the tool call started */
  startedAt: string;
  /** Current status of the tool call */
  status: 'completed' | 'failed' | 'pending' | 'running';
  /** Name of the tool that was called */
  toolName: string;
}

/**
 * AI workflow step values representing the different stages of AI operations:
 * - 'clarify': Clarification step that refines user requirements
 * - 'describe': Repository overview/description generation step
 * - 'discover': File discovery step that identifies relevant files
 * - 'other': Any other AI operation outside the main workflow
 * - 'plan': Implementation planning step
 */
export type AiLogWorkflowStep = 'clarify' | 'describe' | 'discover' | 'other' | 'plan';

/**
 * Display names for workflow steps.
 */
export type AiLogWorkflowStepDisplayName = Record<AiLogWorkflowStep, string>;

/**
 * Input parameters for creating a new AI log entry.
 * Omits auto-generated fields like id, createdAt, and updatedAt.
 */
export type NewAiLogEntry = Omit<AiLogEntry, 'createdAt' | 'id' | 'updatedAt'>;

/**
 * Parsed stream chunks array from AiLogEntry.streamChunks JSON string.
 */
export type ParsedStreamChunks = Array<AiLogStreamChunk>;

/**
 * Parsed tool calls array from AiLogEntry.toolCalls JSON string.
 */
export type ParsedToolCalls = Array<AiLogToolCall>;

/**
 * Input parameters for updating an existing AI log entry.
 * All fields except id are optional.
 */
export type UpdateAiLogEntry = Partial<Omit<AiLogEntry, 'id'>>;
