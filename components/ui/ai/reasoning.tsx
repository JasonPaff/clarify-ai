'use client';

import type { ComponentProps, ReactNode } from 'react';

import { BrainIcon, ChevronDownIcon } from 'lucide-react';
import { createContext, Fragment, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';

import { Shimmer } from '@/components/ui/ai/shimmer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils';

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningContextValue {
  duration: number | undefined;
  isOpen: boolean;
  isStreaming: boolean;
  setIsOpen: (open: boolean) => void;
}

const ReasoningContext = createContext<null | ReasoningContextValue>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
};

export type ReasoningProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  duration?: number;
  isStreaming?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export const Reasoning = memo(
  ({
    children,
    className,
    defaultOpen = true,
    duration: durationProp,
    isStreaming = false,
    onOpenChange,
    open,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      defaultValue: defaultOpen,
      onChange: onOpenChange,
      value: open,
    });

    const [duration, setDuration] = useControllableState({
      defaultValue: undefined as number | undefined,
      value: durationProp,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const startTimeRef = useRef<null | number>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (!defaultOpen || isStreaming || !isOpen || hasAutoClosed) {
        return;
      }

      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY);

      return () => clearTimeout(timer);
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed]);

    const reasoningContext = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    );

    return (
      <ReasoningContext.Provider value={reasoningContext}>
        <Collapsible onOpenChange={setIsOpen} open={isOpen}>
          {/* eslint-disable-next-line better-tailwindcss/no-unknown-classes */}
          <div className={cn('not-prose mb-4', className)} {...props}>
            {children}
          </div>
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }
  return <p>Thought for {duration} seconds</p>;
};

export const ReasoningTrigger = memo(
  ({ children, className, getThinkingMessage = defaultGetThinkingMessage, ...props }: ReasoningTriggerProps) => {
    const { duration, isOpen, isStreaming } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-2 text-sm text-muted-foreground',
          'transition-colors hover:text-foreground',
          className
        )}
        isHideChevron
        variant={'ghost'}
        {...props}
      >
        {children ?? (
          <Fragment>
            <BrainIcon className={'size-4'} />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon className={cn('size-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
          </Fragment>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent> & {
  children: string;
};

export const ReasoningContent = memo(({ children, className, ...props }: ReasoningContentProps) => (
  <CollapsibleContent
    className={cn(
      'mt-4 max-h-36 overflow-y-auto text-sm text-muted-foreground outline-none',
      'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-2',
      'data-open:animate-in data-open:slide-in-from-top-2',
      className
    )}
    {...props}
  >
    <Streamdown>{children}</Streamdown>
  </CollapsibleContent>
));

Reasoning.displayName = 'Reasoning';
ReasoningTrigger.displayName = 'ReasoningTrigger';
ReasoningContent.displayName = 'ReasoningContent';
