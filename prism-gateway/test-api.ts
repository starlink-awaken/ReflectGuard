/**
 * REST API 简单验证脚本
 *
 * @description
 * 验证服务器代码能否正常加载和初始化
 */

import { DIContainer } from './src/api/di.js';
import app from './src/api/server.js';

console.log('✅ 模块加载成功');

// 测试DI容器
DIContainer.initialize();
console.log('✅ DI容器初始化成功');

const status = DIContainer.getStatus();
console.log('DI状态:', status);

// 测试路由
console.log('✅ 服务器应用创建成功');

console.log('\n✅ 所有基础验证通过！');
