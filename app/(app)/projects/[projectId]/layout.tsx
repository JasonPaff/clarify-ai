'use client';

import { ArrowLeft } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withLayoutParamValidation } from 'next-typesafe-url/app/hoc';
import { use } from 'react';

import type { LayoutProps } from '@/app/(app)/projects/[projectId]/(projectId)/route-type';

import { Layout } from '@/app/(app)/projects/[projectId]/(projectId)/route-type';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectTabs } from '@/components/projects/project-tabs';
import { IconButtonLink } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { useProject } from '@/hooks/queries/use-projects';

type ProjectLayoutProps = LayoutProps & RequiredChildren;

export default withLayoutParamValidation(ProjectLayout, Layout);

function ProjectLayout({ children, routeParams }: ProjectLayoutProps) {
  const { projectId } = use(routeParams);

  const { data: project } = useProject(projectId);
  const projectName = project?.name ?? 'Loading...';

  return (
    <div>
      <div className={'flex items-center gap-3'}>
        <Tooltip content={'Back to projects'} side={'right'}>
          <IconButtonLink href={$path({ route: '/projects' })}>
            <ArrowLeft className={'size-4'} />
          </IconButtonLink>
        </Tooltip>
        <PageHeader className={'mb-0 flex-1'} title={projectName} />
      </div>

      <div className={'mt-4'}>
        <ProjectTabs projectId={projectId} />
      </div>

      <div className={'mt-6'}>{children}</div>
    </div>
  );
}
