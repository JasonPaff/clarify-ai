'use client';

import { FolderPlus, Plus } from 'lucide-react';
import { Fragment } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { PageHeader } from '@/components/layout/page-header';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectsSkeleton } from '@/components/skeletons/projects-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/hooks/queries/use-projects';

export default function ProjectsPage() {
  return (
    <Fragment>
      <PageHeader
        action={
          <NewProjectDialog>
            <Button>
              <Plus className={'size-4'} />
              New Project
            </Button>
          </NewProjectDialog>
        }
        description={'Manage your feature planning projects'}
        title={'Projects'}
      />

      <QueryErrorBoundary>
        <ProjectsContent />
      </QueryErrorBoundary>
    </Fragment>
  );
}

function ProjectsContent() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading || !projects) {
    return <ProjectsSkeleton />;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        action={
          <NewProjectDialog>
            <Button>
              <Plus className={'size-4'} />
              Create your first project
            </Button>
          </NewProjectDialog>
        }
        description={'Projects help you organize feature requests and implementation plans for your applications.'}
        icon={<FolderPlus className={'size-6'} />}
        title={'No projects yet'}
      />
    );
  }

  return (
    <div
      className={`
        grid gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      `}
    >
      {projects.map((project) => (
        <ProjectCard
          description={project.description ?? undefined}
          featureCount={project.featureCount}
          id={project.id}
          isFavorited={project.isFavorited ?? false}
          key={project.id}
          name={project.name}
        />
      ))}
    </div>
  );
}
