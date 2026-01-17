// Query Keys Factory
export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  list: (filters?: string) => [...projectKeys.lists(), filters] as const,
  lists: () => [...projectKeys.all, "list"] as const,
};
