import { create } from 'zustand';
import type { Dashboard, Period } from '../types/api';
import { apiService } from '../services/api';

interface AnalyticsState {
  // Data
  dashboard: Dashboard | null;
  currentPeriod: Period;

  // Loading & Error states
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: (period?: Period) => Promise<void>;
  setPeriod: (period: Period) => void;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial state
  dashboard: null,
  currentPeriod: 'week',
  loading: false,
  error: null,

  // Actions
  fetchDashboard: async (period?: Period) => {
    const targetPeriod = period || get().currentPeriod;

    set({ loading: true, error: null });

    try {
      const dashboard = await apiService.getDashboard(targetPeriod);
      set({
        dashboard,
        currentPeriod: targetPeriod,
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      });
    }
  },

  setPeriod: (period: Period) => {
    set({ currentPeriod: period });
    get().fetchDashboard(period);
  },

  clearError: () => set({ error: null }),
}));
