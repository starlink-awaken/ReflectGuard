import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'custom';
  model: string;
  apiKey: string;
  apiEndpoint?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  autoSave: boolean;
}

export interface SystemConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
}

interface SettingsState {
  // Settings
  modelConfig: ModelConfig;
  userPreferences: UserPreferences;
  systemConfig: SystemConfig;

  // UI State
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  error: string | null;

  // Actions
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  saveSettings: () => Promise<void>;
  resetToDefaults: () => void;
  clearError: () => void;
}

const defaultModelConfig: ModelConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 4096,
};

const defaultUserPreferences: UserPreferences = {
  theme: 'auto',
  language: 'zh-CN',
  notifications: true,
  autoSave: true,
};

const defaultSystemConfig: SystemConfig = {
  apiBaseUrl: '/api/v1',
  websocketUrl: '/ws',
  enableAnalytics: true,
  enableDebugMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      modelConfig: defaultModelConfig,
      userPreferences: defaultUserPreferences,
      systemConfig: defaultSystemConfig,
      hasUnsavedChanges: false,
      isSaving: false,
      lastSaved: null,
      error: null,

      // Actions
      updateModelConfig: (config) => {
        set((state) => ({
          modelConfig: { ...state.modelConfig, ...config },
          hasUnsavedChanges: true,
        }));
      },

      updateUserPreferences: (prefs) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...prefs },
          hasUnsavedChanges: true,
        }));
      },

      updateSystemConfig: (config) => {
        set((state) => ({
          systemConfig: { ...state.systemConfig, ...config },
          hasUnsavedChanges: true,
        }));
      },

      saveSettings: async () => {
        set({ isSaving: true, error: null });

        try {
          // In a real app, this would call an API endpoint
          // await apiService.saveSettings(get().modelConfig, get().userPreferences, get().systemConfig);

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));

          set({
            isSaving: false,
            hasUnsavedChanges: false,
            lastSaved: new Date().toISOString(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save settings',
            isSaving: false,
          });
        }
      },

      resetToDefaults: () => {
        set({
          modelConfig: defaultModelConfig,
          userPreferences: defaultUserPreferences,
          systemConfig: defaultSystemConfig,
          hasUnsavedChanges: true,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'prism-gateway-settings',
      partialize: (state) => ({
        modelConfig: state.modelConfig,
        userPreferences: state.userPreferences,
        systemConfig: state.systemConfig,
      }),
    }
  )
);
