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
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => projects.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
    },
  });
}

export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron,
    queryFn: () => projects.getById(id),
  });
}

export function useProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.list(),
    enabled: isElectron,
    queryFn: () => projects.getAll(),
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
        queryClient.setQueryData(
          projectKeys.detail(project.id).queryKey,
          project
        );
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}
