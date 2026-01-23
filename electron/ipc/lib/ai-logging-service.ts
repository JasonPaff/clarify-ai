/**
 * AI Logging Service
 *
 * Core service that captures AI operations and writes logs to the database.
 * Provides methods for tracking AI operations through their lifecycle including
 * streaming chunks, tool calls, and completion/failure states.
 *
 * Features:
 * - Request ID generation (UUID)
 * - Sensitive data redaction
 * - Batched chunk recording for streaming performance
 * - Active operation tracking for in-flight requests
 * - Config-based enable/disable
 */

import Store from 'electron-store';

import type { AiLogsRepository } from '@/db/repositories/ai-logs.repository';
import type { AiLogStatus, AiLogWorkflowStep, NewAiLog } from '@/db/schema/ai-logs.schema';
import type { AiLogConfig, AiLogStreamChunk, AiLogToolCall } from '@/types/ai-log';

import {
  AI_DEBUG_LOGGING_STORAGE_KEY,
  DEFAULT_AI_DEBUG_LOGGING_CONFIG,
  SENSITIVE_DATA_PATTERNS,
  TRUNCATION_THRESHOLDS,
} from '@/lib/ai/debug-logging/constants';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for completing an AI operation.
 */
export interface CompleteOperationOptions {
  /** Number of input tokens used */
  inputTokens?: number;
  /** Number of output tokens generated */
  outputTokens?: number;
  /** Number of reasoning tokens used */
  reasoningTokens?: number;
  /** Request ID of the operation to complete */
  requestId: string;
  /** Response body (will be serialized to JSON) */
  responseBody?: unknown;
}

/**
 * Options for failing an AI operation.
 */
export interface FailOperationOptions {
  /** Error message or Error object */
  error: Error | string;
  /** Request ID of the operation to fail */
  requestId: string;
}

/**
 * Stream chunk recording options.
 */
export interface RecordStreamChunkOptions {
  /** Content of the chunk */
  content: string;
  /** Request ID of the parent operation */
  requestId: string;
  /** Type of chunk content */
  type: AiLogStreamChunk['type'];
}

/**
 * Tool call recording options.
 */
export interface RecordToolCallOptions {
  /** Tool call arguments */
  args: unknown;
  /** Request ID of the parent operation */
  requestId: string;
  /** Unique identifier for this tool call */
  toolCallId: string;
  /** Name of the tool being called */
  toolName: string;
}

/**
 * Tool result recording options.
 */
export interface RecordToolResultOptions {
  /** Duration of tool execution in milliseconds */
  durationMs?: number;
  /** Error message if the tool failed */
  error?: string;
  /** Request ID of the parent operation */
  requestId: string;
  /** Tool result (will be serialized to JSON) */
  result?: unknown;
  /** Unique identifier for the tool call */
  toolCallId: string;
}

/**
 * Options for starting a new AI operation.
 */
export interface StartOperationOptions {
  /** Associated feature request ID (optional) */
  featureRequestId?: number;
  /** AI model identifier */
  modelId: string;
  /** Associated project ID (optional) */
  projectId?: number;
  /** Request body (will be serialized to JSON) */
  requestBody?: unknown;
  /** Workflow step this operation belongs to */
  workflowStep: AiLogWorkflowStep;
}

/**
 * Result from starting an operation.
 */
export interface StartOperationResult {
  /** Database ID of the created log entry */
  logId: number;
  /** Unique request ID for correlation */
  requestId: string;
}

/**
 * Internal state for tracking an active operation.
 */
interface ActiveOperation {
  /** Chunk index counter */
  chunkIndex: number;
  /** Batched stream chunks awaiting write */
  chunks: Array<AiLogStreamChunk>;
  /** Database ID of the log entry */
  logId: number;
  /** Start time of the operation */
  startTime: number;
  /** Tool calls for this operation */
  toolCalls: Map<string, AiLogToolCall>;
}

