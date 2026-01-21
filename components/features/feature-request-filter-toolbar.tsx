'use client';

import type { ChangeEvent } from 'react';

import { Search } from 'lucide-react';

import type { FeatureStatusFilter } from '@/app/(app)/projects/[projectId]/features/route-type';

import { featureStatusFilterValues } from '@/app/(app)/projects/[projectId]/features/route-type';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const statusLabels: Record<FeatureStatusFilter, string> = {
  all: 'All Statuses',
  clarifying: 'Clarifying',
  completed: 'Completed',
  describing: 'Describing',
  draft: 'Draft',
  failed: 'Failed',
  planning: 'Planning',
  researching: 'Researching',
};

interface FeatureRequestFilterToolbarProps {
  className?: string;
  isShowArchived?: boolean;
  onSearchChange: (search: string) => void;
  onShowArchivedChange: (isShowArchived: boolean) => void;
  onStatusChange: (status: FeatureStatusFilter | undefined) => void;
  search: string;
  status: FeatureStatusFilter | undefined;
}

export const FeatureRequestFilterToolbar = ({
  className,
  isShowArchived = false,
  onSearchChange,
  onShowArchivedChange,
  onStatusChange,
  search,
  status,
}: FeatureRequestFilterToolbarProps) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleStatusChange = (value: FeatureStatusFilter | null) => {
    if (value === 'all' || value === null) {
      onStatusChange(undefined);
    } else {
      onStatusChange(value);
    }
  };

  const handleShowArchivedChange = (isChecked: boolean) => {
    onShowArchivedChange(isChecked);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {/* Search Input */}
      <div className={'relative min-w-48 flex-1'}>
        <Search
          aria-hidden={'true'}
          className={'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'}
        />
        <Input
          aria-label={'Search feature requests'}
          className={'pl-9'}
          onChange={handleSearchChange}
          placeholder={'Search features...'}
          type={'search'}
          value={search}
        />
      </div>

      {/* Status Filter */}
      <div className={'w-44'}>
        <SelectRoot<FeatureStatusFilter> onValueChange={handleStatusChange} value={status ?? 'all'}>
          <SelectTrigger aria-label={'Filter by status'}>
            <SelectValue placeholder={'All Statuses'} />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList>
                  {featureStatusFilterValues.map((filterValue) => (
                    <SelectItem key={filterValue} value={filterValue}>
                      {statusLabels[filterValue]}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </div>

      {/* Archive Toggle */}
      <div className={'flex items-center gap-2'}>
        <Switch
          aria-label={'Show archived feature requests'}
          checked={isShowArchived}
          id={'show-archived-toggle'}
          onCheckedChange={handleShowArchivedChange}
        />
        <label className={'cursor-pointer text-sm text-foreground select-none'} htmlFor={'show-archived-toggle'}>
          Show archived
        </label>
      </div>
    </div>
  );
};
