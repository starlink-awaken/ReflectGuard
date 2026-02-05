/**
 * Analytics API 路由
 *
 * @description
 * PRISM-Gateway Analytics 模块的 REST API 端点
 *
 * @remarks
 * 所有端点遵循 RESTful 设计原则：
 * - 统一的响应格式
 * - 适当的 HTTP 状态码
 * - 完整的错误处理
 *
 * @example
 * ```typescript
 * // 获取使用指标
 * GET /api/v1/analytics/usage?period=week
 *
 * // 获取趋势分析
 * GET /api/v1/analytics/trends/violations?period=month
 *
 * // 获取仪表板
 * GET /api/v1/analytics/dashboard?period=week
 * ```
 */

import { Hono } from 'hono';
import {
  AnalyticsService,
  TimePeriod
} from '../../core/analytics/index-full.js';
import { CacheKey } from '../../core/analytics/cache/CacheKey.js';

// 创建 Hono 应用
const app = new Hono();

/**
 * 创建 Analytics 服务实例
 *
 * @remarks
 * TODO: 从依赖注入获取 AnalyticsService
 * 当前：创建新实例（需要传入 MemoryStore）
 */
const createAnalyticsService = (): AnalyticsService => {
  // TODO: 从主应用获取 MemoryStore 实例
  // const memoryStore = app.get('memoryStore') as MemoryStore;
  // return new AnalyticsService({ memoryStore });

  throw new Error('AnalyticsService dependency injection not implemented');
};

// 创建 Analytics 服务实例（占位符）
let analyticsService: AnalyticsService | null = null;

/**
 * 初始化 Analytics 服务
 *
 * @param service - AnalyticsService 实例
 */
export function initAnalytics(service: AnalyticsService): void {
  analyticsService = service;
}

/**
 * GET /api/v1/analytics/usage
 *
 * 获取使用指标
 *
 * @query period - 时间范围
 * @returns 使用指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/usage?period=week
 * ```
 */
app.get('/usage', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const periodParam = c.req.query('period') || 'week';
    const period = TimePeriod.fromString(periodParam);

    const metrics = await analyticsService.getUsageMetrics(period);

    return c.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/quality
 *
 * 获取质量指标
 *
 * @query period - 时间范围
 * @returns 质量指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/quality?period=month
 * ```
 */
app.get('/quality', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const periodParam = c.req.query('period') || 'week';
    const period = TimePeriod.fromString(periodParam);

    const metrics = await analyticsService.getQualityMetrics(period);

    return c.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/performance
 *
 * 获取性能指标
 *
 * @query period - 时间范围
 * @returns 性能指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/performance?period=today
 * ```
 */
app.get('/performance', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const periodParam = c.req.query('period') || 'week';
    const period = TimePeriod.fromString(periodParam);

    const metrics = await analyticsService.getPerformanceMetrics(period);

    return c.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/trends/:metric
 *
 * 获取趋势分析
 *
 * @param metric - 指标名称
 * @query period - 时间范围
 * @returns 趋势分析结果
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/trends/violations?period=month
 * ```
 */
app.get('/trends/:metric', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const metric = c.req.param('metric');
    const periodParam = c.req.query('period') || 'month';
    const period = TimePeriod.fromString(periodParam);

    const analysis = await analyticsService.getTrendAnalysis(metric, period);

    return c.json({
      success: true,
      data: {
        metric,
        period: period.toString(),
        ...analysis
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/anomalies
 *
 * 获取异常检测结果
 *
 * @returns 异常列表
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/anomalies
 * ```
 */
app.get('/anomalies', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const anomalies = await analyticsService.detectAnomalies();

    return c.json({
      success: true,
      data: anomalies,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/dashboard
 *
 * 获取仪表板数据（综合）
 *
 * @query period - 时间范围
 * @returns 仪表板数据
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/dashboard?period=week
 * ```
 */
app.get('/dashboard', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const periodParam = c.req.query('period') || 'week';
    const period = TimePeriod.fromString(periodParam);

    const dashboard = await analyticsService.getDashboard(period);

    return c.json({
      success: true,
      data: dashboard,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/v1/analytics/cache/stats
 *
 * 获取缓存统计信息
 *
 * @returns 缓存统计
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/cache/stats
 * ```
 */
app.get('/cache/stats', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    const stats = analyticsService.getCacheStats();

    return c.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * DELETE /api/v1/analytics/cache
 *
 * 清除缓存
 *
 * @returns 操作结果
 *
 * @example
 * ```bash
 * curl -X DELETE http://localhost:3000/api/v1/analytics/cache
 * ```
 */
app.delete('/cache', async (c) => {
  if (!analyticsService) {
    return c.json({
      success: false,
      error: 'Analytics service not initialized'
    }, 500);
  }

  try {
    await analyticsService.clearCache();

    return c.json({
      success: true,
      message: 'Cache cleared',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * 生成请求 ID
 *
 * @returns 请求 ID
 *
 * @private
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 导出 Analytics 路由
 */
export default app;
