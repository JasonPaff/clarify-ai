import { create } from "zustand";

interface ProjectsUIActions {
  closeCreateDialog: () => void;
  openCreateDialog: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedProject: (id: null | number) => void;
}

interface ProjectsUIState {
  isCreateDialogOpen: boolean;
  searchTerm: string;
  selectedProjectId: null | number;
}

export const useProjectsUIStore = create<ProjectsUIActions & ProjectsUIState>(
  (set) => ({
    closeCreateDialog: () => set({ isCreateDialogOpen: false }),
    isCreateDialogOpen: false,
    openCreateDialog: () => set({ isCreateDialogOpen: true }),
    searchTerm: "",
    selectedProjectId: null,
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedProject: (id) => set({ selectedProjectId: id }),
  })
);
