'use client';

import { AlertCircle, Loader2, RefreshCw, Save, Square } from 'lucide-react';
import { forwardRef, Fragment, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { RepositoryOverviewStreamChunk } from '@/types/electron';

import { AIModelSelector, AISettingsAdvanced } from '@/components/ai-settings';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/ai/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ui/ai/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { UsageFooter } from '@/components/ui/ai/usage-footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useLocalAISettings } from '@/hooks/use-local-ai-settings';
import { useElectronAiOverview } from '@/hooks/useElectron';
import { getModelInfo } from '@/lib/ai/models';
import { mapConfigToValues } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

/**
 * Data returned when preparing for background transition.
 */
export interface BackgroundTransitionData {
  content: string;
  customPrompt: string;
  modelId: string;
  projectId: number;
}

/**
 * Imperative handle for the RepositoryOverviewGenerator component.
 */
export interface RepositoryOverviewGeneratorHandle {
  /** Whether generation is currently in progress */
  isGenerating: boolean;
  /**
   * Prepare for background transition.
   * Sets the skip-cancel flag and returns current generation state.
   * Call this before unmounting to transfer generation to background.
   */
  prepareBackgroundTransition: () => BackgroundTransitionData | null;
  /** Stop the current generation */
  stopGeneration: () => Promise<void>;
}

type GenerationStatus = 'complete' | 'error' | 'generating' | 'idle' | 'stopped';

type RepositoryOverviewGeneratorProps = ClassName & {
  onCancel: () => void;
  onSave: (data: SaveData) => void;
  projectId: number;
  repositoryId: number;
  repositoryPath: string;
};

interface SaveData {
  content: string;
  customPrompt: string;
  modelId: string;
}

/**
 * Component for generating repository overviews with AI.
 * Handles model selection, custom prompts, streaming output, and save/regenerate actions.
 * Uses the unified AI settings components with local/temporary overrides.
 */
export const RepositoryOverviewGenerator = forwardRef<
  RepositoryOverviewGeneratorHandle,
  RepositoryOverviewGeneratorProps
>(function RepositoryOverviewGenerator({ className, onCancel, onSave, projectId, repositoryId, repositoryPath }, ref) {
  // Generation state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [usageData, setUsageData] = useState<null | RepositoryOverviewStreamChunk['usage']>(null);
  const [error, setError] = useState<null | string>(null);

  // Ref to skip cancel on unmount when transitioning to background
  const skipCancelRef = useRef(false);

  // Fetch project-level defaults
  const { data: overviewConfig } = useStepConfig(projectId, 'overview');

  // Convert project config to AISettingsValues for use as defaults
  const projectDefaults = useMemo(() => mapConfigToValues(overviewConfig), [overviewConfig]);

  // Use local AI settings (temporary overrides that don't persist)
  const settings = useLocalAISettings(projectDefaults);

  // Electron AI overview API
  const { cancel, generate, subscribeToStream } = useElectronAiOverview();

  const isGenerating = status === 'generating';

  // Expose imperative handle for parent component
  useImperativeHandle(
    ref,
    () => ({
      isGenerating,
      prepareBackgroundTransition: () => {
        if (!isGenerating || !settings.values.modelId) {
          return null;
        }
        // Set flag to skip cancel on unmount
        skipCancelRef.current = true;
        return {
          content: streamingContent,
          customPrompt: settings.values.customSystemPrompt ?? '',
          modelId: settings.values.modelId,
          projectId,
        };
      },
      stopGeneration: async () => {
        await cancel();
        setStatus('stopped');
      },
    }),
    [isGenerating, settings.values.modelId, settings.values.customSystemPrompt, streamingContent, projectId, cancel]
  );

  const handleStreamChunk = useCallback((chunk: RepositoryOverviewStreamChunk) => {
    switch (chunk.type) {
      case 'error':
        setError(chunk.content ?? 'An error occurred during generation');
        setStatus('error');
        setIsReasoningStreaming(false);
        break;
      case 'finish':
        setStatus('complete');
        setIsReasoningStreaming(false);
        if (chunk.usage) {
          setUsageData(chunk.usage);
        }
        break;
      case 'reasoning':
        if (chunk.content) {
          setReasoningContent((prev) => prev + chunk.content);
        }
        break;
      case 'reasoning_end':
        setIsReasoningStreaming(false);
        break;
      case 'reasoning_start':
        setIsReasoningStreaming(true);
        break;
      case 'text':
        if (chunk.content) {
          setStreamingContent((prev) => prev + chunk.content);
        }
        break;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToStream(handleStreamChunk);
    return () => {
      unsubscribe();
    };
  }, [handleStreamChunk, subscribeToStream]);

  // Cancel any active generation when component unmounts (e.g., dialog closed)
  // Skip cancel if transitioning to background generation
  useEffect(() => {
    return () => {
      if (!skipCancelRef.current) {
        cancel();
      }
    };
  }, [cancel]);

  const handleGenerate = async () => {
    const effectiveModelId = settings.values.modelId;
    if (!effectiveModelId) return;

    const modelSupportsThinking = getModelInfo(effectiveModelId)?.supportsThinking ?? false;
    const effectiveThinking = modelSupportsThinking && settings.values.thinkingEnabled;

    setStatus('generating');
    setStreamingContent('');
    setReasoningContent('');
    setUsageData(null);
    setError(null);

    const result = await generate({
      customPrompt: settings.values.customSystemPrompt || undefined,
      enableThinking: effectiveThinking,
      maxTokens: settings.values.maxTokens,
      modelId: effectiveModelId,
      projectId,
      repositoryId,
      repositoryPath,
      temperature: settings.values.temperature,
      thinkingBudget: settings.values.thinkingBudget,
    });

    if (!result.success) {
      setError(result.error ?? 'Failed to start generation');
      setStatus('error');
    }
  };

  const handleStopGeneration = async () => {
    await cancel();
    setStatus('stopped');
    // Keep the streaming content so user can read/save partial output
  };

  const handleCancelGeneration = async () => {
    await cancel();
    setStatus('idle');
    setStreamingContent('');
  };

  const handleRegenerate = () => {
    setStatus('idle');
    setStreamingContent('');
    setReasoningContent('');
    setUsageData(null);
    setError(null);
  };

  const handleSave = () => {
    const effectiveModelId = settings.values.modelId;
    if (streamingContent && effectiveModelId) {
      onSave({
        content: streamingContent,
        customPrompt: settings.values.customSystemPrompt ?? '',
        modelId: effectiveModelId,
      });
    }
  };

  const isComplete = status === 'complete';
  const isStopped = status === 'stopped';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const hasStreamingContent = streamingContent.length > 0;
  const shouldShowContent = (isGenerating || isComplete || isStopped || isError) && hasStreamingContent;
  const isFinishedState = isComplete || isStopped || isError;
  const canSave = (isComplete || isStopped) && hasStreamingContent;

  const modelInfo = settings.values.modelId ? getModelInfo(settings.values.modelId) : undefined;
  const supportsThinking = modelInfo?.supportsThinking ?? false;
  const hasReasoningContent = reasoningContent.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Repository Path Display */}
      <div>
        <label className={'mb-1.5 block text-sm font-medium text-muted-foreground'}>Repository Path</label>
        <div
          className={`
            truncate rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground
          `}
          title={repositoryPath}
        >
          {repositoryPath}
        </div>
      </div>

      {/* Model Selection and Settings - Only show in idle state */}
      {isIdle && (
        <Fragment>
          {/* Model Selector */}
          <AIModelSelector
            isDisabled={isGenerating}
            isModified={settings.modifications.modelId}
            onChange={(value) => settings.updateValue('modelId', value)}
            value={settings.values.modelId}
          />

          {/* Advanced Settings (includes all parameters and custom system prompt) */}
          <AISettingsAdvanced isDisabled={isGenerating} settings={settings} step={'overview'} />
        </Fragment>
      )}

      {/* Error Display */}
      {isError && error && (
        <Alert variant={'destructive'}>
          <AlertCircle className={'size-4'} />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stopped State Indicator */}
      {isStopped && (
        <div
          className={`
            flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2
          `}
        >
          <Square className={'size-4 fill-amber-600 text-amber-600'} />
          <span className={'text-sm text-amber-600'}>Generation stopped - partial content shown below</span>
        </div>
      )}

      {/* Reasoning/Thinking Display */}
      {supportsThinking && hasReasoningContent && (
        <Reasoning isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent className={'h-36'}>{reasoningContent}</ReasoningContent>
        </Reasoning>
      )}

      {/* Streaming/Complete Content Display */}
      {shouldShowContent && (
        <Conversation className={'h-96 rounded-md border border-border bg-muted/30'}>
          <ConversationContent>
            <Message from={'assistant'}>
              <MessageContent>
                <MessageResponse>{streamingContent}</MessageResponse>
                {isGenerating && <span className={'ml-0.5 animate-pulse'}>|</span>}
              </MessageContent>
            </Message>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      {/* Generating State Placeholder */}
      {isGenerating && !hasStreamingContent && (
        <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
          <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
          <span className={'text-sm text-muted-foreground'}>Generating repository overview...</span>
        </div>
      )}

      {/* Token Usage Display */}
      {isFinishedState && usageData && (
        <UsageFooter
          inputTokens={usageData.inputTokens}
          outputTokens={usageData.outputTokens}
          reasoningTokens={usageData.reasoningTokens}
          totalTokens={usageData.totalTokens}
        />
      )}

      {/* Action Buttons */}
      <div className={'flex justify-end gap-2'}>
        {isIdle && (
          <Fragment>
            <Button onClick={onCancel} variant={'outline'}>
              Cancel
            </Button>
            <Button disabled={!settings.values.modelId} onClick={handleGenerate}>
              Generate
            </Button>
          </Fragment>
        )}

        {isGenerating && (
          <Fragment>
            <Button onClick={handleCancelGeneration} variant={'ghost'}>
              Cancel
            </Button>
            <Button onClick={handleStopGeneration} variant={'outline'}>
              <Square className={'mr-2 size-4'} />
              Stop
            </Button>
          </Fragment>
        )}

        {isFinishedState && (
          <Fragment>
            <Button onClick={onCancel} variant={'ghost'}>
              Close
            </Button>
            <Button onClick={handleRegenerate} variant={'outline'}>
              <RefreshCw className={'mr-2 size-4'} />
              Regenerate
            </Button>
            {canSave && (
              <Button onClick={handleSave}>
                <Save className={'mr-2 size-4'} />
                Save Overview
              </Button>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
});
