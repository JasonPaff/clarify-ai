'use client';

import { Brain } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { FullModelId } from '@/lib/ai/models';
import type { ApiKeyProvider } from '@/types/electron';

import {
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxRoot,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { useAvailableModels } from '@/hooks/use-available-models';
import { PROVIDER_NAMES } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

interface ModelOption {
  group: string;
  label: string;
  supportsThinking?: boolean;
  value: string;
}

type ModelSelectorProps = ClassName & {
  isDisabled?: boolean;
  onValueChange: (value: FullModelId) => void;
  value: FullModelId | null;
};

/**
 * Combobox selector for AI models, grouped by provider.
 * Only shows models for providers with configured API keys.
 * Supports filtering by typing.
 */
export const ModelSelector = ({ className, isDisabled, onValueChange, value }: ModelSelectorProps) => {
  const { configuredProviders, isLoading, modelsByProvider } = useAvailableModels();
  const [inputValue, setInputValue] = useState('');

  const handleValueChange = (newValue: ModelOption | null) => {
    if (newValue) {
      onValueChange(newValue.value as FullModelId);
    }
    // Clear input when a selection is made
    setInputValue('');
  };

  const handleInputValueChange = (newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const hasNoProviders = !isLoading && configuredProviders.length === 0;

  // Flatten all options for the combobox with group info
  const allOptions = useMemo(() => {
    const options: Array<ModelOption> = [];
    for (const provider of configuredProviders) {
      const models = modelsByProvider[provider];
      if (models && models.length > 0) {
        const groupLabel = PROVIDER_NAMES[provider];
        for (const model of models) {
          options.push({
            group: groupLabel,
            label: model.name,
            supportsThinking: model.supportsThinking,
            value: model.fullId,
          });
        }
      }
    }
    return options;
  }, [configuredProviders, modelsByProvider]);

  // Get unique groups in order
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ label: string; provider: ApiKeyProvider }> = [];
    for (const provider of configuredProviders) {
      const models = modelsByProvider[provider];
      if (models && models.length > 0) {
        const label = PROVIDER_NAMES[provider];
        if (!seen.has(label)) {
          seen.add(label);
          result.push({ label, provider });
        }
      }
    }
    return result;
  }, [configuredProviders, modelsByProvider]);

  // Find the selected option object
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return allOptions.find((opt) => opt.value === value) ?? null;
  }, [allOptions, value]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    // If no input value, show all options
    if (!inputValue) return allOptions;

    // If input matches the selected option's label exactly, show all options
    // This handles the case where combobox reopens and shows selected value
    if (selectedOption && inputValue === selectedOption.label) return allOptions;

    const lowercaseInput = inputValue.toLowerCase();
    return allOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(lowercaseInput) || option.group.toLowerCase().includes(lowercaseInput)
    );
  }, [allOptions, inputValue, selectedOption]);

  // Get filtered groups (only show groups that have matching options)
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => filteredOptions.some((opt) => opt.group === group.label));
  }, [filteredOptions, groups]);

  const placeholder = useMemo(() => {
    if (isLoading) return 'Loading models...';
    if (hasNoProviders) return 'No API keys configured';
    return 'Search models...';
  }, [isLoading, hasNoProviders]);

  return (
    <ComboboxRoot<ModelOption>
      disabled={isDisabled || isLoading || hasNoProviders}
      items={allOptions}
      onInputValueChange={handleInputValueChange}
      onValueChange={handleValueChange}
      value={selectedOption}
    >
      <div className={cn('relative w-full', className)}>
        <ComboboxInput placeholder={placeholder} />
        <div className={'absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5'}>
          <ComboboxTrigger />
        </div>
      </div>

      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxEmpty>No models found</ComboboxEmpty>
            <ComboboxList>
              {filteredGroups.map((group) => (
                <ComboboxGroup key={group.provider}>
                  <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
                  {filteredOptions
                    .filter((option) => option.group === group.label)
                    .map((option) => (
                      <ComboboxItem key={option.value} value={option}>
                        <ComboboxItemIndicator />
                        <span className={'col-start-2 flex items-center gap-1.5'}>
                          {option.label}
                          {option.supportsThinking && (
                            <Brain className={'size-3.5 text-muted-foreground'} />
                          )}
                        </span>
                      </ComboboxItem>
                    ))}
                </ComboboxGroup>
              ))}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </ComboboxRoot>
  );
};
