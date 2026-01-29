import { create } from "zustand";
import { api } from "../services/api";
import type { ConfigData } from "../types/config";

interface ConfigState {
  config: ConfigData | null;
  isConfigured: boolean;
  loading: boolean;
  error: string | null;
  checkConfiguration: () => Promise<void>;
  saveConfig: (config: Partial<ConfigData>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isConfigured: false,
  loading: false,
  error: null,

  checkConfiguration: async () => {
    set({ loading: true, error: null });
    try {
      const config = await api.getConfig();
      set({
        config,
        isConfigured: !!config.figmaAccessToken,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
        isConfigured: false,
      });
    }
  },

  saveConfig: async (newConfig: Partial<ConfigData>) => {
    set({ loading: true, error: null });
    try {
      await api.saveConfig(newConfig);
      const updated = await api.getConfig();
      set({
        config: updated,
        isConfigured: !!updated.figmaAccessToken,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
      throw error;
    }
  },
}));
