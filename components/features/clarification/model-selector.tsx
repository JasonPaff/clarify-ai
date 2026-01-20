'use client';

import { Fragment, useMemo, useState } from 'react';

import type { FullModelId } from '@/lib/ai/models';
import type { CostTier, ModelPricing } from '@/lib/ai/pricing';
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
import { Tooltip } from '@/components/ui/tooltip';
import { useAvailableModels } from '@/hooks/use-available-models';
import { PROVIDER_NAMES } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

interface ModelOption {
  costTier: CostTier;
  group: string;
  label: string;
  pricing: ModelPricing | null;
  value: string;
}

type ModelSelectorProps = ClassName & {
  isDisabled?: boolean;
  onValueChange: (value: FullModelId) => void;
  value: FullModelId | null;
};

/**
 * Returns Tailwind classes for the cost tier indicator color
 */
const getCostTierColorClass = (tier: CostTier): string => {
  switch (tier) {
    case '$':
      return 'text-green-600 dark:text-green-400';
    case '$$':
      return 'text-yellow-600 dark:text-yellow-400';
    case '$$$':
      return 'text-red-600 dark:text-red-400';
  }
};

interface CostTierIndicatorProps {
  costTier: CostTier;
  pricing: ModelPricing | null;
}

/**
 * Displays a cost tier indicator with pricing tooltip
 */
const CostTierIndicator = ({ costTier, pricing }: CostTierIndicatorProps) => {
  const tooltipContent = (
    <div className={'flex flex-col gap-0.5 text-left'}>
      {pricing?.inputCostPer1M !== undefined && pricing?.outputCostPer1M !== undefined ? (
        <Fragment>
          <span>Input: ${(pricing.inputCostPer1M / 1000).toFixed(4)} / 1K tokens</span>
          <span>Output: ${(pricing.outputCostPer1M / 1000).toFixed(4)} / 1K tokens</span>
        </Fragment>
      ) : (
        <span>Pricing unavailable</span>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} side={'right'}>
      <span className={cn('ml-1.5 text-xs font-semibold', getCostTierColorClass(costTier))}>{costTier}</span>
    </Tooltip>
  );
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
            costTier: model.costTier,
            group: groupLabel,
            label: model.name,
            pricing: model.pricing,
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
                        <span className={'col-start-2 flex items-center'}>
                          {option.label}
                          <CostTierIndicator costTier={option.costTier} pricing={option.pricing} />
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
