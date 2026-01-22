'use client';

import type { ComponentPropsWithRef } from 'react';

import { CheckIcon, ChevronDown, ClipboardCopy, FileInput } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { PromptVariable } from '@/lib/ai/prompts/prompt-metadata';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DefaultPromptViewerProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect'> {
  /** The default prompt text to display */
  defaultPrompt: string;
  /** Whether the component is in a disabled state */
  isDisabled?: boolean;
  /** Callback when user clicks "Use as starting point" */
  onUseAsStartingPoint: (prompt: string) => void;
  /** Array of variables used in this prompt template */
  variables: Array<PromptVariable>;
}

const COPY_TIMEOUT = 2000;

export const DefaultPromptViewer = ({
  className,
  defaultPrompt,
  isDisabled = false,
  onUseAsStartingPoint,
  ref,
  variables,
  ...props
}: DefaultPromptViewerProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(defaultPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPY_TIMEOUT);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [defaultPrompt]);

  const handleUseAsStartingPoint = useCallback(() => {
    onUseAsStartingPoint(defaultPrompt);
  }, [defaultPrompt, onUseAsStartingPoint]);

  const CopyIcon = isCopied ? CheckIcon : ClipboardCopy;

  // Don't render if there's no default prompt (e.g., 'describe' step)
  if (!defaultPrompt) {
    return null;
  }

  return (
    <div className={cn('mt-3', className)} ref={ref} {...props}>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-left',
            'transition-colors hover:bg-muted/50'
          )}
          isHideChevron
        >
          <span className={'text-xs font-medium text-muted-foreground'}>View default prompt</span>
          <ChevronDown
            className={'size-3.5 text-muted-foreground transition-transform in-data-panel-open:rotate-180'}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className={'mt-2'}>
          <div className={'space-y-3 rounded-md border border-border bg-muted/20 p-3'}>
            {/* Prompt Preview */}
            <div
              className={cn(
                'max-h-48 overflow-auto rounded-md border border-border/50 bg-background p-3',
                'font-mono text-xs/relaxed text-muted-foreground'
              )}
            >
              <pre className={'whitespace-pre-wrap'}>{defaultPrompt}</pre>
            </div>

            {/* Actions Row */}
            <div className={'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'}>
              {/* Variables List */}
              {variables.length > 0 && (
                <div className={'flex flex-wrap items-center gap-1.5'}>
                  <span className={'text-xs text-muted-foreground'}>Variables:</span>
                  {variables.map((variable) => (
                    <Tooltip content={variable.description} key={variable.name} side={'top'}>
                      <span
                        className={cn(
                          'inline-flex cursor-help rounded-sm bg-accent/10 px-1.5 py-0.5',
                          'font-mono text-xs text-accent'
                        )}
                      >
                        {variable.name}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className={'flex items-center gap-1.5'}>
                <Button disabled={isDisabled} onClick={handleCopyToClipboard} size={'sm'} variant={'ghost'}>
                  <CopyIcon className={'size-3.5'} />
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
                <Button disabled={isDisabled} onClick={handleUseAsStartingPoint} size={'sm'} variant={'outline'}>
                  <FileInput className={'size-3.5'} />
                  Use as starting point
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
