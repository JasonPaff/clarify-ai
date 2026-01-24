'use client';

import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { AiLogFilterParams } from '@/db/repositories/ai-logs.repository';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  aiLogStatusOptions,
  aiLogTimeRangeOptions,
  aiLogWorkflowStepOptions,
} from '@/lib/validations/ai-log';

/**
 * Display names for workflow steps.
 * Maps the database workflow step values to human-readable names.
 */
const WORKFLOW_STEP_LABELS: Record<string, string> = {
  clarify: 'Clarification',
  describe: 'Repository Overview',
  discover: 'Discovery',
  other: 'Other',
  plan: 'Planning',
};

/**
 * Status labels for filter display.
 */
const STATUS_LABELS: Record<string, string> = {
  cancelled: 'Cancelled',
  completed: 'Completed',
  failed: 'Failed',
  pending: 'Pending',
  streaming: 'Streaming',
};

/**
 * Time range labels for filter display.
 */
const TIME_RANGE_LABELS: Record<string, string> = {
  all: 'All Time',
  custom: 'Custom Range',
  'last-7d': 'Last 7 Days',
  'last-24h': 'Last 24 Hours',
  'last-hour': 'Last Hour',
};

/**
 * Filter state for the log filter toolbar.
 */
export interface LogFilterState {
  modelId?: string;
  searchQuery?: string;
  selectedStatuses: Array<string>;
  selectedWorkflowSteps: Array<string>;
  timeRange?: string;
}

/**
 * Default filter state with no filters applied.
 */
export const DEFAULT_FILTER_STATE: LogFilterState = {
  modelId: undefined,
  searchQuery: undefined,
  selectedStatuses: [],
  selectedWorkflowSteps: [],
  timeRange: 'all',
};

/**
 * Debounce delay for search input in milliseconds.
 */
const SEARCH_DEBOUNCE_MS = 300;

interface LogFilterToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Available model IDs to show in the model filter dropdown */
  availableModels?: Array<string>;
  /** Current filter state */
  filters: LogFilterState;
  /** Callback when filters change */
  onFilterChange: (filters: LogFilterState) => void;
}

