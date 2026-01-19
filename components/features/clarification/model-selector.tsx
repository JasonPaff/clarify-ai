'use client';

import type { FullModelId } from '@/lib/ai/models';
import type { ApiKeyProvider } from '@/types/electron';

import {
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAvailableModels } from '@/hooks/use-available-models';
import { PROVIDER_NAMES } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

type ModelSelectorProps = ClassName & {
  isDisabled?: boolean;
  onValueChange: (value: FullModelId) => void;
  value: FullModelId | null;
};

/**
 * Dropdown selector for AI models, grouped by provider.
 * Only shows models for providers with configured API keys.
 */
export const ModelSelector = ({ className, isDisabled, onValueChange, value }: ModelSelectorProps) => {
  const { configuredProviders, isLoading, modelsByProvider } = useAvailableModels();

  const handleValueChange = (newValue: null | string) => {
    if (newValue) {
      onValueChange(newValue as FullModelId);
    }
  };

  const hasNoProviders = !isLoading && configuredProviders.length === 0;

  // Build grouped options
  const groupedOptions: Array<{
    label: string;
    options: Array<{ label: string; value: string }>;
    provider: ApiKeyProvider;
  }> = [];

  for (const provider of configuredProviders) {
    const models = modelsByProvider[provider];
    if (models && models.length > 0) {
      groupedOptions.push({
        label: PROVIDER_NAMES[provider],
        options: models.map((model) => ({
          label: model.name,
          value: model.fullId,
        })),
        provider,
      });
    }
  }

  // Determine display value for placeholder states
  const getPlaceholder = () => {
    if (isLoading) return 'Loading models...';
    if (hasNoProviders) return 'No API keys configured';
    return 'Select a model...';
  };

  return (
    <SelectRoot
      disabled={isDisabled || isLoading || hasNoProviders}
      onValueChange={handleValueChange}
      value={value ?? ''}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>

      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectList>
              {groupedOptions.map((group) => (
                <SelectGroup key={group.provider}>
                  <SelectGroupLabel>{group.label}</SelectGroupLabel>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
};
