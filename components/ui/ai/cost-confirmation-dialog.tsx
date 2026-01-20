'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { estimateCost, formatCost } from '@/lib/ai/pricing';
import { cn } from '@/lib/utils';

interface CostConfirmationDialogProps {
  estimatedInputTokens: number;
  isLoading?: boolean;
  isOpen: boolean;
  modelId: string;
  onClose: () => void;
  onConfirm: () => void;
  operationType: string;
}

/**
 * Format a number with comma separators for thousands
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format the model ID for display in a user-friendly way
 */
const formatModelName = (modelId: string): string => {
  // Remove provider prefixes and version suffixes for cleaner display
  const cleanId = modelId
    .replace(/^(anthropic\/|openai\/|google\/|meta-llama\/|mistralai\/|deepseek\/|x-ai\/|cohere\/)/, '')
    .replace(/[-:]latest$/, '')
    .replace(/-\d{8}(-v\d+)?:?\d*$/, '');

  // Capitalize known model names
  const modelNameMap: Record<string, string> = {
    'claude-3-5-haiku': 'Claude 3.5 Haiku',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-opus-4-5': 'Claude Opus 4.5',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-5': 'GPT-5',
    'gpt-5-mini': 'GPT-5 Mini',
    o1: 'O1',
    'o1-mini': 'O1 Mini',
    'o3-mini': 'O3 Mini',
  };

  return modelNameMap[cleanId] || cleanId;
};

export const CostConfirmationDialog = ({
  estimatedInputTokens,
  isLoading = false,
  isOpen,
  modelId,
  onClose,
  onConfirm,
  operationType,
}: CostConfirmationDialogProps) => {
  const [formattedCost, setFormattedCost] = useState<string>('Loading...');
  const [isLoadingCost, setIsLoadingCost] = useState(true);

  // Estimate output tokens as roughly 1/4 of input for cost calculation
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.25);

  // Fetch cost when dialog opens or inputs change
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoadingCost(true);

    estimateCost(modelId, estimatedInputTokens, estimatedOutputTokens)
      .then((result) => {
        if (!cancelled) {
          setFormattedCost(formatCost(result.totalTokenCostUSD));
          setIsLoadingCost(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFormattedCost('$0.00');
          setIsLoadingCost(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, modelId, estimatedInputTokens, estimatedOutputTokens]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
      <AlertDialog.Portal>
        {/* Backdrop */}
        <AlertDialog.Backdrop
          className={cn(
            `
              fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity
              duration-200
            `,
            'data-ending-style:opacity-0',
            'data-starting-style:opacity-0'
          )}
        />

        {/* Dialog */}
        <AlertDialog.Popup
          className={cn(
            `
              fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-1/2
              rounded-lg border border-border
            `,
            `
              bg-background p-6 shadow-lg transition-all duration-200
              outline-none
            `,
            'data-ending-style:scale-95 data-ending-style:opacity-0',
            'data-starting-style:scale-95 data-starting-style:opacity-0'
          )}
        >
          {/* Header */}
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>
            Confirm AI Operation
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            Review the estimated cost before proceeding with this operation.
          </AlertDialog.Description>

          {/* Cost Details */}
          <div className={'mt-4 space-y-3 rounded-md border border-border bg-muted/50 p-4'}>
            {/* Operation Type */}
            <div className={'flex items-center justify-between'}>
              <span className={'text-sm text-muted-foreground'}>Operation</span>
              <span className={'text-sm font-medium text-foreground'}>{operationType}</span>
            </div>

            {/* Model */}
            <div className={'flex items-center justify-between'}>
              <span className={'text-sm text-muted-foreground'}>Model</span>
              <span className={'text-sm font-medium text-foreground'}>{formatModelName(modelId)}</span>
            </div>

            {/* Estimated Tokens */}
            <div className={'flex items-center justify-between'}>
              <span className={'text-sm text-muted-foreground'}>Est. Input Tokens</span>
              <span className={'text-sm font-medium text-foreground'}>{formatNumber(estimatedInputTokens)}</span>
            </div>

            {/* Divider */}
            <div className={'border-t border-border'} />

            {/* Estimated Cost */}
            <div className={'flex items-center justify-between'}>
              <span className={'text-sm font-medium text-muted-foreground'}>Estimated Cost</span>
              <span className={'text-base font-semibold text-foreground'}>
                {isLoadingCost ? (
                  <span className={'flex items-center gap-1'}>
                    <Loader2 className={'size-3 animate-spin'} />
                    <span className={'text-muted-foreground'}>Loading...</span>
                  </span>
                ) : (
                  formattedCost
                )}
              </span>
            </div>
          </div>

          {/* Note */}
          <p className={'mt-3 text-xs text-muted-foreground'}>
            Actual cost may vary based on response length. Prices are from OpenRouter catalog.
          </p>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button disabled={isLoading} variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button disabled={isLoading || isLoadingCost} onClick={onConfirm}>
              {isLoading ? (
                <span className={'flex items-center gap-2'}>
                  <Loader2 className={'size-4 animate-spin'} />
                  Processing...
                </span>
              ) : (
                'Proceed'
              )}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
