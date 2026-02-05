/**
 * TrendAggregator - 趋势指标聚合器
 *
 * @description
 * 聚合趋势指标（违规趋势、改进率、Top 违规）
 */

import type { IAggregator } from './IAggregator.js';
import type { TimePeriod } from '../models/TimePeriod.js';
import type { TrendMetrics, TopViolation } from '../models/Metrics.js';
import type { ViolationRecord } from '../../types/index.js';
import { MemoryStore } from '../../core/MemoryStore.js';

/**
 * TrendAggregator 类
 *
 * @description
 * 聚合趋势指标
 *
 * @example
 * ```typescript
 * const aggregator = new TrendAggregator(memoryStore);
 * const violations = await reader.readAll();
 * const trends = await aggregator.aggregate(violations, TimePeriod.week());
 * console.log(`违规趋势: ${trends.violationTrend}`);
 * ```
 */
export class TrendAggregator implements IAggregator<ViolationRecord, TrendMetrics> {
  private readonly memoryStore: MemoryStore;

  /**
   * 构造函数
   *
   * @param memoryStore - MemoryStore 实例
   */
  constructor(memoryStore: MemoryStore) {
    this.memoryStore = memoryStore;
  }

  /**
   * 聚合趋势指标
   *
   * @param violations - 违规记录列表
   * @param period - 时间范围
   * @returns 趋势指标
   */
  async aggregate(
    violations: ViolationRecord[],
    period: TimePeriod
  ): Promise<TrendMetrics> {
    // 按原则ID分组
    const byPrinciple = this.groupByPrinciple(violations);

    // 提取原则名称映射
    const principleNames = this.extractPrincipleNames(violations);

    // 计算趋势（与上一周期对比）
    const violationTrend = this.calculateTrend(violations.length);

    // 计算改进率（与估算的基准值对比）
    const improvementRate = this.calculateImprovementRate(violations.length);

    // Top 违规
    const topViolations = this.getTopViolations(byPrinciple, principleNames, 5);

    return {
      violationTrend,
      improvementRate,
      topViolations,
      period: period.toString(),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * 增量聚合
   *
   * @param previous - 上次聚合结果
   * @param newData - 新增违规记录
   * @returns 更新后的趋势指标
   */
  async aggregateIncremental(
    previous: TrendMetrics,
    newData: ViolationRecord[]
  ): Promise<TrendMetrics> {
    // TODO: 实现真正的增量更新
    // 当前：返回原值（趋势分析需要历史数据）
    return {
      ...previous,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * 按原则ID分组
   *
   * @param violations - 违规记录列表
   * @returns 原则ID到违规次数的映射
   *
   * @private
   */
  private groupByPrinciple(violations: ViolationRecord[]): Map<string, number> {
    const grouped = new Map<string, number>();

    for (const v of violations) {
      const principleId = v.principle_id || 'unknown';
      const count = grouped.get(principleId) || 0;
      grouped.set(principleId, count + 1);
    }

    return grouped;
  }

  /**
   * 提取原则名称映射
   *
   * @param violations - 违规记录列表
   * @returns 原则ID到原则名称的映射
   *
   * @private
   */
  private extractPrincipleNames(violations: ViolationRecord[]): Map<string, string> {
    const names = new Map<string, string>();

    for (const v of violations) {
      if (v.principle_id && v.principle_name && !names.has(v.principle_id)) {
        names.set(v.principle_id, v.principle_name);
      }
    }

    return names;
  }

  /**
   * 获取 Top 违规
   *
   * @param grouped - 分组后的违规数据
   * @param principleNames - 原则名称映射
   * @param limit - 返回数量限制
   * @returns Top 违规列表
   *
   * @private
   */
  private getTopViolations(
    grouped: Map<string, number>,
    principleNames: Map<string, string>,
    limit: number
  ): TopViolation[] {
    // 转换为数组并排序
    const sorted = Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const total = sorted.reduce((sum, [_, count]) => sum + count, 0);

    return sorted.map(([principleId, count]) => {
      const principleName = principleNames.get(principleId) || principleId;
      const percentage = total > 0 ? count / total : 0;

      return {
        principleId,
        principleName,
        count,
        percentage: Math.round(percentage * 10000) / 10000 // 四舍五入到小数点后4位，保持0-1范围
      };
    });
  }

  /**
   * 计算趋势方向
   *
   * @param currentViolationCount - 当前周期的违规数量
   * @returns 趋势方向
   *
   * @private
   * @remarks
   * 基于违规数量估算趋势（简化版本，完整实现需要历史数据对比）
   *
   * 判断逻辑：
   * - 如果违规数为0，趋势为 stable（无数据）
   * - 如果违规数 > 100，趋势为 up（增加）
   * - 如果违规数 < 20，趋势为 down（减少）
   * - 其他情况为 stable（稳定）
   *
   * TODO: 实现真正的趋势分析（对比上一周期）
   *       需要存储历史数据或从数据源获取上一周期的违规数
   */
  private calculateTrend(currentViolationCount: number): 'up' | 'down' | 'stable' {
    // 无违规，趋势稳定
    if (currentViolationCount === 0) {
      return 'stable';
    }

    // 简化版本：基于绝对数量判断
    if (currentViolationCount > 100) {
      return 'up'; // 违规数较多，可能呈上升趋势
    } else if (currentViolationCount < 20) {
      return 'down'; // 违规数较少，可能呈下降趋势
    } else {
      return 'stable'; // 违规数适中，趋势稳定
    }
  }

  /**
   * 计算改进率
   *
   * @param currentViolationCount - 当前周期的违规数量
   * @returns 改进率（0-1）
   *
   * @private
   * @remarks
   * 基于违规数量估算改进率（简化版本）
   *
   * 计算逻辑（简化版本）：
   * - 违规数越少，改进率越高
   * - 使用非线性函数：1 / (1 + violationCount / 50)
   *
   * TODO: 计算违规减少的百分比
   *       需要对比当前周期和上一周期的违规数量
   *       improvementRate = (previousCount - currentCount) / previousCount
   */
  private calculateImprovementRate(currentViolationCount: number): number {
    // 简化版本：基于当前违规数估算
    // 违规数越少，改进率越高
    if (currentViolationCount === 0) {
      return 1.0; // 无违规，完全改进
    }

    // 使用非线性函数计算改进率
    // 当违规数为0时为1.0，违规数为50时为0.5，违规数为100时为0.33
    return 1 / (1 + currentViolationCount / 50);
  }
}