/** Store interface for type safety */
interface StoreType {
  get(key: string): unknown;
}

// ============================================================================
// Constants
// ============================================================================

/** Batch interval for writing chunks (ms) */
const CHUNK_BATCH_INTERVAL_MS = 500;

/** Maximum chunks to batch before forcing a write */
const CHUNK_BATCH_MAX_SIZE = 50;

/** Singleton store instance */
const store = new Store() as unknown as StoreType;

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * AI Logging Service interface.
 */
export interface AiLoggingService {
  completeOperation(options: CompleteOperationOptions): void;
  failOperation(options: FailOperationOptions): void;
  getActiveOperation(requestId: string): undefined | { chunkCount: number; logId: number; toolCallCount: number };
  getActiveOperationCount(): number;
  isEnabled(): boolean;
  recordStreamChunk(options: RecordStreamChunkOptions): void;
  recordToolCall(options: RecordToolCallOptions): void;
  recordToolResult(options: RecordToolResultOptions): void;
  startOperation(options: StartOperationOptions): null | StartOperationResult;
}

/**
 * Creates an AI Logging Service instance.
 *
 * @param repository - The AiLogsRepository instance for database operations
 * @returns An AiLoggingService instance
 */
export function createAiLoggingService(repository: AiLogsRepository): AiLoggingService {
  /** Map of active operations by request ID */
  const activeOperations = new Map<string, ActiveOperation>();

  /** Batch write timers by request ID */
  const batchTimers = new Map<string, NodeJS.Timeout>();

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Gets the current AI debug logging configuration.
   */
  function getConfig(): AiLogConfig {
    const config = store.get(AI_DEBUG_LOGGING_STORAGE_KEY) as AiLogConfig | undefined;
    return config ?? DEFAULT_AI_DEBUG_LOGGING_CONFIG;
  }

  /**
   * Checks if AI debug logging is enabled.
   */
  function isEnabled(): boolean {
    return getConfig().enabled;
  }

  /**
   * Generates a unique request ID (UUID v4 format).
   */
  function generateRequestId(): string {
    // Use crypto.randomUUID() if available (Node.js 14.17+), otherwise generate manually
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Redacts sensitive data from a string using configured patterns.
   *
   * @param content - The content to redact
   * @returns The redacted content
   */
  function redactSensitiveData(content: string): string {
    if (!getConfig().redactSensitiveData) {
      return content;
    }

    let result = content;
    for (const { pattern, replacement } of SENSITIVE_DATA_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /**
   * Truncates content if it exceeds the storage threshold.
   *
   * @param content - The content to potentially truncate
   * @returns The possibly truncated content
   */
  function truncateContent(content: string): string {
    const threshold = getConfig().truncationThreshold || TRUNCATION_THRESHOLDS.STORAGE;
    if (content.length <= threshold) {
      return content;
    }
    return content.slice(0, threshold) + `\n\n[TRUNCATED - Original length: ${content.length} characters]`;
  }

  /**
   * Safely serializes a value to JSON, handling circular references.
   *
   * @param value - The value to serialize
   * @returns JSON string or empty string on error
   */
  function safeJsonStringify(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular Reference]';
          }
          seen.add(val);
        }
        return val;
      });
    } catch {
      return '[Serialization Error]';
    }
  }

  /**
   * Prepares content for storage by serializing, redacting, and truncating.
   *
   * @param content - The content to prepare
   * @returns Prepared content string
   */
  function prepareContentForStorage(content: unknown): string {
    const serialized = typeof content === 'string' ? content : safeJsonStringify(content);
    const redacted = redactSensitiveData(serialized);
    return truncateContent(redacted);
  }

  /**
   * Flushes batched chunks to the database.
   *
   * @param requestId - The request ID to flush chunks for
   */
  function flushChunks(requestId: string): void {
    const operation = activeOperations.get(requestId);
    if (!operation || operation.chunks.length === 0) {
      return;
    }

    // Get existing chunks from DB
    const existing = repository.getById(operation.logId);
    const existingChunks = existing?.streamChunks ? JSON.parse(existing.streamChunks) : [];

    // Merge with new chunks
    const allChunks = [...existingChunks, ...operation.chunks];
    const chunksJson = prepareContentForStorage(allChunks);

    // Update the database
    repository.update(operation.logId, {
      status: 'streaming' as AiLogStatus,
      streamChunks: chunksJson,
    });

    // Clear the batch
    operation.chunks = [];
  }

  /**
   * Schedules a batched chunk write.
   *
   * @param requestId - The request ID to schedule flush for
   */
  function scheduleBatchFlush(requestId: string): void {
    // Cancel existing timer if any
    const existingTimer = batchTimers.get(requestId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new flush
    const timer = setTimeout(() => {
      flushChunks(requestId);
      batchTimers.delete(requestId);
    }, CHUNK_BATCH_INTERVAL_MS);

    batchTimers.set(requestId, timer);
  }

  /**
   * Gets the current ISO timestamp.
   */
  function getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    /**
     * Completes an AI operation successfully.
     *
     * @param options - Completion options
     */
    completeOperation(options: CompleteOperationOptions): void {
      if (!isEnabled()) {
        return;
      }

      const operation = activeOperations.get(options.requestId);
      if (!operation) {
        return;
      }

      // Cancel any pending batch timer
      const timer = batchTimers.get(options.requestId);
      if (timer) {
        clearTimeout(timer);
        batchTimers.delete(options.requestId);
      }

      // Flush any remaining chunks
      flushChunks(options.requestId);

      const completedAt = getCurrentTimestamp();
      const durationMs = Date.now() - operation.startTime;

      // Prepare response body
      const responseBody = options.responseBody
        ? prepareContentForStorage(options.responseBody)
        : undefined;

      // Prepare tool calls
      const toolCallsArray = Array.from(operation.toolCalls.values());
      const toolCalls = toolCallsArray.length > 0 ? JSON.stringify(toolCallsArray) : undefined;

      // Update the log entry
      repository.update(operation.logId, {
        completedAt,
        durationMs,
        inputTokens: options.inputTokens,
        outputTokens: options.outputTokens,
        reasoningTokens: options.reasoningTokens,
        responseBody,
        status: 'completed' as AiLogStatus,
        toolCalls,
      });

      // Clean up active operation
      activeOperations.delete(options.requestId);
    },

    /**
     * Marks an AI operation as failed.
     *
     * @param options - Failure options
     */
    failOperation(options: FailOperationOptions): void {
      if (!isEnabled()) {
        return;
      }

      const operation = activeOperations.get(options.requestId);
      if (!operation) {
        return;
      }

      // Cancel any pending batch timer
      const timer = batchTimers.get(options.requestId);
      if (timer) {
        clearTimeout(timer);
        batchTimers.delete(options.requestId);
      }

      // Flush any remaining chunks
      flushChunks(options.requestId);

      const completedAt = getCurrentTimestamp();
      const durationMs = Date.now() - operation.startTime;

      // Extract error message
      const errorMessage =
        typeof options.error === 'string' ? options.error : options.error.message;

      // Prepare tool calls
      const toolCallsArray = Array.from(operation.toolCalls.values());
      const toolCalls = toolCallsArray.length > 0 ? JSON.stringify(toolCallsArray) : undefined;

      // Update the log entry
      repository.update(operation.logId, {
        completedAt,
        durationMs,
        errorMessage: redactSensitiveData(errorMessage),
        status: 'failed' as AiLogStatus,
        toolCalls,
      });

      // Clean up active operation
      activeOperations.delete(options.requestId);
    },

    /**
     * Gets active operation info for a request ID.
     * Useful for debugging and testing.
     *
     * @param requestId - The request ID to look up
     * @returns Operation info or undefined if not found
     */
    getActiveOperation(requestId: string): undefined | { chunkCount: number; logId: number; toolCallCount: number } {
      const operation = activeOperations.get(requestId);
      if (!operation) {
        return undefined;
      }
      return {
        chunkCount: operation.chunks.length,
        logId: operation.logId,
        toolCallCount: operation.toolCalls.size,
      };
    },

    /**
     * Gets the count of currently active operations.
     * Useful for debugging and monitoring.
     *
     * @returns Number of active operations
     */
    getActiveOperationCount(): number {
      return activeOperations.size;
    },

    /**
     * Checks if logging is currently enabled.
     *
     * @returns True if logging is enabled
     */
    isEnabled,

    /**
     * Records a streaming chunk for an active operation.
     *
     * @param options - Stream chunk recording options
     */
    recordStreamChunk(options: RecordStreamChunkOptions): void {
      if (!isEnabled()) {
        return;
      }

      const operation = activeOperations.get(options.requestId);
      if (!operation) {
        return;
      }

      // Create chunk entry
      const chunk: AiLogStreamChunk = {
        content: redactSensitiveData(options.content),
        index: operation.chunkIndex++,
        timestamp: getCurrentTimestamp(),
        type: options.type,
      };

      operation.chunks.push(chunk);

      // Check if we need to flush immediately
      if (operation.chunks.length >= CHUNK_BATCH_MAX_SIZE) {
        flushChunks(options.requestId);
      } else {
        scheduleBatchFlush(options.requestId);
      }
    },

    /**
     * Records a tool call initiation.
     *
     * @param options - Tool call recording options
     */
    recordToolCall(options: RecordToolCallOptions): void {
      if (!isEnabled()) {
        return;
      }

      const operation = activeOperations.get(options.requestId);
      if (!operation) {
        return;
      }

      const toolCall: AiLogToolCall = {
        args: prepareContentForStorage(options.args),
        id: options.toolCallId,
        startedAt: getCurrentTimestamp(),
        status: 'running',
        toolName: options.toolName,
      };

      operation.toolCalls.set(options.toolCallId, toolCall);
    },

    /**
     * Records a tool call result or error.
     *
     * @param options - Tool result recording options
     */
    recordToolResult(options: RecordToolResultOptions): void {
      if (!isEnabled()) {
        return;
      }

      const operation = activeOperations.get(options.requestId);
      if (!operation) {
        return;
      }

      const toolCall = operation.toolCalls.get(options.toolCallId);
      if (!toolCall) {
        return;
      }

      // Update tool call with result
      toolCall.durationMs = options.durationMs;
      toolCall.status = options.error ? 'failed' : 'completed';

      if (options.error) {
        toolCall.error = options.error;
      } else if (options.result !== undefined) {
        toolCall.result = prepareContentForStorage(options.result);
      }
    },

    /**
     * Starts a new AI operation and creates a log entry.
     *
     * @param options - Operation start options
     * @returns Start result with request ID and log ID, or null if logging disabled
     */
    startOperation(options: StartOperationOptions): null | StartOperationResult {
      if (!isEnabled()) {
        return null;
      }

      const requestId = generateRequestId();
      const startTime = Date.now();
      const startedAt = getCurrentTimestamp();

      // Prepare request body for storage
      const requestBody = options.requestBody
        ? prepareContentForStorage(options.requestBody)
        : undefined;

      // Create the log entry
      const newLog: NewAiLog = {
        featureRequestId: options.featureRequestId,
        modelId: options.modelId,
        projectId: options.projectId,
        requestBody,
        requestId,
        startedAt,
        status: 'pending' as AiLogStatus,
        workflowStep: options.workflowStep,
      };

      const created = repository.create(newLog);

      // Track active operation
      activeOperations.set(requestId, {
        chunkIndex: 0,
        chunks: [],
        logId: created.id,
        startTime,
        toolCalls: new Map(),
      });

      return {
        logId: created.id,
        requestId,
      };
    },
  };
}
