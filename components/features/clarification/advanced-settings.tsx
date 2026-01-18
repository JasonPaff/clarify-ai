'use client';

import { ChevronDown, Settings2 } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CLARIFICATION_PROMPT } from '@/lib/ai/prompts/clarification';
import { cn } from '@/lib/utils';

type AdvancedSettingsProps = ClassName & {
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
};

/**
 * Collapsible section for advanced clarification settings (custom prompt).
 */
export const AdvancedSettings = ({ className, customPrompt, onCustomPromptChange }: AdvancedSettingsProps) => {
  const isCustomized = customPrompt !== '' && customPrompt !== DEFAULT_CLARIFICATION_PROMPT;

  return (
    <Collapsible className={className} defaultOpen={false}>
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
          {isCustomized && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>Customized</span>
          )}
        </div>
        <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
      </CollapsibleTrigger>

      <CollapsibleContent className={'mt-2'}>
        <div className={'space-y-2 rounded-md border border-border bg-card p-3'}>
          <div className={'flex items-center justify-between'}>
            <label className={'text-sm font-medium'} htmlFor={'custom-prompt'}>
              Custom Prompt
            </label>
            {isCustomized && (
              <button
                className={'text-xs text-muted-foreground hover:text-foreground'}
                onClick={() => onCustomPromptChange('')}
                type={'button'}
              >
                Reset to default
              </button>
            )}
          </div>
          <p className={'text-xs text-muted-foreground'}>
            Customize the prompt used to analyze feature requests and generate questions. Use {'{featureRequest}'} as a
            placeholder for the feature request text.
          </p>
          <Textarea
            className={'min-h-64 font-mono text-xs'}
            id={'custom-prompt'}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder={DEFAULT_CLARIFICATION_PROMPT}
            value={customPrompt}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
