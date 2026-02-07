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
 * - 输入验证（ERR_1001）
 *
 * @security
 * - 所有查询参数都经过 Zod 验证
 * - 防止注入攻击
 * - 防止参数污染
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
import { z } from 'zod';
import {
  AnalyticsService,
  TimePeriod
} from '../../core/analytics/index-full.js';
import {
  queryValidator,
  paramValidator,
  bodyValidator
} from '../validator/index.js';
import { AnalyticsRecordsStore } from '../stores/AnalyticsRecordsStore.js';
import type { WebSocketServer } from '../websocket/WebSocketServer.js';
import {
  errorResponse as apiErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createConflictErrorResponse,
  ApiErrorCode
} from '../utils/errorResponse.js';

// 创建 Hono 应用
const app = new Hono();

// ============================================================================
// WebSocket 事件推送（Task 74: 实时事件推送集成）
// ============================================================================

/**
 * WebSocket服务器实例
 */
let wsServer: WebSocketServer | null = null;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Period 查询参数 Schema
 *
 * @description
 * 映射到 TimePeriod 的有效值
 */
const PeriodQuerySchema = z.enum(['today', 'week', 'month', 'year', 'all'], {
  errorMap: () => ({ message: 'period 必须是 today、week、month、year 或 all 之一' })
});

/**
 * Metric 路径参数 Schema
 */
const MetricParamSchema = z.enum([
  'violations',
  'checks',
  'retros',
  'patterns',
  'traps',
  'quality',
  'usage',
  'performance'
], {
  errorMap: () => ({ message: 'metric 必须是有效的指标名称' })
});

// ============================================================================
// CRUD Schemas (Task 70: 输入验证中间件完整性)
// ============================================================================

/**
 * 记录类型枚举
 */
const RecordTypeEnum = z.enum(['custom', 'scheduled', 'adhoc'], {
  errorMap: () => ({ message: 'type 必须是 custom、scheduled 或 adhoc 之一' })
});

/**
 * 时间周期枚举
 */
const PeriodEnum = z.enum(['today', 'week', 'month', 'year', 'all'], {
  errorMap: () => ({ message: 'period 必须是 today、week、month、year 或 all 之一' })
});

/**
 * 创建分析记录请求体 Schema
 *
 * @description
 * 验证 POST /api/v1/analytics/records 的请求体
 */
const CreateRecordSchema = z.object({
  type: RecordTypeEnum,
  name: z.string()
    .min(1, 'name 不能为空')
    .max(100, 'name 最大长度为 100 字符')
    .trim(),
  description: z.string()
    .max(500, 'description 最大长度为 500 字符')
    .optional(),
  config: z.object({
    metrics: z.array(z.string()).optional(),
    period: PeriodEnum.optional(),
    filters: z.record(z.any()).optional()
  }).optional()
}).strict();

/**
 * 更新分析记录请求体 Schema
 *
 * @description
 * 验证 PUT /api/v1/analytics/records/:id 的请求体
 * 不使用 strict 模式，只验证提供的字段
 */
const UpdateRecordSchema = z.object({
  name: z.string()
    .min(1, 'name 不能为空')
    .max(100, 'name 最大长度为 100 字符')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'description 最大长度为 500 字符')
    .optional(),
  config: z.object({
    metrics: z.array(z.string()).optional(),
    period: PeriodEnum.optional(),
    filters: z.record(z.any()).optional()
  }).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提供一个要更新的字段' }
);

/**
 * 分页查询参数 Schema
 *
 * @description
 * 使用简单的字符串类型，避免 Zod 4.x 的 .optional() 兼容性问题
 */
