'use client';

import { GitBranch, Plus } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function RepositoriesPage() {
  // This will be replaced with actual repositories data
  const hasRepositories = false;

  return (
    <Fragment>
      {hasRepositories ? (
        <div className={'space-y-4'}>{/* Repository list will go here */}</div>
      ) : (
        <EmptyState
          action={
            <Button>
              <Plus className={'size-4'} />
              Connect repository
            </Button>
          }
          description={'Connect repositories to provide context for AI-powered implementation planning.'}
          icon={<GitBranch className={'size-6'} />}
          title={'No repositories connected'}
        />
      )}
    </Fragment>
  );
}
