"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectKeys } from "@/lib/queries/projects";

import { useElectronDb } from "../useElectron";

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof projects.create>[0]) =>
      projects.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => projects.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    enabled: isElectron,
    queryFn: () => projects.getById(id),
    queryKey: projectKeys.detail(id),
  });
}

export function useProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    enabled: isElectron,
    queryFn: () => projects.getAll(),
    queryKey: projectKeys.lists(),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: ({
      data,
      id,
    }: {
      data: Parameters<typeof projects.update>[1];
      id: number;
    }) => projects.update(id, data),
    onSuccess: (project) => {
      if (project) {
        queryClient.setQueryData(projectKeys.detail(project.id), project);
        void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      }
    },
  });
}
