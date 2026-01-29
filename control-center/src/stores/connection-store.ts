import { create } from "zustand";
import { api } from "../services/api";
import type { ProjectConnection } from "../types/config";

interface ConnectionState {
  projects: ProjectConnection[];
  currentFile: { fileKey: string; fileName: string } | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  connectProject: (connection: Partial<ProjectConnection>) => Promise<void>;
  disconnectProject: (fileKey: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  projects: [],
  currentFile: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getProjects();
      set({
        projects: response.projects,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  connectProject: async (connection) => {
    set({ loading: true, error: null });
    try {
      await api.connectProject({
        fileKey: connection.fileKey!,
        fileName: connection.fileName,
        projectId: connection.projectId,
        projectName: connection.projectName,
        pages: connection.pages,
        enabled: connection.enabled,
      });
      await get().fetchProjects();
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
      throw error;
    }
  },

  disconnectProject: async (fileKey: string) => {
    set({ loading: true, error: null });
    try {
      await api.disconnectProject(fileKey);
      await get().fetchProjects();
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
      throw error;
    }
  },

  refreshStatus: async () => {
    try {
      const status = await api.getStatus();
      set({
        currentFile: status.currentFile,
      });
      await get().fetchProjects();
    } catch (error: any) {
      console.error("Failed to refresh status:", error);
    }
  },
}));
