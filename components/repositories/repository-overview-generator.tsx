'use client';

import { AlertCircle, Loader2, RefreshCw, Save, Square } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState } from 'react';

import type { FullModelId } from '@/lib/ai/models';
import type { RepositoryOverviewStreamChunk } from '@/types/electron';

import { useThinkingPreference } from '@/components/providers/thinking-preference-provider';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/ai/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ui/ai/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { UsageFooter } from '@/components/ui/ai/usage-footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useElectronAiOverview } from '@/hooks/useElectron';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { ModelSelector } from '../features/clarification/model-selector';

type GenerationStatus = 'complete' | 'error' | 'generating' | 'idle' | 'stopped';

type RepositoryOverviewGeneratorProps = ClassName & {
  onCancel: () => void;
  onSave: (data: SaveData) => void;
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
export const RepositoryOverviewGenerator = ({
  className,
  onCancel,
  onSave,
  repositoryId,
  repositoryPath,
}: RepositoryOverviewGeneratorProps) => {
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

  const { isThinkingEnabled } = useThinkingPreference();
  const { cancel, generate, subscribeToStream } = useElectronAiOverview();

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
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const handleGenerate = async () => {
    if (!selectedModel) return;

    const modelSupportsThinking = getModelInfo(selectedModel)?.supportsThinking ?? false;

    setStatus('generating');
    setStreamingContent('');
    setReasoningContent('');
    setUsageData(null);
    setError(null);

    const result = await generate({
      customPrompt: customPrompt || undefined,
      enableThinking: modelSupportsThinking ? effectiveThinking : undefined,
      modelId: selectedModel,
      repositoryId,
      repositoryPath,
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
    if (streamingContent && selectedModel) {
      onSave({
        content: streamingContent,
        customPrompt,
        modelId: selectedModel,
      });
    }
  };

  const handleThinkingToggle = (isChecked: boolean) => {
    setThinkingOverride(isChecked);
  };

  const isGenerating = status === 'generating';
  const isComplete = status === 'complete';
  const isStopped = status === 'stopped';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const hasStreamingContent = streamingContent.length > 0;
  const shouldShowContent = (isGenerating || isComplete || isStopped || isError) && hasStreamingContent;
  const isFinishedState = isComplete || isStopped || isError;
  const canSave = (isComplete || isStopped) && hasStreamingContent;

  const modelInfo = selectedModel ? getModelInfo(selectedModel) : undefined;
  const supportsThinking = modelInfo?.supportsThinking ?? false;
  const hasReasoningContent = reasoningContent.length > 0;
  const effectiveThinking = thinkingOverride ?? isThinkingEnabled;

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
            <ModelSelector isDisabled={isGenerating} onValueChange={setSelectedModel} value={selectedModel} />
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
              <div className={'mt-2'}>
                <Textarea
                  className={'min-h-24'}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={'Add any specific instructions for the AI to follow when generating the overview...'}
                  value={customPrompt}
                />
              </div>
            )}
          </div>

          {/* Thinking Toggle - Only shown for models that support thinking */}
          {supportsThinking && (
            <div className={'flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2'}>
              <div className={'flex flex-col gap-0.5'}>
                <label className={'text-sm font-medium'} htmlFor={'thinking-toggle'}>
                  Enable thinking for this request
                </label>
                <span className={'text-xs text-muted-foreground'}>
                  {thinkingOverride === null
                    ? `Using global preference (${isThinkingEnabled ? 'enabled' : 'disabled'})`
                    : 'Override for this request'}
                </span>
              </div>
              <Switch checked={effectiveThinking} id={'thinking-toggle'} onCheckedChange={handleThinkingToggle} />
            </div>
          )}
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
            <Button disabled={!selectedModel} onClick={handleGenerate}>
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
};
