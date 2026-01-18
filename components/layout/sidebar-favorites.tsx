'use client';

import { Star } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tooltip } from '@/components/ui/tooltip';
import { useFavoritedProjects } from '@/hooks/queries/use-projects';
import { cn } from '@/lib/utils';

import { useSidebar } from './sidebar-context';

interface FavoriteProjectLinkProps {
  collapsed: boolean;
  isActive: boolean;
  project: {
    id: number;
    name: string;
  };
}

export function SidebarFavorites() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const { data: favoritedProjects } = useFavoritedProjects();

  const hasFavorites = favoritedProjects && favoritedProjects.length > 0;

  if (!hasFavorites) {
    return null;
  }

  const isActive = (projectId: number) => {
    const projectPath = $path({
      route: '/projects/[projectId]',
      routeParams: { projectId },
    });
    return pathname.startsWith(projectPath);
  };

  return (
    <div className={'mt-4 border-t border-border pt-4'}>
      {/* Section Header */}
      {!collapsed && (
        <div className={'mb-2 flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground'}>
          <Star className={'size-3'} />
          <span>{'Favorites'}</span>
        </div>
      )}

      {/* Favorites List */}
      <ul className={'space-y-1'}>
        {favoritedProjects.map((project) => (
          <li key={project.id}>
            <FavoriteProjectLink collapsed={collapsed} isActive={isActive(project.id)} project={project} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FavoriteProjectLink({ collapsed, isActive, project }: FavoriteProjectLinkProps) {
  const projectPath = $path({
    route: '/projects/[projectId]',
    routeParams: { projectId: project.id },
  });

  const linkContent = (
    <Link
      className={cn(
        `
          flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium
          transition-colors outline-none
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
        `,
        isActive && 'bg-accent text-accent-foreground',
        !isActive &&
          `
            text-muted-foreground
            hover:bg-muted hover:text-foreground
          `,
        collapsed && 'w-14 justify-center px-0'
      )}
      href={projectPath}
    >
      <Star className={cn('size-4 shrink-0', isActive && 'fill-current')} />
      {!collapsed && <span className={'truncate'}>{project.name}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={project.name} side={'right'}>
        {linkContent}
      </Tooltip>
    );
  }

  return linkContent;
}
