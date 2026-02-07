/**
 * Analytics CRUD Schema
 *
 * @description
 * Zod schemas for Analytics API CRUD operations
 *
 * @module api/validation/schemas/analytics
 */

import { z } from 'zod';

/**
 * 创建分析记录 Schema
 */
export const CreateRecordSchema = z.object({
  type: z.enum(['custom', 'scheduled', 'adhoc'], {
    errorMap: () => ({ message: 'type 必须是 custom、scheduled 或 adhoc 之一' })
  }),
  name: z.string().min(1).max(100, {
    errorMap: () => ({ message: 'name 长度必须在 1-100 之间' })
  }),
  description: z.string().max(500).optional(),
  config: z.object({
    metrics: z.array(z.string()).optional(),
    period: z.enum(['today', 'week', 'month', 'year', 'all']).optional(),
    filters: z.record(z.any()).optional()
  }).optional()
});

/**
 * 更新分析记录 Schema
 */
export const UpdateRecordSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: z.object({
    metrics: z.array(z.string()).optional(),
    period: z.enum(['today', 'week', 'month', 'year', 'all']).optional(),
    filters: z.record(z.any()).optional()
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: '至少需要提供一个要更新的字段'
});

/**
 * 分页查询 Schema
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * 记录过滤 Schema
 */
export const RecordFilterSchema = z.object({
  type: z.enum(['custom', 'scheduled', 'adhoc']).optional(),
  name: z.string().optional()
});

/**
 * 记录ID参数 Schema
 */
export const RecordIdSchema = z.string().min(1, {
  errorMap: () => ({ message: 'recordId 不能为空' })
});
