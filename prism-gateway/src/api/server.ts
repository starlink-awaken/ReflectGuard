/**
 * PRISM-Gateway REST API Server
 *
 * @description
 * 主服务器文件，使用 Hono 框架提供 REST API 接口
 *
 * @features
 * - 统一路由管理（/api/v1/*）
 * - CORS 支持
 * - 全局错误处理
 * - 请求日志
 * - 健康检查端点
 * - 优雅关闭
 *
 * @example
 * ```bash
 * # 启动服务器
 * bun run src/api/server.ts
 *
 * # 健康检查
 * curl http://localhost:3000/health
 *
 * # API 调用
 * curl http://localhost:3000/api/v1/analytics/usage?period=week
 * ```
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// 导入依赖注入
import { DIContainer } from './di.js';

// 导入路由
import analyticsRouter from './routes/analytics.js';

// 创建主应用
const app = new Hono();

/**
 * 全局中间件配置
 */

// 1. CORS 支持
app.use('*', cors({
  origin: '*', // 生产环境应该限制具体域名
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// 2. 请求日志
app.use('*', logger());

// 3. JSON 美化输出（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use('*', prettyJSON());
}

/**
 * 健康检查端点
 *
 * @description
 * 用于负载均衡器和服务发现的健康检查
 *
 * @returns {200} 健康状态
 *
 * @example
 * ```bash
 * curl http://localhost:3000/health
 * # {"status":"ok","timestamp":"2026-02-05T...","uptime":123}
 * ```
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 根路径
 *
 * @description
 * API 信息端点
 *
 * @returns {200} API 信息
 *
 * @example
 * ```bash
 * curl http://localhost:3000/
 * # {"name":"PRISM-Gateway API","version":"2.0.0",...}
 * ```
 */
app.get('/', (c) => {
  return c.json({
    name: 'PRISM-Gateway API',
    version: '2.0.0',
    description: '统一的 7 维度复盘和 Gateway 系统',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      analytics: '/api/v1/analytics',
      docs: '/api/v1/docs'
    },
    documentation: 'https://github.com/danielmiessler/prism-gateway',
    repository: 'https://github.com/danielmiessler/prism-gateway'
  });
});

/**
 * API v1 路由组
 *
 * @description
 * 所有 v1 API 端点都挂载在 /api/v1 下
 */

// Analytics 路由
app.route('/api/v1/analytics', analyticsRouter);

/**
 * 404 处理
 *
 * @description
 * 捕获所有未匹配的路由
 */
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: `路径 ${c.req.path} 不存在`,
    docs: '/api/v1/docs'
  }, 404);
});

/**
 * 全局错误处理
 *
 * @description
 * 捕获所有未处理的错误
 */
app.onError((err, c) => {
  console.error('Unhandled error:', err);

  return c.json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || 'unknown'
    }
  }, 500);
});

/**
 * 启动服务器
 *
 * @description
 * 启动 HTTP 服务器监听请求
 *
 * @param port - 监听端口（默认 3000）
 * @param hostname - 监听地址（默认 0.0.0.0）
 */
export async function startServer(
  port: number = 3000,
  hostname: string = '0.0.0.0'
): Promise<void> {
  // 初始化依赖注入容器
  DIContainer.initialize();

  // 初始化 Analytics 路由
  const analyticsService = DIContainer.getAnalyticsService();
  const { initAnalytics } = await import('./routes/analytics.js');
  initAnalytics(analyticsService);

  const server = serve({
    fetch: app.fetch,
    port,
    hostname
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║          PRISM-Gateway REST API Server                   ║
╠════════════════════════════════════════════════════════════╣
║  Version:     2.0.0                                       ║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(20)}║
║  URL:         http://${hostname}:${port}                   ║
║  Health:      http://${hostname}:${port}/health            ║
║  API:         http://${hostname}:${port}/api/v1            ║
╚════════════════════════════════════════════════════════════╝
  `);

  // 优雅关闭
  const shutdown = async () => {
    console.log('\n🛑 正在关闭服务器...');
    DIContainer.dispose();
    server.close();
    console.log('✅ 服务器已关闭');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * 直接运行此文件时启动服务器
 */
if (import.meta.main) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const hostname = process.env.HOSTNAME || '0.0.0.0';

  startServer(port, hostname).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

/**
 * 导出应用实例（用于测试）
 */
export default app;
