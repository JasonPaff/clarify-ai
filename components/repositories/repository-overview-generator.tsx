'use client';

import { AlertCircle, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState } from 'react';

import type { FullModelId } from '@/lib/ai/models';
import type { RepositoryOverviewStreamChunk } from '@/types/electron';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useElectronAiOverview } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

import { ModelSelector } from '../features/clarification/model-selector';
import { RepositoryOverviewMarkdown } from './repository-overview-markdown';

type GenerationStatus = 'complete' | 'error' | 'generating' | 'idle';

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
  const [error, setError] = useState<null | string>(null);

  const { cancel, generate, subscribeToStream } = useElectronAiOverview();

  const handleStreamChunk = useCallback((chunk: RepositoryOverviewStreamChunk) => {
    switch (chunk.type) {
      case 'error':
        setError(chunk.content ?? 'An error occurred during generation');
        setStatus('error');
        break;
      case 'finish':
        setStatus('complete');
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

  const handleGenerate = async () => {
    if (!selectedModel) return;

    setStatus('generating');
    setStreamingContent('');
    setError(null);

    const result = await generate({
      customPrompt: customPrompt || undefined,
      modelId: selectedModel,
      repositoryId,
      repositoryPath,
    });

    if (!result.success) {
      setError(result.error ?? 'Failed to start generation');
      setStatus('error');
    }
  };

  const handleCancelGeneration = async () => {
    await cancel();
    setStatus('idle');
    setStreamingContent('');
  };

  const handleRegenerate = () => {
    setStatus('idle');
    setStreamingContent('');
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

  const isGenerating = status === 'generating';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const hasStreamingContent = streamingContent.length > 0;
  const shouldShowContent = (isGenerating || isComplete || isError) && hasStreamingContent;
  const isCompleteOrError = isComplete || isError;
  const canSave = isComplete && hasStreamingContent;

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

      {/* Streaming/Complete Content Display */}
      {shouldShowContent && (
        <div
          className={`
            max-h-96 overflow-y-auto rounded-md border border-border bg-muted/30 p-4
          `}
        >
          <RepositoryOverviewMarkdown content={streamingContent} isStreaming={isGenerating} />
        </div>
      )}

      {/* Generating State Placeholder */}
      {isGenerating && !hasStreamingContent && (
        <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
          <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
          <span className={'text-sm text-muted-foreground'}>Generating repository overview...</span>
        </div>
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
          <Button onClick={handleCancelGeneration} variant={'outline'}>
            <X className={'mr-2 size-4'} />
            Cancel
          </Button>
        )}

        {isCompleteOrError && (
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