const PaginationQuerySchema = z.object({
  page: z.string(),
  limit: z.string(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']),
  sortOrder: z.enum(['asc', 'desc']),
  type: z.enum(['custom', 'scheduled', 'adhoc'])
}).partial();

/**
 * 记录ID路径参数 Schema
 */
const RecordIdParamSchema = z.string()
  .min(1, 'id 不能为空')
  .refine(
    (val) => !val.includes('..') && !val.includes('/') && !val.includes('\\'),
    { message: 'id 包含非法字符' }
  );

/**
 * 将字符串 period 转换为 TimePeriod
 */
function parsePeriod(period: string): TimePeriod {
  switch (period) {
    case 'today':
      return TimePeriod.today();
    case 'week':
      return TimePeriod.week();
    case 'month':
      return TimePeriod.month();
    case 'year':
      return TimePeriod.year();
    case 'all':
      return TimePeriod.all();
    default:
      return TimePeriod.week();
  }
}

// ============================================================================
// WebSocket事件推送辅助函数（Task 74）
// ============================================================================

/**
 * 推送Analytics更新事件到所有WebSocket客户端
 *
 * @param eventType - 事件类型
 * @param data - 事件数据
 */
function broadcastAnalyticsEvent(eventType: string, data: any): void {
  if (!wsServer || !wsServer.isRunning()) {
    console.log('[Analytics] WebSocket server not running, skipping event broadcast');
    return;
  }

  try {
    wsServer.broadcast({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`[Analytics] Broadcasted event: ${eventType}`);
  } catch (error) {
    console.error(`[Analytics] Error broadcasting event:`, error);
  }
}

/**
 * 推送异常Alert事件
 *
 * @param anomaly - 异常数据
 */
function broadcastAlertEvent(anomaly: any): void {
  broadcastAnalyticsEvent('alert', {
    message: anomaly.description || '检测到异常',
    severity: anomaly.severity || 'medium',
    metric: anomaly.metric || 'unknown',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// 服务初始化
// ============================================================================

// 创建 Analytics 服务实例（占位符）
let analyticsService: AnalyticsService | null = null;

// 创建记录存储实例
const recordsStore = new AnalyticsRecordsStore();

/**
 * 初始化 Analytics 服务
 *
 * @param service - AnalyticsService 实例
 * @param websocketServer - WebSocket服务器实例（Task 74）
 */
export function initAnalytics(
  service: AnalyticsService,
  websocketServer?: WebSocketServer
): void {
  analyticsService = service;

  // 设置WebSocket服务器用于事件推送（Task 74）
  if (websocketServer) {
    wsServer = websocketServer;
    console.log('[Analytics] WebSocket server linked for event broadcasting');
  }
}

/**
 * 导出记录存储（用于测试）
 */
export function getRecordsStore(): AnalyticsRecordsStore {
  return recordsStore;
}

/**
 * 重置记录存储（用于测试）
 *
 * @description
 * 清空所有记录，用于测试隔离
 */
export function resetRecordsStore(): void {
  // 清空Map
  const store = getRecordsStore() as any;
  if (store.records && store.records.clear) {
    store.records.clear();
  }
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 成功响应格式
 */
function successResponse<T>(c: any, data: T, status: number = 200): Response {
  return c.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: '2.0.0'
    }
  }, status);
}

// ============================================================================
// 路由定义
// ============================================================================

/**
 * GET /api/v1/analytics/usage
 *
 * 获取使用指标
 *
 * @query period - 时间范围 (today|week|month|year|all)
 * @returns 使用指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/usage?period=week
 * ```
 */
app.get('/usage',
  queryValidator({ period: PeriodQuerySchema.optional() }),
  async (c) => {
    if (!analyticsService) {
      return errorResponse(c, 'Analytics service not initialized');
    }

    try {
      const query = c.get('validatedQuery');
      const period = parsePeriod(query.period || 'week');

      const metrics = await analyticsService.getUsageMetrics(period);
      return successResponse(c, metrics);
    } catch (error) {
      return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * GET /api/v1/analytics/quality
 *
 * 获取质量指标
 *
 * @query period - 时间范围 (today|week|month|year|all)
 * @returns 质量指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/quality?period=month
 * ```
 */
app.get('/quality',
  queryValidator({ period: PeriodQuerySchema.optional() }),
  async (c) => {
    if (!analyticsService) {
      return errorResponse(c, 'Analytics service not initialized');
    }

    try {
      const query = c.get('validatedQuery');
      const period = parsePeriod(query.period || 'week');

      const metrics = await analyticsService.getQualityMetrics(period);
      return successResponse(c, metrics);
    } catch (error) {
      return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * GET /api/v1/analytics/performance
 *
 * 获取性能指标
 *
 * @query period - 时间范围 (today|week|month|year|all)
 * @returns 性能指标
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/performance?period=today
 * ```
 */
app.get('/performance',
  queryValidator({ period: PeriodQuerySchema.optional() }),
  async (c) => {
    if (!analyticsService) {
      return errorResponse(c, 'Analytics service not initialized');
    }

    try {
      const query = c.get('validatedQuery');
      const period = parsePeriod(query.period || 'week');

      const metrics = await analyticsService.getPerformanceMetrics(period);
      return successResponse(c, metrics);
    } catch (error) {
      return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * GET /api/v1/analytics/trends/:metric
 *
 * 获取趋势分析
 *
 * @param metric - 指标名称
 * @query period - 时间范围 (today|week|month|year|all)
 * @returns 趋势分析结果
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/trends/violations?period=month
 * ```
 */
app.get('/trends/:metric',
  paramValidator({ metric: MetricParamSchema }),
  queryValidator({ period: PeriodQuerySchema.optional() }),
  async (c) => {
    if (!analyticsService) {
      return errorResponse(c, 'Analytics service not initialized');
    }

    try {
      const params = c.get('validatedParams');
      const query = c.get('validatedQuery');
      const period = parsePeriod(query.period || 'month');

      const analysis = await analyticsService.getTrendAnalysis(params.metric, period);

      return c.json({
        success: true,
        data: {
          metric: params.metric,
          period: query.period || 'month',
          ...analysis
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          version: '2.0.0'
        }
      });
    } catch (error) {
      return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

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
    return errorResponse(c, 'Analytics service not initialized');
  }

  try {
    const anomalies = await analyticsService.detectAnomalies();
    return successResponse(c, anomalies);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
  }
});

/**
 * GET /api/v1/analytics/dashboard
 *
 * 获取仪表板数据（综合）
 *
 * @query period - 时间范围 (today|week|month|year|all)
 * @returns 仪表板数据
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/v1/analytics/dashboard?period=week
 * ```
 */
app.get('/dashboard',
  queryValidator({ period: PeriodQuerySchema.optional() }),
  async (c) => {
    if (!analyticsService) {
      return errorResponse(c, 'Analytics service not initialized');
    }

    try {
      const query = c.get('validatedQuery');
      const period = parsePeriod(query.period || 'week');

      const dashboard = await analyticsService.getDashboard(period);
      return successResponse(c, dashboard);
    } catch (error) {
      return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

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
    return errorResponse(c, 'Analytics service not initialized');
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
    return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
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
    return errorResponse(c, 'Analytics service not initialized');
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
    return errorResponse(c, error instanceof Error ? error.message : 'Unknown error');
  }
});

// ============================================================================
// CRUD 路由 (Records) ⭐ NEW (v2.3.0)
// 已集成验证中间件 (Task 70)
// ============================================================================

/**
 * POST /api/v1/analytics/records
 *
 * 创建自定义分析记录
 *
 * @returns 创建的记录
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/v1/analytics/records \
 *   -H "Content-Type: application/json" \
 *   -d '{"type":"custom","name":"Weekly Report","config":{"period":"week"}}'
 * ```
 */
app.post('/records',
  bodyValidator(CreateRecordSchema),
  async (c) => {
    try {
      const body = c.get('validatedBody');
      const record = recordsStore.create(body);

      // Task 74: 推送记录创建事件
      broadcastAnalyticsEvent('analytics:record:created', {
        record,
        timestamp: new Date().toISOString()
      });

      return successResponse(c, record, 201);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return apiErrorResponse(c, ApiErrorCode.RESOURCE_ALREADY_EXISTS, error.message);
        }
        return apiErrorResponse(c, ApiErrorCode.VALIDATION_ERROR, error.message);
      }
      return apiErrorResponse(c, ApiErrorCode.INTERNAL_ERROR, 'Unknown error');
    }
  }
);

/**
 * GET /api/v1/analytics/records
 *
 * 获取所有分析记录（支持分页）
 *
 * @returns 记录列表
 *
 * @example
 * ```bash
 * curl "http://localhost:3000/api/v1/analytics/records?page=1&limit=10"
 * ```
 */
app.get('/records',
  async (c) => {
    try {
      const rawQuery = c.req.query();

      // 解析并验证数字参数
      const page = rawQuery.page ? parseInt(rawQuery.page, 10) : 1;
      const limit = rawQuery.limit ? Math.min(parseInt(rawQuery.limit, 10), 100) : 20;

      // 验证解析结果
      if (isNaN(page) || page < 1) {
        return apiErrorResponse(c, ApiErrorCode.INVALID_FORMAT, 'page 必须是大于0的整数');
      }
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return apiErrorResponse(c, ApiErrorCode.INVALID_FORMAT, 'limit 必须是1-100之间的整数');
      }

      // 验证 sortBy
      const validSortBy = ['name', 'createdAt', 'updatedAt'];
      const sortBy = rawQuery.sortBy && validSortBy.includes(rawQuery.sortBy)
        ? rawQuery.sortBy
        : 'createdAt';

      // 验证 sortOrder
      const validSortOrder = ['asc', 'desc'];
      const sortOrder = rawQuery.sortOrder && validSortOrder.includes(rawQuery.sortOrder)
        ? rawQuery.sortOrder as 'asc' | 'desc'
        : 'desc';

      // 验证 type
      const validTypes = ['custom', 'scheduled', 'adhoc'];
      const type = rawQuery.type && validTypes.includes(rawQuery.type)
        ? rawQuery.type
        : undefined;

      const result = recordsStore.getPaginated({
        page,
        limit,
        type,
        sortBy,
        sortOrder
      });

      return c.json({
        success: true,
        data: result.data,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          version: '2.3.0'
        }
      });
    } catch (error) {
      return apiErrorResponse(c, ApiErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * GET /api/v1/analytics/records/:id
 *
 * 获取单个分析记录
 *
 * @returns 记录详情
 */
app.get('/records/:id',
  paramValidator({ id: RecordIdParamSchema }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const record = recordsStore.getById(params.id);

      if (!record) {
        return apiErrorResponse(c, ApiErrorCode.RESOURCE_NOT_FOUND, 'Record not found');
      }

      return successResponse(c, record);
    } catch (error) {
      return apiErrorResponse(c, ApiErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * PUT /api/v1/analytics/records/:id
 *
 * 更新分析记录
 *
 * @returns 更新后的记录
 */
app.put('/records/:id',
  paramValidator({ id: RecordIdParamSchema }),
  bodyValidator(UpdateRecordSchema),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      const updates = c.get('validatedBody');

      const record = recordsStore.update(params.id, updates);

      // Task 74: 推送记录更新事件
      broadcastAnalyticsEvent('analytics:record:updated', {
        id: params.id,
        record,
        updates,
        timestamp: new Date().toISOString()
      });

      return successResponse(c, record);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return apiErrorResponse(c, ApiErrorCode.RESOURCE_NOT_FOUND, error.message);
        }
        if (error.message.includes('already exists')) {
          return apiErrorResponse(c, ApiErrorCode.RESOURCE_ALREADY_EXISTS, error.message);
        }
        return apiErrorResponse(c, ApiErrorCode.VALIDATION_ERROR, error.message);
      }
      return apiErrorResponse(c, ApiErrorCode.INTERNAL_ERROR, 'Unknown error');
    }
  }
);

/**
 * DELETE /api/v1/analytics/records/:id
 *
 * 删除分析记录
 *
 * @returns 删除结果
 */
app.delete('/records/:id',
  paramValidator({ id: RecordIdParamSchema }),
  async (c) => {
    try {
      const params = c.get('validatedParams');
      recordsStore.delete(params.id);

      // Task 74: 推送记录删除事件
      broadcastAnalyticsEvent('analytics:record:deleted', {
        id: params.id,
        timestamp: new Date().toISOString()
      });

      return c.json({
        success: true,
        message: `Record ${params.id} deleted successfully`,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          version: '2.3.0'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return apiErrorResponse(c, ApiErrorCode.RESOURCE_NOT_FOUND, error.message);
      }
      return apiErrorResponse(c, ApiErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * 导出 Analytics 路由
 */
export default app;
