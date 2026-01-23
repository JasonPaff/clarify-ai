'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { DiscoveryCodeSnippet } from '@/lib/validations/discovery';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SnippetNavigatorProps {
  /** Currently active snippet index (0-based) */
  activeIndex: number;
  className?: string;
  /** Callback when navigating to a different snippet */
  onNavigate: (index: number) => void;
  /** Array of snippets to navigate through */
  snippets: Array<DiscoveryCodeSnippet>;
}

/**
 * Navigation bar for jumping between highlighted code snippets.
 * Shows snippet count and optional explanation for the active snippet.
 */
export const SnippetNavigator = ({ activeIndex, className, onNavigate, snippets }: SnippetNavigatorProps) => {
  const totalSnippets = snippets.length;
  const activeSnippet = snippets[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < totalSnippets - 1;
  const hasLineRange = activeSnippet?.startLine !== undefined && activeSnippet.endLine !== undefined;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(activeIndex + 1);
    }
  };

  if (totalSnippets === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Navigation controls */}
      <div className={'flex items-center justify-between gap-4'}>
        <div className={'flex items-center gap-2'}>
          <Button
            aria-label={'Previous snippet'}
            disabled={!hasPrevious}
            onClick={handlePrevious}
            size={'icon-sm'}
            variant={'outline'}
          >
            <ChevronLeft className={'size-4'} />
          </Button>
          <span className={'text-sm text-muted-foreground'}>
            Snippet {activeIndex + 1} of {totalSnippets}
          </span>
          <Button
            aria-label={'Next snippet'}
            disabled={!hasNext}
            onClick={handleNext}
            size={'icon-sm'}
            variant={'outline'}
          >
            <ChevronRight className={'size-4'} />
          </Button>
        </div>

        {/* Line range indicator */}
        {hasLineRange && (
          <span className={'text-xs text-muted-foreground'}>
            Lines {activeSnippet?.startLine}-{activeSnippet?.endLine}
          </span>
        )}
      </div>

      {/* Snippet explanation */}
      {activeSnippet?.explanation && (
        <p className={'rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground'}>{activeSnippet.explanation}</p>
      )}
    </div>
  );
};
