'use client';

import type { ComponentPropsWithRef } from 'react';

import { Check, Copy, Eye, Terminal } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { QualityGate, QualityGates } from '@/lib/validations/plan';

import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface QualityGateListProps extends ComponentPropsWithRef<'div'> {
  /** Optional callback when a gate's completion state is toggled */
  onGateToggle?: (index: number, isCompleted: boolean) => void;
  /** The list of quality gates to display */
  qualityGates: QualityGates;
}

/**
 * Displays a list of quality validation checkpoints with optional completion tracking.
 * Supports both command-based (automated) and manual verification gates.
 */
export const QualityGateList = ({
  className,
  onGateToggle,
  qualityGates,
  ref,
  ...props
}: QualityGateListProps) => {
  const [completedGates, setCompletedGates] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<null | number>(null);

  const hasGates = qualityGates.length > 0;
  const isTrackingEnabled = onGateToggle !== undefined;

  /**
   * Handle checkbox toggle for a quality gate
   */
  const handleGateToggle = useCallback(
    (index: number, isChecked: boolean) => {
      setCompletedGates((prev) => {
        const next = new Set(prev);
        if (isChecked) {
          next.add(index);
        } else {
          next.delete(index);
        }
        return next;
      });
      onGateToggle?.(index, isChecked);
    },
    [onGateToggle]
  );

  /**
   * Copy command text to clipboard
   */
  const handleCopyCommand = useCallback(async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch {
      // Clipboard API may fail in some contexts, silently ignore
    }
  }, []);

  // Show empty state when no gates
  if (!hasGates) {
    return (
      <div className={cn('rounded-md border border-border bg-background p-4', className)} ref={ref} {...props}>
        <EmptyState
          description={'No quality validation checkpoints have been defined for this step.'}
          icon={<Check className={'size-6'} />}
          title={'No Quality Gates'}
        />
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border border-border bg-background', className)} ref={ref} {...props}>
      {/* Header */}
      <div className={'border-b border-border px-4 py-3'}>
        <div className={'flex items-center gap-2'}>
          <Check aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
          <h4 className={'text-sm font-medium text-foreground'}>Quality Gates</h4>
          <span className={'text-xs text-muted-foreground'}>
            ({completedGates.size}/{qualityGates.length} completed)
          </span>
        </div>
      </div>

      {/* Gate List */}
      <ul className={'divide-y divide-border'}>
        {qualityGates.map((gate, index) => (
          <QualityGateItem
            gate={gate}
            index={index}
            isCompleted={completedGates.has(index)}
            isCopied={copiedIndex === index}
            isTrackingEnabled={isTrackingEnabled}
            key={index}
            onCopyCommand={handleCopyCommand}
            onToggle={handleGateToggle}
          />
        ))}
      </ul>
    </div>
  );
};

interface QualityGateItemProps {
  /** The quality gate data */
  gate: QualityGate;
  /** The index of this gate in the list */
  index: number;
  /** Whether this gate is marked as completed */
  isCompleted: boolean;
  /** Whether the command was recently copied */
  isCopied: boolean;
  /** Whether completion tracking is enabled */
  isTrackingEnabled: boolean;
  /** Callback to copy command to clipboard */
  onCopyCommand: (command: string, index: number) => void;
  /** Callback when toggle state changes */
  onToggle: (index: number, isCompleted: boolean) => void;
}

/**
 * A single quality gate item with type-specific rendering
 */
const QualityGateItem = ({
  gate,
  index,
  isCompleted,
  isCopied,
  isTrackingEnabled,
  onCopyCommand,
  onToggle,
}: QualityGateItemProps) => {
  const isCommandGate = gate.type === 'command';

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onToggle(index, checked);
    },
    [index, onToggle]
  );

  const handleCopyClick = useCallback(() => {
    if (gate.command) {
      onCopyCommand(gate.command, index);
    }
  }, [gate.command, index, onCopyCommand]);

  return (
    <li className={'px-4 py-3'}>
      <div className={'flex items-start gap-3'}>
        {/* Checkbox for tracking */}
        {isTrackingEnabled && (
          <div className={'pt-0.5'}>
            <Checkbox
              aria-label={`Mark "${gate.description}" as completed`}
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              size={'sm'}
            />
          </div>
        )}

        {/* Type Icon */}
        <div className={'pt-0.5'}>
          {isCommandGate ? (
            <Tooltip content={'Command validation'}>
              <Terminal
                aria-label={'Command validation'}
                className={'size-4 text-muted-foreground'}
              />
            </Tooltip>
          ) : (
            <Tooltip content={'Manual verification'}>
              <Eye
                aria-label={'Manual verification'}
                className={'size-4 text-muted-foreground'}
              />
            </Tooltip>
          )}
        </div>

        {/* Content */}
        <div className={'min-w-0 flex-1'}>
          {/* Description */}
          <p
            className={cn(
              'text-sm text-foreground',
              isCompleted && 'text-muted-foreground line-through'
            )}
          >
            {gate.description}
          </p>

          {/* Command display for command-type gates */}
          {isCommandGate && gate.command && (
            <div className={'mt-2 flex items-center gap-2'}>
              <code
                className={
                  'flex-1 rounded-sm bg-muted px-2 py-1.5 font-mono text-xs text-foreground'
                }
              >
                {gate.command}
              </code>
              <Tooltip content={isCopied ? 'Copied!' : 'Copy command'}>
                <IconButton
                  aria-label={'Copy command to clipboard'}
                  className={'size-7'}
                  onClick={handleCopyClick}
                >
                  {isCopied ? (
                    <Check aria-hidden={'true'} className={'size-3.5 text-green-500'} />
                  ) : (
                    <Copy aria-hidden={'true'} className={'size-3.5'} />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};
