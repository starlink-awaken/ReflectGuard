/**
 * PerformanceAggregator - 性能指标聚合器
 *
 * @description
 * 聚合性能指标（平均检查时间、P95/P99 检查时间等）
 */

import type { IAggregator } from './IAggregator.js';
import type { TimePeriod } from '../models/TimePeriod.js';
import type { PerformanceMetrics } from '../models/Metrics.js';
import type { MetricsRecord } from '../models/Metrics.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * PerformanceAggregator 类
 *
 * @description
 * 聚合性能指标
 *
 * @example
 * ```typescript
 * const aggregator = new PerformanceAggregator();
 * const metrics = await reader.readAll();
 * const performance = await aggregator.aggregate(metrics, TimePeriod.week());
 * console.log(`平均检查时间: ${performance.avgCheckTime}ms`);
 * console.log(`P95 检查时间: ${performance.p95CheckTime}ms`);
 * ```
 */
export class PerformanceAggregator implements IAggregator<MetricsRecord, PerformanceMetrics> {
  /**
   * 聚合性能指标
   *
   * @param metrics - 指标记录列表
   * @param period - 时间范围
   * @returns 性能指标
   */
  async aggregate(
    metrics: MetricsRecord[],
    period: TimePeriod
  ): Promise<PerformanceMetrics> {
    // 提取检查时间
    const checkTimes = metrics
      .filter(m => m.checkTime && m.checkTime > 0)
      .map(m => m.checkTime!);

    // 提取提取时间
    const extractTimes = metrics
      .filter(m => m.extractTime && m.extractTime > 0)
      .map(m => m.extractTime!);

    return {
      avgCheckTime: MathUtils.mean(checkTimes),
      avgExtractTime: MathUtils.mean(extractTimes),
      p95CheckTime: MathUtils.percentile(checkTimes, 95),
      p99CheckTime: MathUtils.percentile(checkTimes, 99),
      minCheckTime: MathUtils.min(checkTimes),
      maxCheckTime: MathUtils.max(checkTimes),
      period: period.toString(),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * 增量聚合
   *
   * @param previous - 上次聚合结果
   * @param newData - 新增指标记录
   * @returns 更新后的性能指标
   *
   * @remarks
   * 注意：百分位数无法增量更新，需要重新计算
   */
  async aggregateIncremental(
    previous: PerformanceMetrics,
    newData: MetricsRecord[]
  ): Promise<PerformanceMetrics> {
    // 提取所有数据的检查时间（包括新数据和之前的数据）
    // TODO: 这里需要保存历史数据才能正确增量更新
    // 当前实现：仅基于新数据计算（简化版）

    const newCheckTimes = newData
      .filter(m => m.checkTime && m.checkTime > 0)
      .map(m => m.checkTime!);

    if (newCheckTimes.length === 0) {
      return previous;
    }

    // 计算新的平均值（加权平均）
    const oldAvg = previous.avgCheckTime;
    const oldCount = 100; // 假设旧数据有 100 条
    const newAvg = MathUtils.mean(newCheckTimes);
    const totalCount = oldCount + newCheckTimes.length;
    const updatedAvg = (oldAvg * oldCount + newAvg * newCheckTimes.length) / totalCount;

    return {
      ...previous,
      avgCheckTime: updatedAvg,
      calculatedAt: new Date().toISOString()
    };
  }
}
