/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: string[];
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Dashboard Types
 */
export interface Dashboard {
  summary: DashboardSummary;
  quality: QualityMetrics;
  performance: PerformanceMetrics;
  trends: TrendMetrics;
  alerts: Alert[];
}

export interface DashboardSummary {
  totalChecks: number;
  totalViolations: number;
  totalRetros: number;
  activeUsers: number;
}

export interface QualityMetrics {
  violationRate: number;
  falsePositiveRate: number;
  topViolatedPrinciples: Array<{
    principle: string;
    count: number;
  }>;
}

export interface PerformanceMetrics {
  avgCheckTime: number;
  p50CheckTime: number;
  p95CheckTime: number;
  p99CheckTime: number;
  slowCheckRate: number;
}

export interface TrendMetrics {
  violationTrend: 'up' | 'down' | 'stable';
  checkTrend: 'up' | 'down' | 'stable';
  qualityTrend: 'up' | 'down' | 'stable';
}

export interface Alert {
  id: string;
  type: 'violation_spike' | 'usage_drop' | 'performance_degradation' | 'quality_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  description: string;
  suggestion: string;
  timestamp: string;
}

/**
 * Analytics Types
 */
export interface UsageMetrics {
  totalChecks: number;
  totalRetros: number;
  activeUsers: number;
  avgCheckDuration: number;
  period: string;
}

export interface TrendData {
  data: Array<{
    date: string;
    value: number;
  }>;
  direction: 'up' | 'down' | 'stable';
  slope: number;
  confidence: number;
}

/**
 * WebSocket Types
 */
export interface WebSocketMessage {
  type: 'analytics:update' | 'analytics:record:created' | 'analytics:record:updated' | 'analytics:record:deleted' | 'alert';
  data: unknown;
  timestamp: string;
}

export interface WebSocketEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
}

/**
 * Period Type
 */
export type Period = 'today' | 'week' | 'month' | 'year' | 'all';
