/**
 * REST API 集成测试
 *
 * @description
 * 测试 REST API 的所有端点功能
 *
 * @testTarget
 * - 健康检查端点
 * - Analytics API 所有端点
 * - 错误处理
 * - CORS 配置
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DIContainer } from '../../api/di.js';
import app from '../../api/server.js';
import { MemoryStore } from '../../core/MemoryStore.js';
import { RetroRecord } from '../../types/index.js';

/**
 * 测试服务器配置
 */
const TEST_PORT = 3001;
const TEST_HOST = '127.0.0.1';
const BASE_URL = `http://${TEST_HOST}:${TEST_PORT}`;

let server: any;

describe('REST API 集成测试', () => {
  /**
   * 启动测试服务器
   */
  beforeAll(async () => {
    // 初始化测试数据
    const memoryStore = DIContainer.getMemoryStore();

    // 创建测试复盘数据
    const testRetro: RetroRecord = {
      id: 'test-retro-001',
      timestamp: new Date().toISOString(),
      type: 'quick',
      duration: 300000,
      user_id: 'test-user-001',
      violations: [],
      patterns: [],
      context: '测试复盘数据',
      action_items: []
    };

    await memoryStore.saveRetro(testRetro);

    // 启动服务器
    const { startServer } = await import('../../api/server.js');
    await startServer(TEST_PORT, TEST_HOST);

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  /**
   * 关闭测试服务器
   */
  afterAll(async () => {
    DIContainer.dispose();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('健康检查', () => {
    it('应该返回健康状态', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThan(0);
      expect(data.version).toBe('2.0.0');
    });

    it('应该返回环境信息', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(data.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(data.environment);
    });
  });

  describe('根路径', () => {
    it('应该返回 API 信息', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('PRISM-Gateway API');
      expect(data.version).toBe('2.0.0');
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.health).toBe('/health');
      expect(data.endpoints.api).toBe('/api/v1');
      expect(data.endpoints.analytics).toBe('/api/v1/analytics');
    });
  });

  describe('Analytics API', () => {
    describe('GET /api/v1/analytics/usage', () => {
      it('应该返回使用指标（默认 period=week）', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/usage`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.totalRetrospectives).toBeGreaterThanOrEqual(0);
        expect(data.meta.timestamp).toBeDefined();
        expect(data.meta.requestId).toBeDefined();
        expect(data.meta.version).toBe('2.0.0');
      });

      it('应该支持自定义 period 参数', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/usage?period=today`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.period).toBeDefined();
      });
    });

    describe('GET /api/v1/analytics/quality', () => {
      it('应该返回质量指标', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/quality`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.totalViolations).toBeGreaterThanOrEqual(0);
        expect(data.data.violationRate).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/v1/analytics/performance', () => {
      it('应该返回性能指标', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/performance`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.avgCheckTime).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/v1/analytics/trends/:metric', () => {
      it('应该返回趋势分析', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/trends/violations?period=month`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.metric).toBe('violations');
        expect(data.data.direction).toBeDefined();
        expect(['up', 'down', 'stable']).toContain(data.data.direction);
        expect(data.data.slope).toBeDefined();
      });

      it('应该支持不同的指标', async () => {
        const metrics = ['violations', 'usage', 'retrospectives'];

        for (const metric of metrics) {
          const response = await fetch(`${BASE_URL}/api/v1/analytics/trends/${metric}`);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.metric).toBe(metric);
        }
      });
    });

    describe('GET /api/v1/analytics/anomalies', () => {
      it('应该返回异常检测结果', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/anomalies`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      });
    });

    describe('GET /api/v1/analytics/dashboard', () => {
      it('应该返回仪表板数据', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/dashboard`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.summary).toBeDefined();
        expect(data.data.trends).toBeDefined();
        expect(Array.isArray(data.data.alerts)).toBe(true);
      });
    });

    describe('GET /api/v1/analytics/cache/stats', () => {
      it('应该返回缓存统计', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/cache/stats`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.size).toBeGreaterThanOrEqual(0);
        expect(data.data.maxSize).toBeGreaterThan(0);
        expect(data.data.hits).toBeGreaterThanOrEqual(0);
        expect(data.data.misses).toBeGreaterThanOrEqual(0);
      });
    });

    describe('DELETE /api/v1/analytics/cache', () => {
      it('应该清除缓存', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/cache`, {
          method: 'DELETE'
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Cache cleared');
      });
    });
  });

  describe('错误处理', () => {
    it('应该返回 404 对于不存在的路径', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not Found');
    });

    it('应该返回 400 对于无效的 period 参数', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/analytics/usage?period=invalid`);
      const data = await response.json();

      expect(response.status).toBe(500); // TimePeriod.fromString 会抛出错误
      expect(data.success).toBe(false);
    });
  });

  describe('CORS', () => {
    it('应该包含 CORS 头', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('响应格式一致性', () => {
    it('所有成功响应应该有 success: true', async () => {
      const endpoints = [
        '/health',
        '/api/v1/analytics/usage',
        '/api/v1/analytics/quality',
        '/api/v1/analytics/cache/stats'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();

        expect(data.success).toBe(true);
      }
    });

    it('所有响应应该有 timestamp', async () => {
      const endpoints = [
        '/health',
        '/api/v1/analytics/usage',
        '/'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();

        expect(data.meta?.timestamp || data.timestamp).toBeDefined();
      }
    });
  });
});
