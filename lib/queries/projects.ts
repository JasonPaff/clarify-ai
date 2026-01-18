import { createQueryKeys } from '@lukemorales/query-key-factory';

export const projectKeys = createQueryKeys('projects', {
  detail: (id: number) => [id],
  favorited: null,
  list: (filters?: string) => [{ filters }],
});
