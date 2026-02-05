/**
 * AnalyticsService - Analytics 主服务
 *
 * @description
 * 编排所有聚合器和分析器，提供统一的 Analytics 查询接口
 *
 * @remarks
 * 核心职责：
 * 1. 编排聚合器和分析器
 * 2. 管理缓存
 * 3. 提供查询接口
 */

import type { TimePeriod } from '../models/TimePeriod.js';
import type {
  UsageMetrics,
  QualityMetrics,
  PerformanceMetrics,
  TrendMetrics,
  TrendData,
  DashboardData,
  Anomaly
} from '../models/Metrics.js';
import type { DataSourceMetadata } from '../models/Metrics.js';

import type { IDataReader } from './readers/IDataReader.js';
import type { RetroRecord } from '../../types/index.js';
import type { ViolationRecord } from '../../types/index.js';
import type { MetricsRecord } from './models/Metrics.js';

import {
  CacheManager,
  CacheKey,
  UsageAggregator,
  QualityAggregator,
  PerformanceAggregator,
  TrendAggregator,
  TrendAnalyzer,
  AnomalyDetector
} from './index-full.js';
import { MemoryStore } from '../MemoryStore.js';

/**
 * AnalyticsService 配置
 */
export interface AnalyticsServiceConfig {
  /**
   * MemoryStore 实例
   */
  memoryStore: MemoryStore;

  /**
   * 缓存管理器（可选，默认创建新的）
   */
  cache?: CacheManager;

  /**
   * 缓存容量（默认 1000）
   */
  cacheSize?: number;

  /**
   * 默认 TTL（毫秒，默认 5 分钟）
   */
  defaultTTL?: number;
}

/**
 * AnalyticsService 类
 *
 * @description
 * Analytics 模块的主服务类
 *
 * @example
 * ```typescript
 * const service = new AnalyticsService({ memoryStore });
 * const metrics = await service.getUsageMetrics(TimePeriod.week());
 * const trend = await service.getTrendAnalysis('violations', TimePeriod.month());
 * const anomalies = await service.detectAnomalies();
 * ```
 */
export class AnalyticsService {
  private readonly retroReader: IDataReader<RetroRecord>;
  private readonly violationReader: IDataReader<ViolationRecord>;
  private readonly metricsReader: IDataReader<MetricsRecord>;

  private readonly usageAggregator: UsageAggregator;
  private readonly qualityAggregator: QualityAggregator;
  private readonly performanceAggregator: PerformanceAggregator;
  private readonly trendAggregator: TrendAggregator;

  private readonly trendAnalyzer: TrendAnalyzer;
  private readonly anomalyDetector: AnomalyDetector;

  private readonly cache: CacheManager;
  private readonly memoryStore: MemoryStore;

  /**
   * 构造函数
   *
   * @param config - 配置选项
   */
  constructor(config: AnalyticsServiceConfig) {
    this.memoryStore = config.memoryStore;

    // TODO: 使用实际的Reader类替代内联实现（Bun模块解析问题）
    // 当前：内联实现作为临时解决方案
    // 未来：
    // this.retroReader = new RetroDataReader({ memoryStore: this.memoryStore });
    // this.violationReader = new ViolationDataReader({});
    // this.metricsReader = new MetricsDataReader({});

    // 初始化数据读取器（内联实现）
    this.retroReader = {
      async read(startTime, endTime) {
        const retros = await this.memoryStore.listAllRetros();
        return retros.filter(r => {
          const timestamp = new Date(r.timestamp);
          return timestamp >= startTime && timestamp <= endTime;
        });
      },
      async readAll() {
        return this.memoryStore.listAllRetros();
      },
      async getMetadata() {
        const all = await this.memoryStore.listAllRetros();
        if (all.length === 0) {
          return {
            type: 'retrospective',
            count: 0,
            oldestTimestamp: null,
            newestTimestamp: null
          };
        }
        const sorted = [...all].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return {
          type: 'retrospective',
          count: all.length,
          oldestTimestamp: sorted[0].timestamp,
          newestTimestamp: sorted[sorted.length - 1].timestamp
        };
      }
    };

    this.violationReader = {
      async read(startTime, endTime) {
        // TODO: 从 violations.jsonl 读取
        return [];
      },
      async readAll() {
        // TODO: 从 violations.jsonl 读取
        return [];
      },
      async getMetadata() {
        return {
          type: 'violation',
          count: 0,
          oldestTimestamp: null,
          newestTimestamp: null
        };
      }
    };

    this.metricsReader = {
      async read(startTime, endTime) {
        // TODO: 从 metrics 存储读取
        return [];
      },
      async readAll() {
        // TODO: 从 metrics 存储读取
        return [];
      },
      async getMetadata() {
        return {
          type: 'metrics',
          count: 0,
          oldestTimestamp: null,
          newestTimestamp: null
        };
      }
    };

    // 初始化聚合器
    this.usageAggregator = new UsageAggregator();
    this.qualityAggregator = new QualityAggregator();
    this.performanceAggregator = new PerformanceAggregator();
    this.trendAggregator = new TrendAggregator(this.memoryStore);

    // 初始化分析器
    this.trendAnalyzer = new TrendAnalyzer();
    this.anomalyDetector = new AnomalyDetector();

    // 初始化缓存
    this.cache = config.cache || new CacheManager({
      maxSize: config.cacheSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000 // 5 分钟
    });
  }

