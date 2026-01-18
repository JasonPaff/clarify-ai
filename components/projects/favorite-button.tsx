'use client';

import type { MouseEvent } from 'react';

import { Star } from 'lucide-react';

import { IconButton } from '@/components/ui/icon-button';
import { useFavoriteProject } from '@/hooks/queries/use-projects';
import { cn } from '@/lib/utils';

type FavoriteButtonProps = ClassName & {
  id: number;
  isFavorited: boolean;
};

export const FavoriteButton = ({ className, id, isFavorited }: FavoriteButtonProps) => {
  const { mutate: favoriteProject } = useFavoriteProject();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    favoriteProject({ id, isFavorited: !isFavorited });
  };

  return (
    <IconButton
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
      className={cn('size-8', isFavorited && 'text-yellow-500 hover:text-yellow-600', className)}
      onClick={handleClick}
      type={'button'}
    >
      <Star className={cn('size-4', isFavorited && 'fill-current')} />
    </IconButton>
  );
};
