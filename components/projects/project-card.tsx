'use client';

import { ChevronRight, Folder } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';

import { FavoriteButton } from '@/components/projects/favorite-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCardProps {
  description?: string;
  featureCount?: number;
  id: number;
  isFavorited?: boolean;
  name: string;
}

export function ProjectCard({ description, featureCount = 0, id, isFavorited = false, name }: ProjectCardProps) {
  return (
    <Link
      className={`
        block rounded-lg outline-none
        focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
      `}
      href={$path({
        route: '/projects/[projectId]',
        routeParams: { projectId: id },
      })}
    >
      <Card
        className={`
          cursor-pointer transition-shadow
          hover:shadow-md
        `}
      >
        <CardHeader className={'pb-2'}>
          <div className={'flex items-start justify-between'}>
            {/* Icon */}
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg bg-muted
              `}
            >
              <Folder className={'size-5 text-muted-foreground'} />
            </div>

            {/* Actions */}
            <div className={'flex items-center gap-1'}>
              <FavoriteButton id={id} isFavorited={isFavorited} />
              <ChevronRight className={'size-4 text-muted-foreground'} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className={'mb-1 text-base'}>{name}</CardTitle>
          {description && <CardDescription className={'line-clamp-2 text-xs'}>{description}</CardDescription>}
          <p className={'mt-2 text-xs text-muted-foreground'}>
            {featureCount} {featureCount === 1 ? 'feature' : 'features'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