  /**
   * 获取使用指标（带缓存）
   *
   * @param period - 时间范围
   * @returns 使用指标
   */
  async getUsageMetrics(period: TimePeriod): Promise<UsageMetrics> {
    const cacheKey = CacheKey.forUsage(period);
    const cached = await this.cache.get<UsageMetrics>(cacheKey);

    if (cached) {
      return cached;
    }

    // 读取数据
    const retros = await this.retroReader.readAll();

    // 聚合
    const metrics = await this.usageAggregator.aggregate(
      retros as any,
      period
    );

    // 缓存结果（5分钟 TTL）
    await this.cache.set(cacheKey, metrics, 5 * 60 * 1000);

    return metrics;
  }

  /**
   * 获取质量指标（带缓存）
   *
   * @param period - 时间范围
   * @returns 质量指标
   */
  async getQualityMetrics(period: TimePeriod): Promise<QualityMetrics> {
    const cacheKey = CacheKey.forQuality(period);
    const cached = await this.cache.get<QualityMetrics>(cacheKey);

    if (cached) {
      return cached;
    }

    // 读取数据
    const violations = await this.violationReader.readAll();

    // 聚合
    const metrics = await this.qualityAggregator.aggregate(violations, period);

    // 缓存结果
    await this.cache.set(cacheKey, metrics, 5 * 60 * 1000);

    return metrics;
  }

  /**
   * 获取性能指标（带缓存）
   *
   * @param period - 时间范围
   * @returns 性能指标
   */
  async getPerformanceMetrics(period: TimePeriod): Promise<PerformanceMetrics> {
    const cacheKey = CacheKey.forPerformance(period);
    const cached = await this.cache.get<PerformanceMetrics>(cacheKey);

    if (cached) {
      return cached;
    }

    // 读取数据
    const metrics = await this.metricsReader.readAll();

    // 聚合
    const perfMetrics = await this.performanceAggregator.aggregate(metrics, period);

    // 缓存结果
    await this.cache.set(cacheKey, perfMetrics, 5 * 60 * 1000);

    return perfMetrics;
  }

  /**
   * 获取趋势分析
   *
   * @param metric - 指标名称
   * @param period - 时间范围
   * @returns 趋势分析结果
   */
  async getTrendAnalysis(
    metric: string,
    period: TimePeriod
  ): Promise<TrendAnalysis> {
    const cacheKey = CacheKey.forTrend(metric, period);
    const cached = await this.cache.get<TrendAnalysis>(cacheKey);

    if (cached) {
      return cached;
    }

    // TODO: 构建趋势数据
    const trendData: TrendData = {
      metric,
      period: period.toString(),
      points: [] // TODO: 从历史数据构建
    };

    // 分析
    const analysis = await this.trendAnalyzer.analyze(trendData);

    // 缓存结果
    await this.cache.set(cacheKey, analysis, 5 * 60 * 1000);

    return analysis;
  }

  /**
   * 检测异常
   *
   * @returns 异常列表
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const cacheKey = CacheKey.forAnomalies();
    const cached = await this.cache.get<Anomaly[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // TODO: 构建数据
    const data = {} as any;

    // 检测
    const anomalies = await this.anomalyDetector.analyze(data);

    // 缓存结果（较短 TTL，因为异常需要及时检测）
    await this.cache.set(cacheKey, anomalies, 60 * 1000); // 1 分钟 TTL

    return anomalies;
  }

  /**
   * 获取概览仪表板数据（综合）
   *
   * @param period - 时间范围
   * @returns 仪表板数据
   */
  async getDashboard(period: TimePeriod): Promise<DashboardData> {
    const cacheKey = CacheKey.forDashboard(period);
    const cached = await this.cache.get<DashboardData>(cacheKey);

    if (cached) {
      return cached;
    }

    // 并行获取所有指标
    const [usage, quality, performance, anomalies] = await Promise.all([
      this.getUsageMetrics(period),
      this.getQualityMetrics(period),
      this.getPerformanceMetrics(period),
      this.detectAnomalies()
    ]);

    // 获取趋势分析
    const trendAnalysis = await this.getTrendAnalysis('violations', period);

    // 组装仪表板数据
    const dashboard: DashboardData = {
      summary: {
        totalChecks: usage.totalChecks,
        totalRetrospectives: usage.totalRetrospectives,
        avgViolationRate: quality.violationRate,
        avgPerformance: performance.avgCheckTime
      },
      trends: {
        violationTrend: 'stable', // TODO: 从 trendAnalysis 提取
        usageTrend: 'stable'
      },
      alerts: anomalies,
      topViolations: [], // TODO: 从聚合器获取
      period: period.toString(),
      generatedAt: new Date().toISOString()
    };

    // 缓存结果
    await this.cache.set(cacheKey, dashboard, 5 * 60 * 1000);

    return dashboard;
  }

  /**
   * 获取缓存统计
   *
   * @returns 缓存统计信息
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * 清除特定模式的缓存
   *
   * @param pattern - 缓存键模式
   * @returns 清理的项数
   */
  async clearCachePattern(pattern: string): Promise<number> {
    return await this.cache.deletePattern(pattern);
  }
}
