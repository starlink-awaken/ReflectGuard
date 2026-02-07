import type { ApiResponse, Dashboard, UsageMetrics, TrendData, Period } from '../types/api';

const API_BASE = '/api/v1/analytics';

export class APIService {
  /**
   * Fetch dashboard data for a given period
   */
  async getDashboard(period: Period = 'week'): Promise<Dashboard> {
    const response = await fetch(`${API_BASE}/dashboard?period=${period}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
    }
    const json: ApiResponse<Dashboard> = await response.json();
    return json.data;
  }

  /**
   * Fetch usage metrics
   */
  async getUsageMetrics(period: Period = 'week'): Promise<UsageMetrics> {
    const response = await fetch(`${API_BASE}/usage?period=${period}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch usage metrics: ${response.statusText}`);
    }
    const json: ApiResponse<UsageMetrics> = await response.json();
    return json.data;
  }

  /**
   * Fetch trend data for a specific metric
   */
  async getTrend(metric: string, period: Period = 'week'): Promise<TrendData> {
    const response = await fetch(`${API_BASE}/trends/${metric}?period=${period}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trend: ${response.statusText}`);
    }
    const json: ApiResponse<TrendData> = await response.json();
    return json.data;
  }
}

// Export singleton instance
export const apiService = new APIService();
