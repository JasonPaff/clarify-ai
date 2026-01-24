'use client';

import { AlertCircle, ChevronDown, Loader2, RefreshCw, Save, Settings2, Square } from 'lucide-react';
import { forwardRef, Fragment, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { FullModelId } from '@/lib/ai/models';
import type { RepositoryOverviewStreamChunk } from '@/types/electron';

import { DefaultPromptViewer } from '@/components/features/workflow/default-prompt-viewer';
import { ParameterSlider } from '@/components/features/workflow/parameter-slider';
import { ThinkingBudgetControl } from '@/components/features/workflow/thinking-budget-control';
import { useThinkingPreference } from '@/components/providers/thinking-preference-provider';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/ai/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ui/ai/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { UsageFooter } from '@/components/ui/ai/usage-footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useElectronAiOverview } from '@/hooks/useElectron';
import { getModelInfo } from '@/lib/ai/models';
import { getPromptMetadata } from '@/lib/ai/prompts/prompt-metadata';
import { cn } from '@/lib/utils';

import { ModelSelector } from '../features/clarification/model-selector';

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
 */
export const RepositoryOverviewGenerator = forwardRef<
  RepositoryOverviewGeneratorHandle,
  RepositoryOverviewGeneratorProps
>(function RepositoryOverviewGenerator({ className, onCancel, onSave, projectId, repositoryId, repositoryPath }, ref) {
  const [selectedModel, setSelectedModel] = useState<FullModelId | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [usageData, setUsageData] = useState<null | RepositoryOverviewStreamChunk['usage']>(null);
  const [error, setError] = useState<null | string>(null);
  const [thinkingOverride, setThinkingOverride] = useState<boolean | null>(null);

  // Advanced settings override state
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [temperatureOverride, setTemperatureOverride] = useState<null | number>(null);
  const [maxTokensOverride, setMaxTokensOverride] = useState<null | number>(null);
  const [thinkingBudgetOverride, setThinkingBudgetOverride] = useState<null | number>(null);

  // Ref to skip cancel on unmount when transitioning to background
  const skipCancelRef = useRef(false);

  const { isThinkingEnabled } = useThinkingPreference();
  const { cancel, generate, subscribeToStream } = useElectronAiOverview();
  const { data: overviewConfig } = useStepConfig(projectId, 'overview');

  // Compute the default model from config
  const configDefaultModel =
    overviewConfig?.modelProvider && overviewConfig?.modelId
      ? (`${overviewConfig.modelProvider}:${overviewConfig.modelId}` as FullModelId)
      : null;

  // Use user-selected model if available, otherwise fall back to config default
  const effectiveSelectedModel = selectedModel ?? configDefaultModel;

  const isGenerating = status === 'generating';

  // Default values for advanced settings
  const DEFAULT_TEMPERATURE = 0.7;
  const DEFAULT_MAX_TOKENS = 4096;
  const DEFAULT_THINKING_BUDGET = 8192;

  // Defaults from config (falling back to hardcoded defaults)
  const defaultTemperature = overviewConfig?.temperature ?? DEFAULT_TEMPERATURE;
  const defaultMaxTokens = overviewConfig?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const defaultThinkingBudget = overviewConfig?.thinkingBudget ?? DEFAULT_THINKING_BUDGET;

  // Effective values (user override or project default)
  const effectiveTemperature = temperatureOverride ?? defaultTemperature;
  const effectiveMaxTokens = maxTokensOverride ?? defaultMaxTokens;
  const effectiveThinkingBudget = thinkingBudgetOverride ?? defaultThinkingBudget;

  // Modification indicators
  const isTemperatureModified = temperatureOverride !== null;
  const isMaxTokensModified = maxTokensOverride !== null;
  const isThinkingModified = thinkingOverride !== null || thinkingBudgetOverride !== null;
  const hasAnyModifications = isTemperatureModified || isMaxTokensModified || isThinkingModified;

  // Handler functions for advanced settings
  const handleTemperatureChange = (value: number) => setTemperatureOverride(value);
  const handleMaxTokensChange = (value: number) => setMaxTokensOverride(value);
  const handleThinkingBudgetChange = (budget: number) => setThinkingBudgetOverride(budget);
  const handleResetToDefaults = () => {
    setTemperatureOverride(null);
    setMaxTokensOverride(null);
    setThinkingBudgetOverride(null);
    setThinkingOverride(null);
  };

  // Format functions for slider display
  const formatTemperature = (value: number) => value.toFixed(1);
  const formatMaxTokens = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value));

  // Expose imperative handle for parent component
  useImperativeHandle(
    ref,
    () => ({
      isGenerating,
      prepareBackgroundTransition: () => {
        if (!isGenerating || !effectiveSelectedModel) {
          return null;
        }
        // Set flag to skip cancel on unmount
        skipCancelRef.current = true;
        return {
          content: streamingContent,
          customPrompt,
          modelId: effectiveSelectedModel,
          projectId,
        };
      },
      stopGeneration: async () => {
        await cancel();
        setStatus('stopped');
      },
    }),
    [isGenerating, effectiveSelectedModel, streamingContent, customPrompt, projectId, cancel]
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
    if (!effectiveSelectedModel) return;

    const modelSupportsThinking = getModelInfo(effectiveSelectedModel)?.supportsThinking ?? false;

    setStatus('generating');
    setStreamingContent('');
    setReasoningContent('');
    setUsageData(null);
    setError(null);

    const result = await generate({
      customPrompt: customPrompt || overviewConfig?.customSystemPrompt || undefined,
      enableThinking: modelSupportsThinking ? effectiveThinking : undefined,
      maxTokens: effectiveMaxTokens,
      modelId: effectiveSelectedModel,
      projectId,
      repositoryId,
      repositoryPath,
      temperature: effectiveTemperature,
      thinkingBudget: effectiveThinkingBudget,
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
    if (streamingContent && effectiveSelectedModel) {
      onSave({
        content: streamingContent,
        customPrompt,
        modelId: effectiveSelectedModel,
      });
    }
  };

  const handleThinkingToggle = (isChecked: boolean) => {
    setThinkingOverride(isChecked);
  };

  const isComplete = status === 'complete';
  const isStopped = status === 'stopped';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const hasStreamingContent = streamingContent.length > 0;
  const shouldShowContent = (isGenerating || isComplete || isStopped || isError) && hasStreamingContent;
  const isFinishedState = isComplete || isStopped || isError;
  const canSave = (isComplete || isStopped) && hasStreamingContent;

  const modelInfo = effectiveSelectedModel ? getModelInfo(effectiveSelectedModel) : undefined;
  const supportsThinking = modelInfo?.supportsThinking ?? false;
  const hasReasoningContent = reasoningContent.length > 0;
  const effectiveThinking = thinkingOverride ?? overviewConfig?.thinkingEnabled ?? isThinkingEnabled;

  const promptMetadata = useMemo(() => getPromptMetadata('overview'), []);

  const handleUseAsStartingPoint = useCallback(
    (prompt: string) => {
      setCustomPrompt(prompt);
      if (!isCustomPromptOpen) {
        setIsCustomPromptOpen(true);
      }
    },
    [isCustomPromptOpen]
  );

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

      {/* Model Selection - Only show in idle state */}
      {isIdle && (
        <Fragment>
          <div>
            <label className={'mb-1.5 block text-sm font-medium'}>AI Model</label>
            <ModelSelector isDisabled={isGenerating} onValueChange={setSelectedModel} value={effectiveSelectedModel} />
          </div>

          {/* Custom Prompt Section */}
          <div>
            <button
              className={`
                flex items-center gap-1 text-sm text-muted-foreground transition-colors
                hover:text-foreground
              `}
              onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
              type={'button'}
            >
              <span>{isCustomPromptOpen ? 'Hide' : 'Show'} custom prompt</span>
              <span className={'text-xs'}>{isCustomPromptOpen ? '(optional)' : ''}</span>
            </button>

            {isCustomPromptOpen && (
              <div className={'mt-2 space-y-2'}>
                <Textarea
                  className={'min-h-24'}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={'Add any specific instructions for the AI to follow when generating the overview...'}
                  value={customPrompt}
                />
                {/* Default Prompt Viewer - shown when custom prompt section is open */}
                <DefaultPromptViewer
                  defaultPrompt={promptMetadata.defaultPrompt}
                  isDisabled={isGenerating}
                  onUseAsStartingPoint={handleUseAsStartingPoint}
                  variables={promptMetadata.variables}
                />
              </div>
            )}

            {/* Default Prompt Viewer - shown when custom prompt section is collapsed for discoverability */}
            {!isCustomPromptOpen && (
              <DefaultPromptViewer
                defaultPrompt={promptMetadata.defaultPrompt}
                isDisabled={isGenerating}
                onUseAsStartingPoint={handleUseAsStartingPoint}
                variables={promptMetadata.variables}
              />
            )}
          </div>

          {/* Advanced Settings Section */}
          <Collapsible onOpenChange={setIsAdvancedSettingsOpen} open={isAdvancedSettingsOpen}>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm',
                'transition-colors hover:bg-muted/50'
              )}
              isHideChevron
            >
              <div className={'flex items-center gap-2'}>
                <Settings2 className={'size-4 text-muted-foreground'} />
                <span className={'font-medium'}>Advanced Settings</span>
                {hasAnyModifications && (
                  <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>Modified</span>
                )}
              </div>
              <ChevronDown
                className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className={'mt-2'}>
              <div className={'space-y-4 rounded-md border border-border bg-card p-4'}>
                {/* Temperature and Max Tokens sliders */}
                <div className={'flex flex-col gap-4 md:flex-row md:gap-8'}>
                  {/* Temperature Slider */}
                  <div className={'flex-1'}>
                    <ParameterSlider
                      description={'Controls randomness. Lower is more focused.'}
                      formatValue={formatTemperature}
                      isDisabled={isGenerating}
                      label={'Temperature'}
                      max={2}
                      min={0}
                      onValueChange={handleTemperatureChange}
                      step={0.1}
                      value={effectiveTemperature}
                    />
                    {isTemperatureModified && (
                      <p className={'mt-1 text-xs text-muted-foreground'}>
                        Default: {formatTemperature(defaultTemperature)}
                      </p>
                    )}
                  </div>

                  {/* Max Tokens Slider */}
                  <div className={'flex-1'}>
                    <ParameterSlider
                      description={'Maximum response length.'}
                      formatValue={formatMaxTokens}
                      isDisabled={isGenerating}
                      label={'Max Tokens'}
                      max={16000}
                      min={100}
                      onValueChange={handleMaxTokensChange}
                      step={100}
                      value={effectiveMaxTokens}
                    />
                    {isMaxTokensModified && (
                      <p className={'mt-1 text-xs text-muted-foreground'}>
                        Default: {formatMaxTokens(defaultMaxTokens)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thinking Budget Control */}
                <ThinkingBudgetControl
                  budget={effectiveThinkingBudget}
                  isDisabled={isGenerating}
                  isEnabled={effectiveThinking}
                  isSupportsThinking={supportsThinking}
                  onBudgetChange={handleThinkingBudgetChange}
                  onEnabledChange={handleThinkingToggle}
                />

                {/* Reset to Defaults Button */}
                {hasAnyModifications && (
                  <Button className={'mt-2'} onClick={handleResetToDefaults} size={'sm'} variant={'ghost'}>
                    Reset to Project Defaults
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
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
            <Button disabled={!effectiveSelectedModel} onClick={handleGenerate}>
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