export const LogFilterToolbar = ({
  availableModels = [],
  className,
  filters,
  onFilterChange,
  ref,
  ...props
}: LogFilterToolbarProps) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery ?? '');
  const debounceTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const handleSearchInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalSearchQuery(newValue);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new debounced callback - capture filters and onFilterChange directly
      const currentFilters = filters;
      const currentOnFilterChange = onFilterChange;
      debounceTimeoutRef.current = setTimeout(() => {
        currentOnFilterChange({
          ...currentFilters,
          searchQuery: newValue || undefined,
        });
      }, SEARCH_DEBOUNCE_MS);
    },
    [filters, onFilterChange]
  );

  const handleWorkflowStepToggle = useCallback(
    (step: string, isChecked: boolean) => {
      const newSteps = isChecked
        ? [...filters.selectedWorkflowSteps, step]
        : filters.selectedWorkflowSteps.filter((s) => s !== step);
      onFilterChange({
        ...filters,
        selectedWorkflowSteps: newSteps,
      });
    },
    [filters, onFilterChange]
  );

  const handleStatusToggle = useCallback(
    (status: string, isChecked: boolean) => {
      const newStatuses = isChecked
        ? [...filters.selectedStatuses, status]
        : filters.selectedStatuses.filter((s) => s !== status);
      onFilterChange({
        ...filters,
        selectedStatuses: newStatuses,
      });
    },
    [filters, onFilterChange]
  );

  const handleModelChange = useCallback(
    (value: null | string) => {
      onFilterChange({
        ...filters,
        modelId: value === 'all' || value === null ? undefined : value,
      });
    },
    [filters, onFilterChange]
  );

  const handleTimeRangeChange = useCallback(
    (value: null | string) => {
      onFilterChange({
        ...filters,
        timeRange: value ?? 'all',
      });
    },
    [filters, onFilterChange]
  );

  const handleClearFiltersClick = useCallback(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setLocalSearchQuery('');
    onFilterChange(DEFAULT_FILTER_STATE);
  }, [onFilterChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.searchQuery && filters.searchQuery.length > 0) ||
      filters.selectedWorkflowSteps.length > 0 ||
      filters.selectedStatuses.length > 0 ||
      (filters.modelId !== undefined && filters.modelId !== '') ||
      (filters.timeRange !== undefined && filters.timeRange !== 'all')
    );
  }, [filters]);

  const isWorkflowStepSelected = useCallback(
    (step: string) => filters.selectedWorkflowSteps.includes(step),
    [filters.selectedWorkflowSteps]
  );

  const isStatusSelected = useCallback(
    (status: string) => filters.selectedStatuses.includes(status),
    [filters.selectedStatuses]
  );

  return (
    <div className={cn('space-y-3', className)} ref={ref} {...props}>
      {/* Search and Dropdowns Row */}
      <div className={'flex flex-wrap items-center gap-3'}>
        {/* Search Input */}
        <div className={'min-w-48 flex-1'}>
          <Input
            aria-label={'Search logs'}
            onChange={handleSearchInputChange}
            placeholder={'Search request/response content...'}
            size={'sm'}
            type={'search'}
            value={localSearchQuery}
          />
        </div>

        {/* Model Filter */}
        {availableModels.length > 0 && (
          <div className={'w-40'}>
            <SelectRoot<string> onValueChange={handleModelChange} value={filters.modelId ?? 'all'}>
              <SelectTrigger aria-label={'Filter by model'} size={'sm'}>
                <SelectValue placeholder={'All Models'} />
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup size={'sm'}>
                    <SelectList>
                      <SelectItem value={'all'}>All Models</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
          </div>
        )}

        {/* Time Range Filter */}
        <div className={'w-36'}>
          <SelectRoot<string> onValueChange={handleTimeRangeChange} value={filters.timeRange ?? 'all'}>
            <SelectTrigger aria-label={'Filter by time range'} size={'sm'}>
              <SelectValue placeholder={'All Time'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {aiLogTimeRangeOptions
                      .filter((option) => option !== 'custom')
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {TIME_RANGE_LABELS[option] ?? option}
                        </SelectItem>
                      ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            aria-label={'Clear all filters'}
            onClick={handleClearFiltersClick}
            size={'sm'}
            variant={'ghost'}
          >
            <X className={'size-4'} />
            Clear
          </Button>
        )}
      </div>

      {/* Workflow Step Multi-Select */}
      <div className={'flex flex-wrap items-center gap-4'}>
        <span className={'text-xs font-medium text-muted-foreground'}>Workflow Step:</span>
        <div className={'flex flex-wrap items-center gap-3'}>
          {aiLogWorkflowStepOptions.map((step) => (
            <label className={'flex cursor-pointer items-center gap-1.5'} key={step}>
              <Checkbox
                checked={isWorkflowStepSelected(step)}
                onCheckedChange={(isChecked) => handleWorkflowStepToggle(step, isChecked)}
                size={'sm'}
              />
              <span className={'text-xs text-foreground select-none'}>
                {WORKFLOW_STEP_LABELS[step] ?? step}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Multi-Select */}
      <div className={'flex flex-wrap items-center gap-4'}>
        <span className={'text-xs font-medium text-muted-foreground'}>Status:</span>
        <div className={'flex flex-wrap items-center gap-3'}>
          {aiLogStatusOptions.map((status) => (
            <label className={'flex cursor-pointer items-center gap-1.5'} key={status}>
              <Checkbox
                checked={isStatusSelected(status)}
                onCheckedChange={(isChecked) => handleStatusToggle(status, isChecked)}
                size={'sm'}
              />
              <span className={'text-xs text-foreground select-none'}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Converts LogFilterState to AiLogFilterParams for the repository query.
 */
export const toAiLogFilterParams = (filters: LogFilterState): AiLogFilterParams => {
  const params: AiLogFilterParams = {};

  if (filters.searchQuery && filters.searchQuery.length > 0) {
    params.searchQuery = filters.searchQuery;
  }

  if (filters.modelId && filters.modelId.length > 0) {
    params.modelId = filters.modelId;
  }

  if (filters.timeRange && filters.timeRange !== 'all') {
    params.timeRange = filters.timeRange as AiLogFilterParams['timeRange'];
  }

  // Support multi-select for workflow steps and statuses
  if (filters.selectedWorkflowSteps.length > 0) {
    params.workflowStep = filters.selectedWorkflowSteps as AiLogFilterParams['workflowStep'];
  }

  if (filters.selectedStatuses.length > 0) {
    params.status = filters.selectedStatuses as AiLogFilterParams['status'];
  }

  return params;
};
